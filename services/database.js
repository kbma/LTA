const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Determine if we are using Postgres (Vercel) or local SQLite
const isPostgres = !!process.env.POSTGRES_URL;

let dbInstance = null;
let sqlJs = null;

const DB_PATH = process.env.DB_PATH || './database.db';

// Helper to convert '?' params to '$1', '$2' etc for Postgres
function convertQueryToPostgres(sql) {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
}

async function initDatabase() {
  if (dbInstance) return dbInstance;

  if (isPostgres) {
    const { Pool } = require('pg');
    dbInstance = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    try {
      const client = await dbInstance.connect();
      client.release();
      console.log('✅ Connected to Postgres Database');
    } catch (err) {
      console.error('❌ Failed to connect to Postgres:', err);
      throw err;
    }
    return dbInstance;
  } else {
    // Local SQLite (sql.js)
    const initSqlJs = require('sql.js');
    sqlJs = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new sqlJs.Database(fileBuffer);
    } else {
      dbInstance = new sqlJs.Database();
    }
    
    // Add columns if missing (Simple migration logic for local)
    try {
        dbInstance.run("ALTER TABLE margins ADD COLUMN valid_from DATE");
    } catch(e) {}
    try {
        dbInstance.run("ALTER TABLE margins ADD COLUMN valid_until DATE");
    } catch(e) {}
    try {
        dbInstance.run("ALTER TABLE margins ADD COLUMN is_active INTEGER DEFAULT 1");
    } catch(e) {}

    saveDatabase(); // Initial save
    return dbInstance;
  }
}

// Wrapper to unify API (Async for everything)
async function run(sql, params = []) {
    if (!dbInstance) await initDatabase();

    if (isPostgres) {
        const pSql = convertQueryToPostgres(sql);
        await dbInstance.query(pSql, params);
    } else {
        dbInstance.run(sql, params);
        saveDatabase();
    }
}

async function get(sql, params = []) {
    if (!dbInstance) await initDatabase();

    if (isPostgres) {
        const pSql = convertQueryToPostgres(sql);
        const res = await dbInstance.query(pSql, params);
        return res.rows[0];
    } else {
        const stmt = dbInstance.prepare(sql);
        stmt.bind(params);
        let row;
        if (stmt.step()) {
            row = stmt.getAsObject();
        }
        stmt.free();
        return row;
    }
}

async function all(sql, params = []) {
    if (!dbInstance) await initDatabase();

    if (isPostgres) {
        const pSql = convertQueryToPostgres(sql);
        const res = await dbInstance.query(pSql, params);
        return res.rows;
    } else {
        const stmt = dbInstance.prepare(sql);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    }
}

function saveDatabase() {
    if (isPostgres) return; // Autosave
    if (!dbInstance) return;
    try {
        const data = dbInstance.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    } catch (err) {
        console.error("Failed to save database:", err);
    }
}

function close() {
    if (isPostgres) {
        if (dbInstance) dbInstance.end();
    } else {
        if (dbInstance) {
            saveDatabase();
            dbInstance.close();
        }
    }
    dbInstance = null;
}

// Factory for backward compatibility but ASYNC wrapper
function createWrapper() {
  return {
    async exec(sql) {
        if (isPostgres) {
             await dbInstance.query(sql);
        } else {
             dbInstance.exec(sql);
             saveDatabase();
        }
    },
    prepare(sql) {
      // Return an object that has async methods
      return {
        run: async (...params) => run(sql, params),
        get: async (...params) => get(sql, params),
        all: async (...params) => all(sql, params)
      };
    }
  };
}

module.exports = {
  initDatabase,
  run,
  get,
  all,
  saveDatabase,
  close,
  createWrapper,
  isPostgres
};
