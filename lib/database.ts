import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || './database.sqlite';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface Chat {
  id: number;
  user_id: number;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant';
  content: string;
  image_url?: string;
  created_at: string;
}

class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  private async init() {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));
    const all = promisify(this.db.all.bind(this.db));

    // Create users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create chats table
    await run(`
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        model TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create messages table
    await run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await run(`CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats (user_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages (chat_id)`);
  }

  async getUserCount(): Promise<number> {
    const get = promisify(this.db.get.bind(this.db));
    const result = await get('SELECT COUNT(*) as count FROM users');
    return result.count;
  }

  async createUser(username: string, email: string, passwordHash: string): Promise<User> {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));

    await run(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    const user = await get('SELECT * FROM users WHERE username = ?', [username]);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const get = promisify(this.db.get.bind(this.db));
    const user = await get('SELECT * FROM users WHERE username = ?', [username]);
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const get = promisify(this.db.get.bind(this.db));
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    return user || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const get = promisify(this.db.get.bind(this.db));
    const user = await get('SELECT * FROM users WHERE id = ?', [id]);
    return user || null;
  }

  async createChat(userId: number, title: string, model: string): Promise<Chat> {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));

    await run(
      'INSERT INTO chats (user_id, title, model) VALUES (?, ?, ?)',
      [userId, title, model]
    );

    const chat = await get('SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
    return chat;
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    const all = promisify(this.db.all.bind(this.db));
    const chats = await all(
      'SELECT * FROM chats WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    return chats;
  }

  async getChatById(chatId: number): Promise<Chat | null> {
    const get = promisify(this.db.get.bind(this.db));
    const chat = await get('SELECT * FROM chats WHERE id = ?', [chatId]);
    return chat || null;
  }

  async updateChatTitle(chatId: number, title: string): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    await run(
      'UPDATE chats SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, chatId]
    );
  }

  async addMessage(chatId: number, role: 'user' | 'assistant', content: string, imageUrl?: string): Promise<Message> {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));

    await run(
      'INSERT INTO messages (chat_id, role, content, image_url) VALUES (?, ?, ?, ?)',
      [chatId, role, content, imageUrl]
    );

    const message = await get('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1', [chatId]);
    return message;
  }

  async getChatMessages(chatId: number): Promise<Message[]> {
    const all = promisify(this.db.all.bind(this.db));
    const messages = await all(
      'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
      [chatId]
    );
    return messages;
  }

  async deleteChat(chatId: number): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    await run('DELETE FROM chats WHERE id = ?', [chatId]);
  }

  close() {
    this.db.close();
  }
}

export const db = new Database();
