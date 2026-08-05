const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// File database disimpan di folder data/ (sudah di-gitignore)
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'app.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
