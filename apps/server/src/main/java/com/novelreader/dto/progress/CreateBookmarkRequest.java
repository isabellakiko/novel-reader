package com.novelreader.dto.progress;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 创建书签请求
 */
@Data
public class CreateBookmarkRequest {

    @NotNull(message = "书籍ID不能为空")
    private Long bookId;

    @NotNull(message = "章节序号不能为空")
    @Min(value = 0, message = "章节序号不能为负数")
    private Integer chapterIndex;

    @Min(value = 0, message = "位置不能为负数")
    private Integer position = 0;

    @Size(max = 500, message = "选中文本不能超过500字")
    private String selectedText;

    private String note;

    @Size(max = 20, message = "颜色标识不能超过20字")
    private String color = "yellow";
}
