/**
 * Database setup script for Lightweight Web Analytics
 * 
 * This script initializes the SQLite database with the required schema
 * and creates the data directory if it doesn't exist.
 */

import { Database } from 'better-sqlite3';
import { mkdir, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

// Get database path from environment or use default
const DB_PATH = process.env.DB_PATH || join(process.cwd(), 'data', 'analytics.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  console.log(`Creating data directory: ${dataDir}`);
  fs.mkdirSync(dataDir, { recursive: true });
}

// Read schema file
const schemaPath = path.join(process.cwd(), 'schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.error('Schema file not found:', schemaPath);
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf8');

// Initialize database
try {
  console.log(`Initializing database at: ${DB_PATH}`);
  const db = new Database(DB_PATH);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Execute schema
  db.exec(schema);

  // Verify tables were created
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Created tables:');
  tables.forEach(table => {
    console.log(`- ${table.name}`);
  });

  db.close();
  console.log('Database setup completed successfully.');
} catch (error) {
  console.error('Error setting up database:', error);
  process.exit(1);
}
