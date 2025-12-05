package com.novelreader.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelreader.config.RateLimitConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * RateLimitFilter 单元测试
 */
@ExtendWith(MockitoExtension.class)
class RateLimitFilterTest {

    private RateLimitFilter rateLimitFilter;
    private RateLimitConfig rateLimitConfig;
    private ObjectMapper objectMapper;

    @Mock
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        rateLimitConfig = new RateLimitConfig();
        rateLimitConfig.setEnabled(true);
        rateLimitConfig.setRequestsPerMinute(60);
        rateLimitConfig.setLoginRequestsPerMinute(5);
        rateLimitConfig.setRegisterRequestsPerMinute(3);
        rateLimitConfig.setUploadRequestsPerMinute(10);

        objectMapper = new ObjectMapper();
        rateLimitFilter = new RateLimitFilter(rateLimitConfig, objectMapper);
    }

    @Test
    @DisplayName("限流未启用时放行所有请求")
    void whenDisabled_AllowsAllRequests() throws Exception {
        // Given
        rateLimitConfig.setEnabled(false);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/books");
        request.setRemoteAddr("192.168.1.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // When
        rateLimitFilter.doFilter(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("正常请求通过限流")
    void normalRequest_Passes() throws Exception {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/books");
        request.setRemoteAddr("192.168.1.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // When
        rateLimitFilter.doFilter(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        assertThat(response.getStatus()).isEqualTo(HttpStatus.OK.value());
    }

    @Test
    @DisplayName("登录接口超过限制时返回429")
    void loginEndpoint_ExceedsLimit_Returns429() throws Exception {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/auth/login");
        request.setRemoteAddr("192.168.1.100");

        // When - 发送超过限制的请求
        for (int i = 0; i < 5; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            rateLimitFilter.doFilter(request, response, filterChain);
        }

        // Then - 第6个请求应该被拒绝
        MockHttpServletResponse response = new MockHttpServletResponse();
        rateLimitFilter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
        assertThat(response.getContentAsString()).contains("请求过于频繁");
    }

    @Test
    @DisplayName("不同IP独立计数")
    void differentIPs_CountedSeparately() throws Exception {
        // Given
        MockHttpServletRequest request1 = new MockHttpServletRequest();
        request1.setRequestURI("/api/auth/login");
        request1.setRemoteAddr("192.168.1.1");

        MockHttpServletRequest request2 = new MockHttpServletRequest();
        request2.setRequestURI("/api/auth/login");
        request2.setRemoteAddr("192.168.1.2");

        // When - IP1 发送5个请求（达到限制）
        for (int i = 0; i < 5; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            rateLimitFilter.doFilter(request1, response, filterChain);
        }

        // Then - IP2 仍然可以请求
        MockHttpServletResponse response = new MockHttpServletResponse();
        rateLimitFilter.doFilter(request2, response, filterChain);
        verify(filterChain, atLeast(1)).doFilter(request2, response);
    }

    @Test
    @DisplayName("X-Forwarded-For 头正确解析")
    void xForwardedFor_ParsedCorrectly() throws Exception {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/auth/login");
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", "203.0.113.50, 70.41.3.18, 150.172.238.178");

        // When - 发送5个请求（限制为5）
        for (int i = 0; i < 5; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            rateLimitFilter.doFilter(request, response, filterChain);
        }

        // Then - 第6个请求应该被拒绝（基于真实IP）
        MockHttpServletResponse response = new MockHttpServletResponse();
        rateLimitFilter.doFilter(request, response, filterChain);
        assertThat(response.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());

        // 另一个IP仍然可以请求
        MockHttpServletRequest request2 = new MockHttpServletRequest();
        request2.setRequestURI("/api/auth/login");
        request2.addHeader("X-Forwarded-For", "10.0.0.1");
        MockHttpServletResponse response2 = new MockHttpServletResponse();
        rateLimitFilter.doFilter(request2, response2, filterChain);
        assertThat(response2.getStatus()).isEqualTo(HttpStatus.OK.value());
    }

    @Test
    @DisplayName("Swagger 路径跳过限流")
    void swaggerPath_SkipsFilter() throws Exception {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/swagger-ui/index.html");
        request.setRemoteAddr("192.168.1.1");

        // When
        boolean shouldNotFilter = rateLimitFilter.shouldNotFilter(request);

        // Then
        assertThat(shouldNotFilter).isTrue();
    }

    @Test
    @DisplayName("健康检查路径跳过限流")
    void actuatorHealth_SkipsFilter() throws Exception {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/actuator/health");
        request.setRemoteAddr("192.168.1.1");

        // When
        boolean shouldNotFilter = rateLimitFilter.shouldNotFilter(request);

        // Then
        assertThat(shouldNotFilter).isTrue();
    }
}
