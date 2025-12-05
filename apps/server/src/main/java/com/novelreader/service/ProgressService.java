package com.novelreader.service;

import com.novelreader.dto.PageResponse;
import com.novelreader.dto.progress.*;
import com.novelreader.entity.*;
import com.novelreader.exception.BusinessException;
import com.novelreader.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 阅读进度服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressService {

    private final ReadingProgressRepository progressRepository;
    private final BookmarkRepository bookmarkRepository;
    private final BookRepository bookRepository;
    private final ChapterRepository chapterRepository;
    private final UserRepository userRepository;

    // ==================== 阅读进度 ====================

    /**
     * 更新阅读进度
     */
    @Transactional
    public ProgressDTO updateProgress(Long userId, UpdateProgressRequest request) {
        Book book = bookRepository.findByIdAndUserId(request.getBookId(), userId)
            .orElseThrow(() -> BusinessException.notFound("书籍不存在"));

        ReadingProgress progress = progressRepository
            .findByUserIdAndBookId(userId, request.getBookId())
            .orElse(ReadingProgress.builder()
                .user(userRepository.getReferenceById(userId))
                .book(book)
                .build());

        progress.setChapterIndex(request.getChapterIndex());
        progress.setScrollPosition(request.getScrollPosition());
        progress.setProgressPercent(request.getProgressPercent());
        progress.setLastReadAt(LocalDateTime.now());

        progress = progressRepository.save(progress);
        log.debug("更新阅读进度: bookId={}, chapter={}", request.getBookId(), request.getChapterIndex());

        return toProgressDTO(progress, book);
    }

    /**
     * 获取某本书的阅读进度
     */
    public ProgressDTO getProgress(Long userId, Long bookId) {
        Book book = bookRepository.findByIdAndUserId(bookId, userId)
            .orElseThrow(() -> BusinessException.notFound("书籍不存在"));

        return progressRepository.findByUserIdAndBookId(userId, bookId)
            .map(p -> toProgressDTO(p, book))
            .orElse(ProgressDTO.builder()
                .bookId(bookId)
                .bookTitle(book.getTitle())
                .chapterIndex(0)
                .scrollPosition(0.0)
                .progressPercent(0.0)
                .build());
    }

    /**
     * 获取用户所有阅读进度
     */
    public List<ProgressDTO> getAllProgress(Long userId) {
        // 使用 JOIN FETCH 避免 N+1
        List<ReadingProgress> progressList = progressRepository.findByUserIdWithBook(userId);
        if (progressList.isEmpty()) {
            return List.of();
        }

        // 批量获取章节标题
        Map<String, String> chapterTitleMap = batchGetChapterTitles(progressList);

        return progressList.stream()
            .map(p -> toProgressDTOWithCache(p, p.getBook(), chapterTitleMap))
            .collect(Collectors.toList());
    }

    /**
     * 获取最近阅读
     */
    public List<ProgressDTO> getRecentReading(Long userId, int limit) {
        // 使用 JOIN FETCH 避免 N+1
        List<ReadingProgress> progressList = progressRepository.findRecentReadingWithBook(userId)
            .stream()
            .limit(limit)
            .collect(Collectors.toList());

        if (progressList.isEmpty()) {
            return List.of();
        }

        // 批量获取章节标题
        Map<String, String> chapterTitleMap = batchGetChapterTitles(progressList);

        return progressList.stream()
            .map(p -> toProgressDTOWithCache(p, p.getBook(), chapterTitleMap))
            .collect(Collectors.toList());
    }

    /**
     * 批量获取章节标题，避免 N+1 查询
     */
    private Map<String, String> batchGetChapterTitles(List<ReadingProgress> progressList) {
        // 收集所有需要查询的 (bookId, chapterIndex) 对
        List<Long> bookIds = progressList.stream()
            .map(p -> p.getBook().getId())
            .distinct()
            .collect(Collectors.toList());

        // 批量查询所有相关章节
        List<Chapter> chapters = chapterRepository.findByBookIdIn(bookIds);

        // 构建 "bookId-chapterIndex" -> title 的映射
        return chapters.stream()
            .collect(Collectors.toMap(
                c -> c.getBook().getId() + "-" + c.getChapterIndex(),
                Chapter::getTitle,
                (existing, replacement) -> existing // 处理重复键
            ));
    }

    /**
     * 使用缓存的章节标题构建 ProgressDTO
     */
    private ProgressDTO toProgressDTOWithCache(ReadingProgress progress, Book book, Map<String, String> chapterTitleMap) {
        String key = book.getId() + "-" + progress.getChapterIndex();
        String chapterTitle = chapterTitleMap.getOrDefault(key, "第" + (progress.getChapterIndex() + 1) + "章");

        return ProgressDTO.builder()
            .bookId(book.getId())
            .bookTitle(book.getTitle())
            .chapterIndex(progress.getChapterIndex())
            .chapterTitle(chapterTitle)
            .scrollPosition(progress.getScrollPosition())
            .progressPercent(progress.getProgressPercent())
            .lastReadAt(progress.getLastReadAt())
            .build();
    }

    // ==================== 书签 ====================

    /**
     * 创建书签
     */
    @Transactional
    public BookmarkDTO createBookmark(Long userId, CreateBookmarkRequest request) {
        Book book = bookRepository.findByIdAndUserId(request.getBookId(), userId)
            .orElseThrow(() -> BusinessException.notFound("书籍不存在"));

        Bookmark bookmark = Bookmark.builder()
            .user(userRepository.getReferenceById(userId))
            .book(book)
            .chapterIndex(request.getChapterIndex())
            .position(request.getPosition())
            .selectedText(request.getSelectedText())
            .note(request.getNote())
            .color(request.getColor())
            .build();

        bookmark = bookmarkRepository.save(bookmark);
        log.info("创建书签: bookId={}, chapter={}", request.getBookId(), request.getChapterIndex());

        return toBookmarkDTO(bookmark, book);
    }

    /**
     * 获取某本书的所有书签
     */
    public List<BookmarkDTO> getBookmarks(Long userId, Long bookId) {
        Book book = bookRepository.findByIdAndUserId(bookId, userId)
            .orElseThrow(() -> BusinessException.notFound("书籍不存在"));

        return bookmarkRepository
            .findByUserIdAndBookIdOrderByChapterIndexAscPositionAsc(userId, bookId)
            .stream()
            .map(b -> toBookmarkDTO(b, book))
            .collect(Collectors.toList());
    }

    /**
     * 获取用户所有书签（分页）
     */
    public PageResponse<BookmarkDTO> getAllBookmarks(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Bookmark> bookmarkPage = bookmarkRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<Bookmark> bookmarks = bookmarkPage.getContent();
        if (bookmarks.isEmpty()) {
            return PageResponse.<BookmarkDTO>builder()
                .content(List.of())
                .page(bookmarkPage.getNumber())
                .size(bookmarkPage.getSize())
                .totalElements(bookmarkPage.getTotalElements())
                .totalPages(bookmarkPage.getTotalPages())
                .first(bookmarkPage.isFirst())
                .last(bookmarkPage.isLast())
                .build();
        }

        // 批量获取 Book 信息，避免 N+1
        List<Long> bookIds = bookmarks.stream()
            .map(b -> b.getBook().getId())
            .distinct()
            .collect(Collectors.toList());
        Map<Long, Book> bookMap = bookRepository.findAllById(bookIds).stream()
            .collect(Collectors.toMap(Book::getId, b -> b));

        // 批量获取章节标题
        Map<String, String> chapterTitleMap = batchGetChapterTitlesForBookmarks(bookmarks, bookIds);

        List<BookmarkDTO> bookmarkDTOs = bookmarks.stream()
            .filter(b -> bookMap.containsKey(b.getBook().getId()))
            .map(b -> toBookmarkDTOWithCache(b, bookMap.get(b.getBook().getId()), chapterTitleMap))
            .collect(Collectors.toList());

        return PageResponse.<BookmarkDTO>builder()
            .content(bookmarkDTOs)
            .page(bookmarkPage.getNumber())
            .size(bookmarkPage.getSize())
            .totalElements(bookmarkPage.getTotalElements())
            .totalPages(bookmarkPage.getTotalPages())
            .first(bookmarkPage.isFirst())
            .last(bookmarkPage.isLast())
            .build();
    }

    /**
     * 批量获取书签的章节标题
     */
    private Map<String, String> batchGetChapterTitlesForBookmarks(List<Bookmark> bookmarks, List<Long> bookIds) {
        List<Chapter> chapters = chapterRepository.findByBookIdIn(bookIds);
        return chapters.stream()
            .collect(Collectors.toMap(
                c -> c.getBook().getId() + "-" + c.getChapterIndex(),
                Chapter::getTitle,
                (existing, replacement) -> existing
            ));
    }

    /**
     * 使用缓存构建 BookmarkDTO
     */
    private BookmarkDTO toBookmarkDTOWithCache(Bookmark bookmark, Book book, Map<String, String> chapterTitleMap) {
        String key = book.getId() + "-" + bookmark.getChapterIndex();
        String chapterTitle = chapterTitleMap.getOrDefault(key, "第" + (bookmark.getChapterIndex() + 1) + "章");

        return BookmarkDTO.builder()
            .id(bookmark.getId())
            .bookId(book.getId())
            .bookTitle(book.getTitle())
            .chapterIndex(bookmark.getChapterIndex())
            .chapterTitle(chapterTitle)
            .position(bookmark.getPosition())
            .selectedText(bookmark.getSelectedText())
            .note(bookmark.getNote())
            .color(bookmark.getColor())
            .createdAt(bookmark.getCreatedAt())
            .build();
    }

    /**
     * 删除书签
     */
    @Transactional
    public void deleteBookmark(Long userId, Long bookmarkId) {
        Bookmark bookmark = bookmarkRepository.findByIdAndUserId(bookmarkId, userId)
            .orElseThrow(() -> BusinessException.notFound("书签不存在"));

        bookmarkRepository.delete(bookmark);
        log.info("删除书签: id={}", bookmarkId);
    }

    // ==================== 辅助方法 ====================

    private ProgressDTO toProgressDTO(ReadingProgress progress, Book book) {
        String chapterTitle = chapterRepository
            .findByBookIdAndChapterIndex(book.getId(), progress.getChapterIndex())
            .map(Chapter::getTitle)
            .orElse("第" + (progress.getChapterIndex() + 1) + "章");

        return ProgressDTO.builder()
            .bookId(book.getId())
            .bookTitle(book.getTitle())
            .chapterIndex(progress.getChapterIndex())
            .chapterTitle(chapterTitle)
            .scrollPosition(progress.getScrollPosition())
            .progressPercent(progress.getProgressPercent())
            .lastReadAt(progress.getLastReadAt())
            .build();
    }

    private BookmarkDTO toBookmarkDTO(Bookmark bookmark, Book book) {
        String chapterTitle = chapterRepository
            .findByBookIdAndChapterIndex(book.getId(), bookmark.getChapterIndex())
            .map(Chapter::getTitle)
            .orElse("第" + (bookmark.getChapterIndex() + 1) + "章");

        return BookmarkDTO.builder()
            .id(bookmark.getId())
            .bookId(book.getId())
            .bookTitle(book.getTitle())
            .chapterIndex(bookmark.getChapterIndex())
            .chapterTitle(chapterTitle)
            .position(bookmark.getPosition())
            .selectedText(bookmark.getSelectedText())
            .note(bookmark.getNote())
            .color(bookmark.getColor())
            .createdAt(bookmark.getCreatedAt())
            .build();
    }
}
