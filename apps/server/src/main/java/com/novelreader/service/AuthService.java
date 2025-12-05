package com.novelreader.service;

import com.novelreader.config.JwtConfig;
import com.novelreader.dto.auth.AuthResponse;
import com.novelreader.dto.auth.LoginRequest;
import com.novelreader.dto.auth.RegisterRequest;
import com.novelreader.entity.User;
import com.novelreader.exception.BusinessException;
import com.novelreader.repository.UserRepository;
import com.novelreader.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 认证服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtConfig jwtConfig;

    /**
     * 用户注册
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 检查用户名是否已存在
        if (userRepository.existsByUsername(request.getUsername())) {
            throw BusinessException.badRequest("用户名已存在");
        }

        // 检查邮箱是否已存在
        if (userRepository.existsByEmail(request.getEmail())) {
            throw BusinessException.badRequest("邮箱已被注册");
        }

        // 创建用户
        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .nickname(request.getNickname() != null ? request.getNickname() : request.getUsername())
            .role("USER")
            .enabled(true)
            .build();

        user = userRepository.save(user);
        log.info("新用户注册成功: {}", user.getUsername());

        return buildAuthResponse(user);
    }

    /**
     * 用户登录
     */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> BusinessException.unauthorized("用户名或密码错误"));

        if (!user.getEnabled()) {
            throw BusinessException.forbidden("账号已被禁用");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw BusinessException.unauthorized("用户名或密码错误");
        }

        log.info("用户登录成功: {}", user.getUsername());
        return buildAuthResponse(user);
    }

    /**
     * 获取当前用户信息
     */
    public AuthResponse.UserInfo getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        return AuthResponse.UserInfo.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .nickname(user.getNickname())
            .avatarUrl(user.getAvatarUrl())
            .role(user.getRole())
            .build();
    }

    /**
     * 刷新 Token
     * 验证当前用户有效后签发新 Token
     */
    public AuthResponse refreshToken(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        if (!user.getEnabled()) {
            throw BusinessException.forbidden("账号已被禁用");
        }

        log.debug("Token 刷新成功: {}", user.getUsername());
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername());

        return AuthResponse.builder()
            .token(token)
            .tokenType("Bearer")
            .expiresIn(jwtConfig.getExpiration() / 1000)
            .user(AuthResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .build())
            .build();
    }
}
