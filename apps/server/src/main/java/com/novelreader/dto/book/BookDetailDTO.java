package com.novelreader.dto.book;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 书籍详情 DTO（含章节列表）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookDetailDTO {

    private Long id;
    private String title;
    private String author;
    private String description;
    private String coverUrl;
    private Integer chapterCount;
    private Long wordCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ChapterListDTO> chapters;
}
