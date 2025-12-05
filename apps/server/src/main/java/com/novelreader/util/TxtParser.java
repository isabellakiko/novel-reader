package com.novelreader.util;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * TXT 文件解析工具
 */
@Slf4j
@Component
public class TxtParser {

    // 章节标题正则（支持多种格式）
    private static final Pattern[] CHAPTER_PATTERNS = {
        // 第X章 标题
        Pattern.compile("^\\s*第[0-9零一二三四五六七八九十百千万]+[章节卷集部篇回]\\s*.{0,50}$"),
        // Chapter X
        Pattern.compile("^\\s*Chapter\\s*\\d+.*$", Pattern.CASE_INSENSITIVE),
        // 数字章节 1. 或 1、
        Pattern.compile("^\\s*\\d{1,4}[.、]\\s*.{1,50}$"),
        // 【第X章】
        Pattern.compile("^\\s*【第?[0-9零一二三四五六七八九十百千万]+[章节卷集部篇回]?】.*$"),
    };

    /**
     * 解析 TXT 文件
     */
    public ParseResult parse(InputStream inputStream, String fileName) throws IOException {
        // 读取全部内容并检测编码
        byte[] bytes = inputStream.readAllBytes();
        Charset charset = detectCharset(bytes);
        String content = new String(bytes, charset);

        // 计算文件哈希
        String fileHash = calculateHash(bytes);

        // 提取书名和作者
        String title = extractTitle(fileName, content);
        String author = extractAuthor(content);

        // 解析章节
        List<ChapterInfo> chapters = parseChapters(content);

        // 计算总字数
        long totalWords = content.replaceAll("\\s", "").length();

        return ParseResult.builder()
            .title(title)
            .author(author)
            .fileHash(fileHash)
            .fileSize((long) bytes.length)
            .totalWords(totalWords)
            .chapters(chapters)
            .build();
    }

    /**
     * 检测文件编码
     */
    private Charset detectCharset(byte[] bytes) {
        // 检查 BOM
        if (bytes.length >= 3 && bytes[0] == (byte) 0xEF &&
            bytes[1] == (byte) 0xBB && bytes[2] == (byte) 0xBF) {
            return StandardCharsets.UTF_8;
        }
        if (bytes.length >= 2 && bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xFE) {
            return StandardCharsets.UTF_16LE;
        }
        if (bytes.length >= 2 && bytes[0] == (byte) 0xFE && bytes[1] == (byte) 0xFF) {
            return StandardCharsets.UTF_16BE;
        }

        // 尝试 UTF-8
        try {
            String utf8 = new String(bytes, StandardCharsets.UTF_8);
            if (!utf8.contains("\uFFFD")) {
                return StandardCharsets.UTF_8;
            }
        } catch (Exception ignored) {}

        // 尝试 GBK
        try {
            return Charset.forName("GBK");
        } catch (Exception e) {
            return StandardCharsets.UTF_8;
        }
    }

    /**
     * 计算文件哈希
     */
    private String calculateHash(byte[] bytes) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(bytes);
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("计算文件哈希失败，使用时间戳作为替代", e);
            return "hash-" + System.currentTimeMillis();
        }
    }

    /**
     * 提取书名
     */
    private String extractTitle(String fileName, String content) {
        // 优先从文件名提取
        String name = fileName.replaceAll("\\.(txt|TXT)$", "")
            .replaceAll("【.*?】", "")
            .replaceAll("\\[.*?]", "")
            .trim();

        if (!name.isEmpty()) {
            return name;
        }

        // 从内容第一行提取
        String[] lines = content.split("\\r?\\n", 5);
        for (String line : lines) {
            line = line.trim();
            if (!line.isEmpty() && line.length() <= 50) {
                return line;
            }
        }

        return "未命名";
    }

    /**
     * 提取作者
     */
    private String extractAuthor(String content) {
        Pattern authorPattern = Pattern.compile("作者[：:](\\S+)");
        Matcher matcher = authorPattern.matcher(content.substring(0, Math.min(1000, content.length())));
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }

    /**
     * 解析章节
     */
    private List<ChapterInfo> parseChapters(String content) {
        List<ChapterInfo> chapters = new ArrayList<>();
        String[] lines = content.split("\\r?\\n");

        StringBuilder currentContent = new StringBuilder();
        String currentTitle = null;
        int chapterIndex = 0;

        for (String line : lines) {
            if (isChapterTitle(line)) {
                // 保存前一章节
                if (currentTitle != null) {
                    String chapterContent = currentContent.toString().trim();
                    chapters.add(ChapterInfo.builder()
                        .chapterIndex(chapterIndex++)
                        .title(currentTitle)
                        .content(chapterContent)
                        .wordCount(chapterContent.replaceAll("\\s", "").length())
                        .build());
                }
                currentTitle = line.trim();
                currentContent = new StringBuilder();
            } else {
                currentContent.append(line).append("\n");
            }
        }

        // 保存最后一章
        if (currentTitle != null) {
            String chapterContent = currentContent.toString().trim();
            chapters.add(ChapterInfo.builder()
                .chapterIndex(chapterIndex)
                .title(currentTitle)
                .content(chapterContent)
                .wordCount(chapterContent.replaceAll("\\s", "").length())
                .build());
        }

        // 如果没有识别到章节，整本书作为一章
        if (chapters.isEmpty()) {
            chapters.add(ChapterInfo.builder()
                .chapterIndex(0)
                .title("正文")
                .content(content)
                .wordCount(content.replaceAll("\\s", "").length())
                .build());
        }

        return chapters;
    }

    /**
     * 判断是否为章节标题
     */
    private boolean isChapterTitle(String line) {
        line = line.trim();
        if (line.isEmpty() || line.length() > 60) {
            return false;
        }

        for (Pattern pattern : CHAPTER_PATTERNS) {
            if (pattern.matcher(line).matches()) {
                return true;
            }
        }
        return false;
    }

    @Data
    @Builder
    public static class ParseResult {
        private String title;
        private String author;
        private String fileHash;
        private Long fileSize;
        private Long totalWords;
        private List<ChapterInfo> chapters;
    }

    @Data
    @Builder
    public static class ChapterInfo {
        private Integer chapterIndex;
        private String title;
        private String content;
        private Integer wordCount;
    }
}
