package com.novelreader.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 限流配置
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "rate-limit")
public class RateLimitConfig {

    /**
     * 是否启用限流
     */
    private boolean enabled = true;

    /**
     * 全局限流：每分钟请求数
     */
    private int requestsPerMinute = 60;

    /**
     * 登录接口限流：每分钟请求数（防止暴力破解）
     */
    private int loginRequestsPerMinute = 10;

    /**
     * 注册接口限流：每分钟请求数
     */
    private int registerRequestsPerMinute = 5;

    /**
     * 上传接口限流：每分钟请求数
     */
    private int uploadRequestsPerMinute = 10;
}
