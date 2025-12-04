package com.novelreader.controller;

import com.novelreader.dto.ApiResponse;
import com.novelreader.dto.PageResponse;
import com.novelreader.dto.progress.*;
import com.novelreader.security.CustomUserDetails;
import com.novelreader.service.ProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 阅读进度控制器
 */
@RestController
@RequestMapping("/progress")
@RequiredArgsConstructor
@Tag(name = "阅读进度", description = "阅读进度同步、书签管理")
public class ProgressController {

    private final ProgressService progressService;

    // ==================== 阅读进度 ====================

    @PostMapping
    @Operation(summary = "更新阅读进度")
    public ResponseEntity<ApiResponse<ProgressDTO>> updateProgress(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateProgressRequest request) {
        ProgressDTO progress = progressService.updateProgress(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(progress));
    }

    @GetMapping("/book/{bookId}")
    @Operation(summary = "获取某本书的阅读进度")
    public ResponseEntity<ApiResponse<ProgressDTO>> getProgress(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bookId) {
        ProgressDTO progress = progressService.getProgress(userDetails.getId(), bookId);
        return ResponseEntity.ok(ApiResponse.success(progress));
    }

    @GetMapping
    @Operation(summary = "获取所有阅读进度")
    public ResponseEntity<ApiResponse<List<ProgressDTO>>> getAllProgress(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ProgressDTO> progressList = progressService.getAllProgress(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(progressList));
    }

    @GetMapping("/recent")
    @Operation(summary = "获取最近阅读")
    public ResponseEntity<ApiResponse<List<ProgressDTO>>> getRecentReading(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "10") int limit) {
        List<ProgressDTO> recentList = progressService.getRecentReading(userDetails.getId(), limit);
        return ResponseEntity.ok(ApiResponse.success(recentList));
    }

    // ==================== 书签 ====================

    @PostMapping("/bookmarks")
    @Operation(summary = "创建书签")
    public ResponseEntity<ApiResponse<BookmarkDTO>> createBookmark(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateBookmarkRequest request) {
        BookmarkDTO bookmark = progressService.createBookmark(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("书签已保存", bookmark));
    }

    @GetMapping("/bookmarks/book/{bookId}")
    @Operation(summary = "获取某本书的书签")
    public ResponseEntity<ApiResponse<List<BookmarkDTO>>> getBookmarks(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bookId) {
        List<BookmarkDTO> bookmarks = progressService.getBookmarks(userDetails.getId(), bookId);
        return ResponseEntity.ok(ApiResponse.success(bookmarks));
    }

    @GetMapping("/bookmarks")
    @Operation(summary = "获取所有书签（分页）")
    public ResponseEntity<ApiResponse<PageResponse<BookmarkDTO>>> getAllBookmarks(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<BookmarkDTO> bookmarks = progressService.getAllBookmarks(userDetails.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(bookmarks));
    }

    @DeleteMapping("/bookmarks/{bookmarkId}")
    @Operation(summary = "删除书签")
    public ResponseEntity<ApiResponse<Void>> deleteBookmark(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bookmarkId) {
        progressService.deleteBookmark(userDetails.getId(), bookmarkId);
        return ResponseEntity.ok(ApiResponse.success("书签已删除", null));
    }
}
