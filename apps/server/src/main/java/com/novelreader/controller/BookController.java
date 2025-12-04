package com.novelreader.controller;

import com.novelreader.dto.ApiResponse;
import com.novelreader.dto.PageResponse;
import com.novelreader.dto.book.BookDTO;
import com.novelreader.dto.book.BookDetailDTO;
import com.novelreader.dto.book.ChapterDTO;
import com.novelreader.security.CustomUserDetails;
import com.novelreader.service.BookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * 书籍控制器
 */
@RestController
@RequestMapping("/books")
@RequiredArgsConstructor
@Tag(name = "书籍管理", description = "书籍上传、查询、删除")
public class BookController {

    private final BookService bookService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "上传书籍", description = "上传 TXT 文件，自动解析章节")
    public ResponseEntity<ApiResponse<BookDTO>> uploadBook(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("file") MultipartFile file) throws IOException {
        BookDTO book = bookService.uploadBook(userDetails.getId(), file);
        return ResponseEntity.ok(ApiResponse.success("上传成功", book));
    }

    @GetMapping
    @Operation(summary = "获取书籍列表")
    public ResponseEntity<ApiResponse<PageResponse<BookDTO>>> getBooks(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<BookDTO> books = bookService.getBooks(userDetails.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(books));
    }

    @GetMapping("/{bookId}")
    @Operation(summary = "获取书籍详情", description = "包含章节列表")
    public ResponseEntity<ApiResponse<BookDetailDTO>> getBookDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bookId) {
        BookDetailDTO book = bookService.getBookDetail(userDetails.getId(), bookId);
        return ResponseEntity.ok(ApiResponse.success(book));
    }

    @GetMapping("/{bookId}/chapters/{chapterIndex}")
    @Operation(summary = "获取章节内容")
    public ResponseEntity<ApiResponse<ChapterDTO>> getChapter(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bookId,
            @PathVariable Integer chapterIndex) {
        ChapterDTO chapter = bookService.getChapter(userDetails.getId(), bookId, chapterIndex);
        return ResponseEntity.ok(ApiResponse.success(chapter));
    }

    @DeleteMapping("/{bookId}")
    @Operation(summary = "删除书籍")
    public ResponseEntity<ApiResponse<Void>> deleteBook(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bookId) {
        bookService.deleteBook(userDetails.getId(), bookId);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    @GetMapping("/search")
    @Operation(summary = "搜索书籍")
    public ResponseEntity<ApiResponse<PageResponse<BookDTO>>> searchBooks(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<BookDTO> books = bookService.searchBooks(userDetails.getId(), keyword, page, size);
        return ResponseEntity.ok(ApiResponse.success(books));
    }
}
