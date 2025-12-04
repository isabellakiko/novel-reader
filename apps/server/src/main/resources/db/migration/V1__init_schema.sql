-- V1: 初始化数据库 Schema
-- 用户表
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar_url VARCHAR(500),
    role VARCHAR(20) DEFAULT 'USER',
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 书籍表
CREATE TABLE books (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100),
    description TEXT,
    cover_url VARCHAR(500),
    file_hash VARCHAR(64),
    file_size BIGINT,
    chapter_count INT DEFAULT 0,
    word_count BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 章节表
CREATE TABLE chapters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id BIGINT NOT NULL,
    chapter_index INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    word_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- 阅读进度表
CREATE TABLE reading_progress (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    chapter_index INT DEFAULT 0,
    scroll_position DOUBLE DEFAULT 0,
    progress_percent DOUBLE DEFAULT 0,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE (user_id, book_id)
);

-- 书签表
CREATE TABLE bookmarks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    chapter_index INT NOT NULL,
    position INT DEFAULT 0,
    selected_text VARCHAR(500),
    note TEXT,
    color VARCHAR(20) DEFAULT 'yellow',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- 阅读统计表
CREATE TABLE reading_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT,
    date DATE NOT NULL,
    reading_time INT DEFAULT 0,
    characters_read BIGINT DEFAULT 0,
    chapters_read INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_chapters_book_id ON chapters(book_id);
CREATE INDEX idx_reading_progress_user_book ON reading_progress(user_id, book_id);
CREATE INDEX idx_bookmarks_user_book ON bookmarks(user_id, book_id);
CREATE INDEX idx_reading_stats_user_date ON reading_stats(user_id, date);
