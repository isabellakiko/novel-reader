package com.novelreader.repository;

import com.novelreader.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 书籍数据访问层
 */
@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    /**
     * 根据用户ID查询书籍列表
     */
    Page<Book> findByUserIdOrderByUpdatedAtDesc(Long userId, Pageable pageable);

    /**
     * 根据用户ID查询所有书籍
     */
    List<Book> findByUserIdOrderByUpdatedAtDesc(Long userId);

    /**
     * 根据ID和用户ID查询书籍
     */
    Optional<Book> findByIdAndUserId(Long id, Long userId);

    /**
     * 搜索用户的书籍
     */
    @Query("SELECT b FROM Book b WHERE b.user.id = :userId AND " +
           "(LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.author) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Book> searchByKeyword(@Param("userId") Long userId,
                               @Param("keyword") String keyword,
                               Pageable pageable);

    /**
     * 检查用户是否已有同名书籍
     */
    boolean existsByUserIdAndTitle(Long userId, String title);

    /**
     * 统计用户书籍数量
     */
    long countByUserId(Long userId);
}
