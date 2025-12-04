package com.novelreader.dto.book;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 书籍 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookDTO {

    private Long id;
    private String title;
    private String author;
    private String description;
    private String coverUrl;
    private Integer chapterCount;
    private Long wordCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
