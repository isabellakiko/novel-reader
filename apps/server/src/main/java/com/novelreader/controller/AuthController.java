package com.novelreader.controller;

import com.novelreader.dto.ApiResponse;
import com.novelreader.dto.auth.AuthResponse;
import com.novelreader.dto.auth.LoginRequest;
import com.novelreader.dto.auth.RegisterRequest;
import com.novelreader.security.CustomUserDetails;
import com.novelreader.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "认证", description = "用户注册、登录、获取用户信息")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "用户注册")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("注册成功", response));
    }

    @PostMapping("/login")
    @Operation(summary = "用户登录")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("登录成功", response));
    }

    @GetMapping("/me")
    @Operation(summary = "获取当前用户信息")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> getCurrentUser(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        AuthResponse.UserInfo userInfo = authService.getCurrentUser(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(userInfo));
    }

    @PostMapping("/refresh")
    @Operation(summary = "刷新 Token", description = "使用有效的 Token 换取新 Token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        AuthResponse response = authService.refreshToken(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Token 刷新成功", response));
    }
}
