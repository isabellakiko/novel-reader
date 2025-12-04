package com.novelreader.dto.progress;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 阅读进度 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressDTO {

    private Long bookId;
    private String bookTitle;
    private Integer chapterIndex;
    private String chapterTitle;
    private Double scrollPosition;
    private Double progressPercent;
    private LocalDateTime lastReadAt;
}
