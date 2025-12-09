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
     * FIXED: 改进 IP 识别逻辑，防止 X-Forwarded-For 欺骗
     *
     * 策略说明：
     * 1. 优先使用 X-Real-IP（通常由可信代理设置）
     * 2. X-Forwarded-For 取最右侧非私有 IP（最接近客户端的可信代理添加的）
     * 3. 如果都不可用，使用 remoteAddr
     */
    private String getClientIP(HttpServletRequest request) {
        // 优先使用 X-Real-IP（由可信反向代理如 Nginx 设置）
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !isPrivateIP(xRealIp.trim())) {
            return xRealIp.trim();
        }

        // X-Forwarded-For: client, proxy1, proxy2
        // 从右向左取第一个非私有 IP（避免客户端伪造）
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            String[] ips = xForwardedFor.split(",");
            // 从右向左遍历，找到第一个非私有 IP
            for (int i = ips.length - 1; i >= 0; i--) {
                String ip = ips[i].trim();
                if (!ip.isEmpty() && !isPrivateIP(ip)) {
                    return ip;
                }
            }
            // 如果全是私有 IP，返回最左边的（原始客户端）
            return ips[0].trim();
        }

        return request.getRemoteAddr();
    }

    /**
     * 检查是否为私有 IP 地址
     */
    private boolean isPrivateIP(String ip) {
        if (ip == null || ip.isEmpty()) {
            return true;
        }
        // IPv4 私有地址范围
        return ip.startsWith("10.") ||
               ip.startsWith("172.16.") || ip.startsWith("172.17.") ||
               ip.startsWith("172.18.") || ip.startsWith("172.19.") ||
               ip.startsWith("172.20.") || ip.startsWith("172.21.") ||
               ip.startsWith("172.22.") || ip.startsWith("172.23.") ||
               ip.startsWith("172.24.") || ip.startsWith("172.25.") ||
               ip.startsWith("172.26.") || ip.startsWith("172.27.") ||
               ip.startsWith("172.28.") || ip.startsWith("172.29.") ||
               ip.startsWith("172.30.") || ip.startsWith("172.31.") ||
               ip.startsWith("192.168.") ||
               ip.equals("127.0.0.1") ||
               ip.equals("::1") ||
               ip.startsWith("0:0:0:0:0:0:0:1");
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
