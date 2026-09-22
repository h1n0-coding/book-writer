CREATE TABLE characters (
    id TEXT PRIMARY KEY NOT NULL,
    book_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    age INTEGER,
    occupation TEXT NOT NULL DEFAULT '',
    goals TEXT NOT NULL DEFAULT '',
    fears TEXT NOT NULL DEFAULT '',
    secrets TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE INDEX idx_characters_book_id ON characters(book_id);