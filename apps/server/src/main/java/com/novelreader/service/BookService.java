package com.novelreader.service;

import com.novelreader.dto.PageResponse;
import com.novelreader.dto.book.*;
import com.novelreader.entity.Book;
import com.novelreader.entity.Chapter;
import com.novelreader.entity.User;
import com.novelreader.exception.BusinessException;
import com.novelreader.repository.BookRepository;
import com.novelreader.repository.ChapterRepository;
import com.novelreader.repository.UserRepository;
import com.novelreader.util.TxtParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 书籍服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final ChapterRepository chapterRepository;
    private final UserRepository userRepository;
    private final TxtParser txtParser;

    private static final long MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    private static final int MAX_PAGE_SIZE = 100;
    private static final int MAX_KEYWORD_LENGTH = 100;

    /**
     * 上传并解析书籍
     */
    @Transactional
    public BookDTO uploadBook(Long userId, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw BusinessException.badRequest("文件不能为空");
        }

        // 验证文件大小
        if (file.getSize() > MAX_FILE_SIZE) {
            throw BusinessException.badRequest("文件过大，最大支持 100MB");
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null || !fileName.toLowerCase().endsWith(".txt")) {
            throw BusinessException.badRequest("只支持 TXT 格式文件");
        }

        // 验证文件名长度，防止路径遍历攻击
        if (fileName.length() > 255) {
            throw BusinessException.badRequest("文件名过长");
        }

        // FIXED: 路径遍历防护 - 检查危险字符
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\") || fileName.contains("\0")) {
            log.warn("检测到潜在路径遍历攻击: {}", fileName.replaceAll("[^\\w.-]", "_"));
            throw BusinessException.badRequest("文件名包含非法字符");
        }

        // FIXED: 增强 MIME 类型验证
        String contentType = file.getContentType();
        if (contentType != null) {
            // 允许的 MIME 类型白名单
            boolean validMimeType = contentType.startsWith("text/") ||
                contentType.equals("application/octet-stream") ||
                contentType.equals("application/x-empty");
            if (!validMimeType) {
                log.warn("文件 MIME 类型可能不正确: {}", contentType);
                // 对于明显的二进制类型，拒绝上传
                if (contentType.startsWith("application/") &&
                    !contentType.equals("application/octet-stream") &&
                    !contentType.equals("application/x-empty")) {
                    throw BusinessException.badRequest("不支持的文件类型: " + contentType);
                }
            }
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        // 解析文件（使用 try-with-resources 确保流关闭）
        TxtParser.ParseResult result;
        try (var inputStream = file.getInputStream()) {
            result = txtParser.parse(inputStream, fileName);
        }
        log.info("解析完成: {} - {} 章节", result.getTitle(), result.getChapters().size());

        // 创建书籍
        Book book = Book.builder()
            .user(user)
            .title(result.getTitle())
            .author(result.getAuthor())
            .fileHash(result.getFileHash())
            .fileSize(result.getFileSize())
            .wordCount(result.getTotalWords())
            .chapterCount(result.getChapters().size())
            .build();

        book = bookRepository.save(book);

        // 创建章节
        Book finalBook = book;
        List<Chapter> chapters = result.getChapters().stream()
            .map(c -> Chapter.builder()
                .book(finalBook)
                .chapterIndex(c.getChapterIndex())
                .title(c.getTitle())
                .content(c.getContent())
                .wordCount(c.getWordCount())
                .build())
            .collect(Collectors.toList());

        chapterRepository.saveAll(chapters);
        log.info("书籍保存成功: {} (ID: {})", book.getTitle(), book.getId());

        return toBookDTO(book);
    }

    /**
     * 获取用户书籍列表
     */
    public PageResponse<BookDTO> getBooks(Long userId, int page, int size) {
        // 参数验证和限制
        page = Math.max(0, page);
        size = Math.max(1, Math.min(size, MAX_PAGE_SIZE));

        Pageable pageable = PageRequest.of(page, size);
        Page<Book> bookPage = bookRepository.findByUserIdOrderByUpdatedAtDesc(userId, pageable);

        List<BookDTO> books = bookPage.getContent().stream()
            .map(this::toBookDTO)
            .collect(Collectors.toList());

        return PageResponse.<BookDTO>builder()
            .content(books)
            .page(bookPage.getNumber())
            .size(bookPage.getSize())
            .totalElements(bookPage.getTotalElements())
            .totalPages(bookPage.getTotalPages())
            .first(bookPage.isFirst())
            .last(bookPage.isLast())
            .build();
    }

    /**
     * 获取书籍详情（含章节列表）
     */
    public BookDetailDTO getBookDetail(Long userId, Long bookId) {
        Book book = bookRepository.findByIdAndUserId(bookId, userId)
            .orElseThrow(() -> BusinessException.notFound("书籍不存在"));

        List<Chapter> chapters = chapterRepository.findByBookIdOrderByChapterIndex(bookId);
        List<ChapterListDTO> chapterList = chapters.stream()
            .map(c -> ChapterListDTO.builder()
                .id(c.getId())
                .chapterIndex(c.getChapterIndex())
                .title(c.getTitle())
                .wordCount(c.getWordCount())
                .build())
            .collect(Collectors.toList());

        return BookDetailDTO.builder()
            .id(book.getId())
            .title(book.getTitle())
            .author(book.getAuthor())
            .description(book.getDescription())
            .coverUrl(book.getCoverUrl())
            .chapterCount(book.getChapterCount())
            .wordCount(book.getWordCount())
            .createdAt(book.getCreatedAt())
            .updatedAt(book.getUpdatedAt())
            .chapters(chapterList)
            .build();
    }

    /**
     * 获取章节内容
     */
    public ChapterDTO getChapter(Long userId, Long bookId, Integer chapterIndex) {
        // 验证书籍所有权
        bookRepository.findByIdAndUserId(bookId, userId)
            .orElseThrow(() -> BusinessException.notFound("书籍不存在"));

        Chapter chapter = chapterRepository.findByBookIdAndChapterIndex(bookId, chapterIndex)
            .orElseThrow(() -> BusinessException.notFound("章节不存在"));

        return ChapterDTO.builder()
            .id(chapter.getId())
            .chapterIndex(chapter.getChapterIndex())
            .title(chapter.getTitle())
            .content(chapter.getContent())
            .wordCount(chapter.getWordCount())
            .build();
    }

    /**
     * 删除书籍
     */
    @Transactional
    public void deleteBook(Long userId, Long bookId) {
        Book book = bookRepository.findByIdAndUserId(bookId, userId)
            .orElseThrow(() -> BusinessException.notFound("书籍不存在"));

        chapterRepository.deleteByBookId(bookId);
        bookRepository.delete(book);
        log.info("书籍已删除: {} (ID: {})", book.getTitle(), bookId);
    }

    /**
     * FIXED: 转义 SQL LIKE 通配符，防止通配符注入
     */
    private String escapeLikeWildcards(String input) {
        if (input == null) return null;
        return input
            .replace("\\", "\\\\")
            .replace("%", "\\%")
            .replace("_", "\\_");
    }

    /**
     * 搜索书籍
     */
    public PageResponse<BookDTO> searchBooks(Long userId, String keyword, int page, int size) {
        // 关键字验证
        if (keyword == null || keyword.trim().isEmpty()) {
            throw BusinessException.badRequest("搜索关键字不能为空");
        }
        keyword = keyword.trim();
        if (keyword.length() > MAX_KEYWORD_LENGTH) {
            throw BusinessException.badRequest("搜索关键字不能超过 " + MAX_KEYWORD_LENGTH + " 个字符");
        }

        // FIXED: 转义 LIKE 通配符
        String escapedKeyword = escapeLikeWildcards(keyword);

        // 参数验证和限制
        page = Math.max(0, page);
        size = Math.max(1, Math.min(size, MAX_PAGE_SIZE));

        Pageable pageable = PageRequest.of(page, size);
        Page<Book> bookPage = bookRepository.searchByKeyword(userId, escapedKeyword, pageable);

        List<BookDTO> books = bookPage.getContent().stream()
            .map(this::toBookDTO)
            .collect(Collectors.toList());

        return PageResponse.<BookDTO>builder()
            .content(books)
            .page(bookPage.getNumber())
            .size(bookPage.getSize())
            .totalElements(bookPage.getTotalElements())
            .totalPages(bookPage.getTotalPages())
            .first(bookPage.isFirst())
            .last(bookPage.isLast())
            .build();
    }

    private BookDTO toBookDTO(Book book) {
        return BookDTO.builder()
            .id(book.getId())
            .title(book.getTitle())
            .author(book.getAuthor())
            .description(book.getDescription())
            .coverUrl(book.getCoverUrl())
            .chapterCount(book.getChapterCount())
            .wordCount(book.getWordCount())
            .createdAt(book.getCreatedAt())
            .updatedAt(book.getUpdatedAt())
            .build();
    }
}
