package com.novelreader.repository;

import com.novelreader.entity.Bookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 书签数据访问层
 */
@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    /**
     * 查询用户某本书的所有书签
     */
    List<Bookmark> findByUserIdAndBookIdOrderByChapterIndexAscPositionAsc(Long userId, Long bookId);

    /**
     * 查询用户所有书签（分页）
     */
    Page<Bookmark> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * 根据ID和用户ID查询书签
     */
    Optional<Bookmark> findByIdAndUserId(Long id, Long userId);

    /**
     * 删除书籍的所有书签
     */
    void deleteByBookId(Long bookId);

    /**
     * 统计用户书签数量
     */
    long countByUserId(Long userId);

    /**
     * 统计用户某本书的书签数量
     */
    long countByUserIdAndBookId(Long userId, Long bookId);
}
