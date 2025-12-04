package com.novelreader.dto.progress;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 书签 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookmarkDTO {

    private Long id;
    private Long bookId;
    private String bookTitle;
    private Integer chapterIndex;
    private String chapterTitle;
    private Integer position;
    private String selectedText;
    private String note;
    private String color;
    private LocalDateTime createdAt;
}
