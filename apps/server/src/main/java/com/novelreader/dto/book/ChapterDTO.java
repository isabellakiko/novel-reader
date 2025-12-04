package com.novelreader.dto.book;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 章节 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChapterDTO {

    private Long id;
    private Integer chapterIndex;
    private String title;
    private String content;
    private Integer wordCount;
}
