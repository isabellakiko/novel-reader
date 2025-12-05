package com.novelreader.security;

import com.novelreader.config.JwtConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * JwtTokenProvider 单元测试
 */
@ExtendWith(MockitoExtension.class)
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private JwtConfig jwtConfig;

    @Mock
    private Environment environment;

    // 测试用密钥（至少 48 bytes for HS384）
    private static final String TEST_SECRET = "test-secret-key-for-jwt-testing-at-least-48-bytes-long-for-hs384-algorithm";

    @BeforeEach
    void setUp() {
        lenient().when(environment.getActiveProfiles()).thenReturn(new String[]{"test"});

        jwtConfig = new JwtConfig(environment);
        jwtConfig.setSecret(TEST_SECRET);
        jwtConfig.setExpiration(86400000L); // 24小时

        jwtTokenProvider = new JwtTokenProvider(jwtConfig);
    }

    @Test
    @DisplayName("成功生成 Token")
    void generateToken_Success() {
        // When
        String token = jwtTokenProvider.generateToken(1L, "testuser");

        // Then
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3); // JWT格式: header.payload.signature
    }

    @Test
    @DisplayName("从 Token 获取用户 ID")
    void getUserIdFromToken_Success() {
        // Given
        String token = jwtTokenProvider.generateToken(123L, "testuser");

        // When
        Long userId = jwtTokenProvider.getUserIdFromToken(token);

        // Then
        assertThat(userId).isEqualTo(123L);
    }

    @Test
    @DisplayName("从 Token 获取用户名")
    void getUsernameFromToken_Success() {
        // Given
        String token = jwtTokenProvider.generateToken(1L, "testuser");

        // When
        String username = jwtTokenProvider.getUsernameFromToken(token);

        // Then
        assertThat(username).isEqualTo("testuser");
    }

    @Test
    @DisplayName("验证有效 Token")
    void validateToken_ValidToken_ReturnsTrue() {
        // Given
        String token = jwtTokenProvider.generateToken(1L, "testuser");

        // When
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Then
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("验证无效 Token 返回 false")
    void validateToken_InvalidToken_ReturnsFalse() {
        // Given
        String invalidToken = "invalid.token.here";

        // When
        boolean isValid = jwtTokenProvider.validateToken(invalidToken);

        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("验证空 Token 返回 false")
    void validateToken_EmptyToken_ReturnsFalse() {
        // When
        boolean isValid = jwtTokenProvider.validateToken("");

        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("验证 null Token 返回 false")
    void validateToken_NullToken_ReturnsFalse() {
        // When
        boolean isValid = jwtTokenProvider.validateToken(null);

        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("验证篡改过的 Token 返回 false")
    void validateToken_TamperedToken_ReturnsFalse() {
        // Given
        String token = jwtTokenProvider.generateToken(1L, "testuser");
        // 篡改 payload 部分
        String[] parts = token.split("\\.");
        String tamperedToken = parts[0] + ".TAMPERED" + parts[1].substring(5) + "." + parts[2];

        // When
        boolean isValid = jwtTokenProvider.validateToken(tamperedToken);

        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("过期 Token 验证失败")
    void validateToken_ExpiredToken_ReturnsFalse() {
        // Given - 创建一个立即过期的 token
        JwtConfig expiredConfig = new JwtConfig(environment);
        expiredConfig.setSecret(TEST_SECRET);
        expiredConfig.setExpiration(-1000L); // 已过期

        JwtTokenProvider expiredProvider = new JwtTokenProvider(expiredConfig);
        String token = expiredProvider.generateToken(1L, "testuser");

        // When
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("不同密钥签发的 Token 验证失败")
    void validateToken_DifferentSecret_ReturnsFalse() {
        // Given - 使用不同密钥生成 token
        JwtConfig otherConfig = new JwtConfig(environment);
        otherConfig.setSecret("different-secret-key-for-jwt-testing-at-least-48-bytes-long-for-hs384-algo");
        otherConfig.setExpiration(86400000L);

        JwtTokenProvider otherProvider = new JwtTokenProvider(otherConfig);
        String token = otherProvider.generateToken(1L, "testuser");

        // When
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("生成的 Token 包含正确的用户信息")
    void generateToken_ContainsCorrectUserInfo() {
        // Given
        Long userId = 42L;
        String username = "john_doe";

        // When
        String token = jwtTokenProvider.generateToken(userId, username);

        // Then
        assertThat(jwtTokenProvider.getUserIdFromToken(token)).isEqualTo(userId);
        assertThat(jwtTokenProvider.getUsernameFromToken(token)).isEqualTo(username);
    }
}
