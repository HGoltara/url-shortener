const path = require("path");
const Database = require("better-sqlite3");

const dbPath =
  process.env.DB_PATH || path.join(__dirname, "..", "data", "shortener.db");
const db = new Database(dbPath);

if (dbPath !== ":memory:") {
  db.pragma("journal_mode = WAL");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    code TEXT PRIMARY KEY,
    original_url TEXT NOT NULL,
    clicks INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

module.exports = db;
