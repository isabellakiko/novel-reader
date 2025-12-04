package com.novelreader.dto.book;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 章节列表项 DTO（不含内容）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChapterListDTO {

    private Long id;
    private Integer chapterIndex;
    private String title;
    private Integer wordCount;
}
