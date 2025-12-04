package com.novelreader.repository;

import com.novelreader.entity.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 章节数据访问层
 */
@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long> {

    /**
     * 根据书籍ID查询所有章节（按章节序号排序）
     */
    List<Chapter> findByBookIdOrderByChapterIndex(Long bookId);

    /**
     * 根据书籍ID和章节序号查询章节
     */
    Optional<Chapter> findByBookIdAndChapterIndex(Long bookId, Integer chapterIndex);

    /**
     * 查询章节列表（不含内容，用于目录）
     */
    @Query("SELECT new Chapter(c.id, c.chapterIndex, c.title, c.wordCount) " +
           "FROM Chapter c WHERE c.book.id = :bookId ORDER BY c.chapterIndex")
    List<Chapter> findChapterListByBookId(@Param("bookId") Long bookId);

    /**
     * 删除书籍的所有章节
     */
    @Modifying
    void deleteByBookId(Long bookId);

    /**
     * 统计书籍章节数量
     */
    long countByBookId(Long bookId);
}
