package com.novelreader.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

/**
 * JWT 配置类
 *
 * 生产环境必须通过 JWT_SECRET 环境变量配置密钥
 */
@Slf4j
@Data
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    private final Environment environment;

    private String secret;
    private long expiration;

    /**
     * 最小密钥长度（字节）
     * HS384 需要至少 48 字节（384 位）
     */
    private static final int MIN_SECRET_LENGTH = 48;

    /**
     * 启动时验证 JWT 配置
     */
    @PostConstruct
    public void validateConfig() {
        // 检查密钥是否配置
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                "JWT secret is not configured. Set JWT_SECRET environment variable."
            );
        }

        // 检查密钥长度
        if (secret.length() < MIN_SECRET_LENGTH) {
            String[] activeProfiles = environment.getActiveProfiles();
            boolean isProd = java.util.Arrays.asList(activeProfiles).contains("prod");

            if (isProd) {
                throw new IllegalStateException(
                    "JWT secret is too short for production. " +
                    "Minimum length: " + MIN_SECRET_LENGTH + " characters. " +
                    "Current length: " + secret.length()
                );
            } else {
                log.warn(
                    "JWT secret is shorter than recommended ({} chars). " +
                    "For production, use at least {} characters.",
                    secret.length(), MIN_SECRET_LENGTH
                );
            }
        }

        // 检查是否使用了默认开发密钥
        if (secret.contains("dev-secret") || secret.contains("change-in-production")) {
            String[] activeProfiles = environment.getActiveProfiles();
            boolean isProd = java.util.Arrays.asList(activeProfiles).contains("prod");

            if (isProd) {
                throw new IllegalStateException(
                    "Default development JWT secret detected in production! " +
                    "Set a secure JWT_SECRET environment variable."
                );
            } else {
                log.warn(
                    "Using default development JWT secret. " +
                    "Do NOT use this in production!"
                );
            }
        }

        log.info("JWT configuration validated. Token expiration: {} ms", expiration);
    }
}
