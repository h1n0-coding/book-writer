ALTER TABLE events ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';

CREATE TABLE event_scenes (
    event_id TEXT NOT NULL,
    scene_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (event_id, scene_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

CREATE TABLE event_characters (
    event_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (event_id, character_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE event_locations (
    event_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (event_id, location_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

CREATE TABLE event_relations (
    id TEXT PRIMARY KEY NOT NULL,
    book_id TEXT NOT NULL,
    from_event_id TEXT NOT NULL,
    to_event_id TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (from_event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (to_event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_event_scenes_event ON event_scenes(event_id);
CREATE INDEX idx_event_scenes_scene ON event_scenes(scene_id);
CREATE INDEX idx_event_characters_event ON event_characters(event_id);
CREATE INDEX idx_event_characters_character ON event_characters(character_id);
CREATE INDEX idx_event_locations_event ON event_locations(event_id);
CREATE INDEX idx_event_locations_location ON event_locations(location_id);
CREATE INDEX idx_event_relations_book ON event_relations(book_id);
CREATE INDEX idx_event_relations_from ON event_relations(from_event_id);
CREATE INDEX idx_event_relations_to ON event_relations(to_event_id);