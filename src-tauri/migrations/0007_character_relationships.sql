CREATE TABLE character_relationships (
    id TEXT PRIMARY KEY NOT NULL,
    book_id TEXT NOT NULL,
    from_character_id TEXT NOT NULL,
    to_character_id TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    strength INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (from_character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (to_character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_character_relationships_book_id ON character_relationships(book_id);
CREATE INDEX idx_character_relationships_from ON character_relationships(from_character_id);
CREATE INDEX idx_character_relationships_to ON character_relationships(to_character_id);