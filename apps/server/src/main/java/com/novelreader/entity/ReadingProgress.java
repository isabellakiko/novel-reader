package com.novelreader.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 阅读进度实体
 */
@Entity
@Table(name = "reading_progress",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "book_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadingProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "chapter_index")
    @Builder.Default
    private Integer chapterIndex = 0;

    @Column(name = "scroll_position")
    @Builder.Default
    private Double scrollPosition = 0.0;

    @Column(name = "progress_percent")
    @Builder.Default
    private Double progressPercent = 0.0;

    @Column(name = "last_read_at")
    @Builder.Default
    private LocalDateTime lastReadAt = LocalDateTime.now();
}
