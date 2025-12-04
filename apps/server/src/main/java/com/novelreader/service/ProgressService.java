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
        return progressRepository.findByUserIdOrderByLastReadAtDesc(userId)
            .stream()
            .map(p -> toProgressDTO(p, p.getBook()))
            .collect(Collectors.toList());
    }

    /**
     * 获取最近阅读
     */
    public List<ProgressDTO> getRecentReading(Long userId, int limit) {
        return progressRepository.findRecentReading(userId)
            .stream()
            .limit(limit)
            .map(p -> toProgressDTO(p, p.getBook()))
            .collect(Collectors.toList());
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

        List<BookmarkDTO> bookmarks = bookmarkPage.getContent().stream()
            .map(b -> toBookmarkDTO(b, b.getBook()))
            .collect(Collectors.toList());

        return PageResponse.<BookmarkDTO>builder()
            .content(bookmarks)
            .page(bookmarkPage.getNumber())
            .size(bookmarkPage.getSize())
            .totalElements(bookmarkPage.getTotalElements())
            .totalPages(bookmarkPage.getTotalPages())
            .first(bookmarkPage.isFirst())
            .last(bookmarkPage.isLast())
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
