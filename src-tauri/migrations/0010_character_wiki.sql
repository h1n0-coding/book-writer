ALTER TABLE characters ADD COLUMN aliases TEXT NOT NULL DEFAULT '';
ALTER TABLE characters ADD COLUMN role TEXT NOT NULL DEFAULT '';
ALTER TABLE characters ADD COLUMN appearance TEXT NOT NULL DEFAULT '';
ALTER TABLE characters ADD COLUMN personality TEXT NOT NULL DEFAULT '';
ALTER TABLE characters ADD COLUMN backstory TEXT NOT NULL DEFAULT '';
ALTER TABLE characters ADD COLUMN arc_beginning TEXT NOT NULL DEFAULT '';
ALTER TABLE characters ADD COLUMN arc_middle TEXT NOT NULL DEFAULT '';
ALTER TABLE characters ADD COLUMN arc_end TEXT NOT NULL DEFAULT '';

CREATE TABLE character_fields (
    id TEXT PRIMARY KEY NOT NULL,
    character_id TEXT NOT NULL,
    name TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_character_fields_character_id ON character_fields(character_id);