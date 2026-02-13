const { kv } = require('@vercel/kv');
require('dotenv').config();

// Simple in-memory cache to avoid fetching from Redis on every single micro-op
// In a serverless environment (Vercel), this cache is per-request/execution.
// We must fetch from KV at start of request and save at end (or immediately).

class JsonDB {
  constructor() {
    this.dummyData = {
      admins: [],
      conventions: [],
      discount_codes: [],
      margins: []
    };
  }

  async getAll(collection) {
    // If running locally without KV or env vars, fallback to memory (lost on restart)
    if (!process.env.KV_REST_API_URL) {
      console.warn('⚠️ KV_REST_API_URL missing. Using in-memory volatile storage.');
      return this.dummyData[collection] || [];
    }
    const data = await kv.get(collection);
    return data || [];
  }

  async saveAll(collection, data) {
    if (!process.env.KV_REST_API_URL) {
      this.dummyData[collection] = data;
      return;
    }
    await kv.set(collection, data);
  }

  // Helpers to simulate SQL-like operations
  async findOne(collection, predicate) {
    const list = await this.getAll(collection);
    return list.find(predicate);
  }

  async find(collection, predicate) {
    const list = await this.getAll(collection);
    return predicate ? list.filter(predicate) : list;
  }

  async insert(collection, item) {
    const list = await this.getAll(collection);
    // Auto-increment ID simulation
    const maxId = list.reduce((max, i) => (i.id > max ? i.id : max), 0);
    const newItem = { ...item, id: maxId + 1, created_at: new Date().toISOString() };
    list.push(newItem);
    await this.saveAll(collection, list);
    return newItem; // Return new item with ID
  }

  async update(collection, id, updates) {
    const list = await this.getAll(collection);
    const index = list.findIndex(i => i.id == id); // Loose equality for string/number id mismatch
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      await this.saveAll(collection, list);
      return list[index];
    }
    return null;
  }

  async delete(collection, id) {
    let list = await this.getAll(collection);
    const initialLen = list.length;
    list = list.filter(i => i.id != id);
    if (list.length !== initialLen) {
      await this.saveAll(collection, list);
      return true;
    }
    return false;
  }
}

const db = new JsonDB();

module.exports = db;
