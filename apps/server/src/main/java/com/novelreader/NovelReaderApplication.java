package com.novelreader;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Novel Reader 后端应用启动类
 */
@SpringBootApplication
@EnableScheduling
public class NovelReaderApplication {

    public static void main(String[] args) {
        SpringApplication.run(NovelReaderApplication.class, args);
    }
}
