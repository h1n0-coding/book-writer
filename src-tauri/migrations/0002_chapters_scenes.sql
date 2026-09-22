CREATE TABLE chapters (
    id TEXT PRIMARY KEY NOT NULL,
    book_id TEXT NOT NULL,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    synopsis TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'done')),
    target_word_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE INDEX idx_chapters_book_id ON chapters(book_id);

CREATE TABLE scenes (
    id TEXT PRIMARY KEY NOT NULL,
    chapter_id TEXT NOT NULL,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    content TEXT NOT NULL DEFAULT '',
    synopsis TEXT NOT NULL DEFAULT '',
    pov_character_id TEXT,
    location_id TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'done')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE INDEX idx_scenes_chapter_id ON scenes(chapter_id);