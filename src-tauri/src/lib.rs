use once_cell::sync::Lazy;
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::error::Error as StdError;
use std::path::PathBuf;
use std::sync::Mutex; // Use Mutex for thread-safe access to the connection
use tauri::Manager; // Required for app_handle() and path() // Alias std::error::Error to avoid conflict if needed

// --- Data Structures ---

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
struct CalendarEvent {
    id: String,   // Using String for ID, could be number or UUID
    date: String, // Store date as ISO string (e.g., "YYYY-MM-DD")
    title: String,
    description: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
struct CalendarState {
    events: Vec<CalendarEvent>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
struct Holding {
    ticker: String,
    quantity: f64,       // Using f64 for quantity, adjust if needed
    purchase_price: f64, // Using f64 for price
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
struct PortfolioState {
    holdings: Vec<Holding>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
struct InvestmentStyleState {
    // Simplified to a single description string based on component analysis
    style_description: Option<String>,
    // risk_tolerance: Option<String>,
    // investment_goal: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
struct AppConfig {
    api_key: Option<String>,
    endpoint_url: Option<String>,
    portfolio: Option<PortfolioState>,
    investment_style: Option<InvestmentStyleState>, // Field name remains the same
    calendar: Option<CalendarState>,                // Add calendar state
}

// --- Database Setup ---

const DB_FILE_NAME: &str = "app_config.db";
const CONFIG_KEY: &str = "app_settings"; // Key to store the config JSON

// Use a Mutex to wrap the Connection for thread safety in Tauri commands
struct DbConnection(Mutex<Option<Connection>>);

// Function to get the database path using Tauri's API
fn get_database_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let path = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory path: {:?}", e))?
        .join(DB_FILE_NAME);

    // Ensure the directory exists
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create data directory: {}", e))?;
    }
    Ok(path)
}

// Function to initialize the database connection and create table
fn initialize_database(db_path: &PathBuf) -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open(db_path)?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;
    Ok(conn)
}

// --- Tauri Commands ---

#[tauri::command]
fn save_config(app_handle: tauri::AppHandle, config: AppConfig) -> Result<(), String> {
    let db_state = app_handle.state::<DbConnection>();
    let maybe_conn = db_state
        .0
        .lock()
        .map_err(|_| "Failed to lock DB mutex".to_string())?; // Lock the mutex

    if let Some(conn) = &*maybe_conn {
        // Dereference Option<Connection>
        let json_value = serde_json::to_string(&config)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;

        conn.execute(
            "INSERT OR REPLACE INTO config (key, value) VALUES (?1, ?2)",
            params![CONFIG_KEY, json_value],
        )
        .map_err(|e| format!("Failed to save config to DB: {}", e))?;
        Ok(())
    } else {
        Err("Database connection not initialized".to_string())
    }
}

#[tauri::command]
fn load_config(app_handle: tauri::AppHandle) -> Result<AppConfig, String> {
    let db_state = app_handle.state::<DbConnection>();
    let maybe_conn = db_state
        .0
        .lock()
        .map_err(|_| "Failed to lock DB mutex".to_string())?;

    if let Some(conn) = &*maybe_conn {
        let result = conn.query_row(
            "SELECT value FROM config WHERE key = ?1",
            params![CONFIG_KEY],
            |row| row.get::<_, String>(0), // Get the JSON string
        );

        match result {
            Ok(json_value) => serde_json::from_str(&json_value)
                .map_err(|e| format!("Failed to deserialize config: {}", e)),
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                // No config saved yet, return default
                Ok(AppConfig::default())
            }
            Err(e) => Err(format!("Failed to load config from DB: {}", e)),
        }
    } else {
        Err("Database connection not initialized".to_string())
    }
}

// --- Tauri Setup ---

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(DbConnection(Mutex::new(None))) // Add the DB connection state
        .setup(|app| -> Result<(), Box<dyn StdError>> {
            // Explicit return type for setup
            // Initialize the database connection on startup
            let handle = app.handle();
            let db_path = get_database_path(handle).map_err(|e| {
                eprintln!("Failed to get database path: {}", e);
                // Return the error as a boxed trait object
                Box::<dyn StdError>::from(e)
            })?;

            let conn = initialize_database(&db_path).map_err(|e| {
                eprintln!("Failed to initialize database: {}", e);
                // Return the error as a boxed trait object
                Box::new(e) as Box<dyn StdError>
            })?;

            // Store the connection in the managed state
            let db_state = handle.state::<DbConnection>();
            // Use a match or expect for safer unwrapping of the Mutex lock
            match db_state.0.lock() {
                Ok(mut guard) => *guard = Some(conn),
                Err(poisoned) => {
                    // Don't return the PoisonError directly due to lifetimes.
                    // Create a new error indicating the mutex was poisoned.
                    let error_message = format!("Mutex was poisoned: {}", poisoned);
                    eprintln!("Critical error during setup: {}", error_message);
                    return Err(Box::<dyn StdError>::from(error_message));
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            save_config, // Register the new command
            load_config  // Register the new command
        ])
        .run(tauri::generate_context!("../src-tauri/tauri.conf.json"))
        .expect("error while running tauri application");
}
