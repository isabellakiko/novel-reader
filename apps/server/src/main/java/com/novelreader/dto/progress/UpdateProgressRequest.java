package com.novelreader.dto.progress;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 更新阅读进度请求
 */
@Data
public class UpdateProgressRequest {

    @NotNull(message = "书籍ID不能为空")
    private Long bookId;

    @NotNull(message = "章节序号不能为空")
    @Min(value = 0, message = "章节序号不能为负数")
    private Integer chapterIndex;

    private Double scrollPosition = 0.0;

    private Double progressPercent = 0.0;
}
