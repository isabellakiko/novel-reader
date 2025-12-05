package com.novelreader.service;

import com.novelreader.config.JwtConfig;
import com.novelreader.dto.auth.AuthResponse;
import com.novelreader.dto.auth.LoginRequest;
import com.novelreader.dto.auth.RegisterRequest;
import com.novelreader.entity.User;
import com.novelreader.exception.BusinessException;
import com.novelreader.repository.UserRepository;
import com.novelreader.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * AuthService 单元测试
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private JwtConfig jwtConfig;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .id(1L)
            .username("testuser")
            .email("test@example.com")
            .passwordHash("hashedPassword")
            .nickname("Test User")
            .role("USER")
            .enabled(true)
            .build();
    }

    @Nested
    @DisplayName("用户注册测试")
    class RegisterTests {

        @Test
        @DisplayName("成功注册新用户")
        void register_Success() {
            // Given
            RegisterRequest request = new RegisterRequest();
            request.setUsername("newuser");
            request.setEmail("new@example.com");
            request.setPassword("password123");
            request.setNickname("New User");

            when(userRepository.existsByUsername("newuser")).thenReturn(false);
            when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(1L);
                return user;
            });
            when(jwtTokenProvider.generateToken(anyLong(), anyString())).thenReturn("jwt-token");
            when(jwtConfig.getExpiration()).thenReturn(86400000L);

            // When
            AuthResponse response = authService.register(request);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("jwt-token");
            assertThat(response.getUser().getUsername()).isEqualTo("newuser");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("用户名已存在时抛出异常")
        void register_UsernameExists_ThrowsException() {
            // Given
            RegisterRequest request = new RegisterRequest();
            request.setUsername("existinguser");
            request.setEmail("new@example.com");
            request.setPassword("password123");

            when(userRepository.existsByUsername("existinguser")).thenReturn(true);

            // When/Then
            assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("用户名已存在");
        }

        @Test
        @DisplayName("邮箱已存在时抛出异常")
        void register_EmailExists_ThrowsException() {
            // Given
            RegisterRequest request = new RegisterRequest();
            request.setUsername("newuser");
            request.setEmail("existing@example.com");
            request.setPassword("password123");

            when(userRepository.existsByUsername("newuser")).thenReturn(false);
            when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

            // When/Then
            assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("邮箱已被注册");
        }
    }

    @Nested
    @DisplayName("用户登录测试")
    class LoginTests {

        @Test
        @DisplayName("成功登录")
        void login_Success() {
            // Given
            LoginRequest request = new LoginRequest();
            request.setUsername("testuser");
            request.setPassword("password123");

            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("password123", "hashedPassword")).thenReturn(true);
            when(jwtTokenProvider.generateToken(1L, "testuser")).thenReturn("jwt-token");
            when(jwtConfig.getExpiration()).thenReturn(86400000L);

            // When
            AuthResponse response = authService.login(request);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("jwt-token");
            assertThat(response.getUser().getUsername()).isEqualTo("testuser");
        }

        @Test
        @DisplayName("用户名不存在时抛出异常")
        void login_UserNotFound_ThrowsException() {
            // Given
            LoginRequest request = new LoginRequest();
            request.setUsername("nonexistent");
            request.setPassword("password123");

            when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("用户名或密码错误");
        }

        @Test
        @DisplayName("密码错误时抛出异常")
        void login_WrongPassword_ThrowsException() {
            // Given
            LoginRequest request = new LoginRequest();
            request.setUsername("testuser");
            request.setPassword("wrongpassword");

            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("wrongpassword", "hashedPassword")).thenReturn(false);

            // When/Then
            assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("用户名或密码错误");
        }

        @Test
        @DisplayName("账号被禁用时抛出异常")
        void login_AccountDisabled_ThrowsException() {
            // Given
            testUser.setEnabled(false);

            LoginRequest request = new LoginRequest();
            request.setUsername("testuser");
            request.setPassword("password123");

            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

            // When/Then
            assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("账号已被禁用");
        }
    }

    @Nested
    @DisplayName("获取当前用户信息测试")
    class GetCurrentUserTests {

        @Test
        @DisplayName("成功获取用户信息")
        void getCurrentUser_Success() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // When
            AuthResponse.UserInfo userInfo = authService.getCurrentUser(1L);

            // Then
            assertThat(userInfo).isNotNull();
            assertThat(userInfo.getId()).isEqualTo(1L);
            assertThat(userInfo.getUsername()).isEqualTo("testuser");
            assertThat(userInfo.getEmail()).isEqualTo("test@example.com");
        }

        @Test
        @DisplayName("用户不存在时抛出异常")
        void getCurrentUser_NotFound_ThrowsException() {
            // Given
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> authService.getCurrentUser(999L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("用户不存在");
        }
    }

    @Nested
    @DisplayName("刷新 Token 测试")
    class RefreshTokenTests {

        @Test
        @DisplayName("成功刷新 Token")
        void refreshToken_Success() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(jwtTokenProvider.generateToken(1L, "testuser")).thenReturn("new-jwt-token");
            when(jwtConfig.getExpiration()).thenReturn(86400000L);

            // When
            AuthResponse response = authService.refreshToken(1L);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("new-jwt-token");
        }

        @Test
        @DisplayName("账号被禁用时刷新失败")
        void refreshToken_AccountDisabled_ThrowsException() {
            // Given
            testUser.setEnabled(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // When/Then
            assertThatThrownBy(() -> authService.refreshToken(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("账号已被禁用");
        }
    }
}
