use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/0001_initial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_chapters_scenes",
            sql: include_str!("../migrations/0002_chapters_scenes.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_characters",
            sql: include_str!("../migrations/0003_characters.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create_locations",
            sql: include_str!("../migrations/0004_locations.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "create_events",
            sql: include_str!("../migrations/0005_events.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "create_notes",
            sql: include_str!("../migrations/0006_notes.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "create_character_relationships",
            sql: include_str!("../migrations/0007_character_relationships.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "extend_events",
            sql: include_str!("../migrations/0008_events_extended.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "event_positions",
            sql: include_str!("../migrations/0009_event_positions.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "character_wiki",
            sql: include_str!("../migrations/0010_character_wiki.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:bookwriter.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}