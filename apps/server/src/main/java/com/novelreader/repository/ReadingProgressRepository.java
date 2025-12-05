package com.novelreader.repository;

import com.novelreader.entity.ReadingProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 阅读进度数据访问层
 */
@Repository
public interface ReadingProgressRepository extends JpaRepository<ReadingProgress, Long> {

    /**
     * 查询用户某本书的阅读进度
     */
    Optional<ReadingProgress> findByUserIdAndBookId(Long userId, Long bookId);

    /**
     * 查询用户所有阅读进度
     */
    List<ReadingProgress> findByUserIdOrderByLastReadAtDesc(Long userId);

    /**
     * 查询用户所有阅读进度（带 Book 信息，避免 N+1）
     */
    @Query("SELECT rp FROM ReadingProgress rp " +
           "JOIN FETCH rp.book " +
           "WHERE rp.user.id = :userId " +
           "ORDER BY rp.lastReadAt DESC")
    List<ReadingProgress> findByUserIdWithBook(@Param("userId") Long userId);

    /**
     * 查询用户最近阅读的书籍
     */
    @Query("SELECT rp FROM ReadingProgress rp WHERE rp.user.id = :userId " +
           "ORDER BY rp.lastReadAt DESC")
    List<ReadingProgress> findRecentReading(@Param("userId") Long userId);

    /**
     * 查询用户最近阅读的书籍（带 Book 信息，避免 N+1）
     */
    @Query("SELECT rp FROM ReadingProgress rp " +
           "JOIN FETCH rp.book " +
           "WHERE rp.user.id = :userId " +
           "ORDER BY rp.lastReadAt DESC")
    List<ReadingProgress> findRecentReadingWithBook(@Param("userId") Long userId);

    /**
     * 删除书籍的所有阅读进度
     */
    void deleteByBookId(Long bookId);
}
