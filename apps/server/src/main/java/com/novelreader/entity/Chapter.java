package com.novelreader.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 章节实体
 */
@Entity
@Table(name = "chapters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chapter {

    /**
     * 用于投影查询的构造函数（不含内容）
     */
    public Chapter(Long id, Integer chapterIndex, String title, Integer wordCount) {
        this.id = id;
        this.chapterIndex = chapterIndex;
        this.title = title;
        this.wordCount = wordCount;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "chapter_index", nullable = false)
    private Integer chapterIndex;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "word_count")
    @Builder.Default
    private Integer wordCount = 0;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
