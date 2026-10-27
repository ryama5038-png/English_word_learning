-- ============================================================
-- Pet-Vocab-App データベース初期化SQL (PostgreSQL)
-- ============================================================

-- 1. ユーザーテーブル (users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    character_type VARCHAR(30) DEFAULT NULL,
    points INTEGER NOT NULL DEFAULT 230,
    energy INTEGER NOT NULL DEFAULT 95,
    last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_studied_word_id INTEGER DEFAULT NULL,
    last_studied_offset INTEGER NOT NULL DEFAULT 0
);

-- 2. 単語辞書テーブル (words)
CREATE TABLE IF NOT EXISTS words (
    id SERIAL PRIMARY KEY,
    word_spell VARCHAR(100) NOT NULL,
    level VARCHAR(30) NOT NULL DEFAULT 'basic',
    noun_meaning TEXT,
    verb_meaning TEXT,
    adj_meaning TEXT,
    adv_meaning TEXT,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_words_word_spell ON words (word_spell);
CREATE INDEX IF NOT EXISTS ix_words_level ON words (level);

-- 3. 学習記録・マイ単語帳 中間テーブル (user_words)
CREATE TABLE IF NOT EXISTS user_words (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    in_my_book BOOLEAN NOT NULL DEFAULT FALSE,
    is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
    last_searched_at TIMESTAMP WITH TIME ZONE,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_user_word UNIQUE (user_id, word_id)
);

CREATE INDEX IF NOT EXISTS ix_user_words_user_id ON user_words (user_id);
CREATE INDEX IF NOT EXISTS ix_user_words_word_id ON user_words (word_id);
CREATE INDEX IF NOT EXISTS ix_user_words_last_searched_at ON user_words (last_searched_at);
CREATE INDEX IF NOT EXISTS ix_user_words_is_bookmarked ON user_words (is_bookmarked);

-- 4. テスト用初期アカウントの挿入 (ユーザー名: ren, パスワード: Tax1729r)
INSERT INTO users (username, hashed_password, points, energy)
VALUES (
    'ren',
    '$2b$12$siPRUF0lxW5CAsxSx2M1jeHpaUsiC2tHGQSaxfv62o92kgOo4JkAW',
    230,
    95
) ON CONFLICT (username) DO NOTHING;

