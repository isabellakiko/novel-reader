package com.novelreader.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelreader.config.RateLimitConfig;
import com.novelreader.dto.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 请求限流过滤器
 *
 * 使用滑动窗口算法实现基于 IP 的请求限流
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitConfig rateLimitConfig;
    private final ObjectMapper objectMapper;

    /**
     * 存储每个 IP 的请求计数
     * key: "IP:endpoint", value: 请求信息
     */
    private final ConcurrentHashMap<String, RequestCounter> requestCounters = new ConcurrentHashMap<>();

    /**
     * 请求计数器，记录时间窗口内的请求次数
     */
    private static class RequestCounter {
        final AtomicInteger count = new AtomicInteger(0);
        volatile long windowStart = System.currentTimeMillis();

        /**
         * 尝试获取请求许可
         * @param limit 时间窗口内的最大请求数
         * @param windowMs 时间窗口（毫秒）
         * @return 是否允许请求
         */
        synchronized boolean tryAcquire(int limit, long windowMs) {
            long now = System.currentTimeMillis();

            // 如果超出时间窗口，重置计数器
            if (now - windowStart >= windowMs) {
                count.set(0);
                windowStart = now;
            }

            // 检查是否超出限制
            if (count.get() >= limit) {
                return false;
            }

            count.incrementAndGet();
            return true;
        }

        /**
         * 检查是否过期（用于清理）
         */
        boolean isExpired(long windowMs) {
            return System.currentTimeMillis() - windowStart >= windowMs * 2;
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // 如果限流未启用，直接放行
        if (!rateLimitConfig.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIP(request);
        String requestPath = request.getRequestURI();

        // 根据请求路径确定限流配置
        int limit = getLimit(requestPath);
        String key = clientIp + ":" + getEndpointKey(requestPath);

        RequestCounter counter = requestCounters.computeIfAbsent(key, k -> new RequestCounter());

        // 尝试获取请求许可（1分钟窗口）
        if (!counter.tryAcquire(limit, 60_000)) {
            log.warn("Rate limit exceeded for IP: {}, path: {}", clientIp, requestPath);
            sendRateLimitResponse(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 获取客户端真实 IP
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    /**
     * 根据请求路径获取限流阈值
     */
    private int getLimit(String path) {
        if (path.contains("/auth/login")) {
            return rateLimitConfig.getLoginRequestsPerMinute();
        }
        if (path.contains("/auth/register")) {
            return rateLimitConfig.getRegisterRequestsPerMinute();
        }
        if (path.contains("/books/upload")) {
            return rateLimitConfig.getUploadRequestsPerMinute();
        }
        return rateLimitConfig.getRequestsPerMinute();
    }

    /**
     * 获取端点分组 key
     */
    private String getEndpointKey(String path) {
        if (path.contains("/auth/login")) {
            return "login";
        }
        if (path.contains("/auth/register")) {
            return "register";
        }
        if (path.contains("/books/upload")) {
            return "upload";
        }
        return "global";
    }

    /**
     * 发送限流响应
     */
    private void sendRateLimitResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        ApiResponse<Void> apiResponse = ApiResponse.error(
                HttpStatus.TOO_MANY_REQUESTS.value(),
                "请求过于频繁，请稍后再试"
        );

        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }

    /**
     * 定期清理过期的计数器（每5分钟执行）
     */
    @Scheduled(fixedRate = 300_000)
    public void cleanupExpiredCounters() {
        int beforeSize = requestCounters.size();
        requestCounters.entrySet().removeIf(entry -> entry.getValue().isExpired(60_000));
        int removed = beforeSize - requestCounters.size();
        if (removed > 0) {
            log.debug("Cleaned up {} expired rate limit counters", removed);
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // 跳过静态资源和健康检查
        return path.startsWith("/swagger-ui") ||
               path.startsWith("/api-docs") ||
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/actuator/health") ||
               path.startsWith("/h2-console");
    }
}
