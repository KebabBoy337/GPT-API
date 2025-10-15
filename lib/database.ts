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

    // Helper function for db.run with Promise
    const runQuery = (sql: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        this.db.run(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    };

    // Create users table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create chats table
    await runQuery(`
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
    await runQuery(`
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
    await runQuery(`CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats (user_id)`);
    await runQuery(`CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages (chat_id)`);
  }

  async getUserCount(): Promise<number> {
    const result = await new Promise<{ count: number }>((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) reject(err);
        else resolve(row as { count: number });
      });
    });
    return result.count;
  }

  async createUser(username: string, email: string, passwordHash: string): Promise<User> {

    await new Promise<void>((resolve, reject) => {
      this.db.run(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const user = await new Promise<User | null>((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row as User || null);
      });
    });
    return user!;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const user = await new Promise<User | null>((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row as User || null);
      });
    });
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await new Promise<User | null>((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row as User || null);
      });
    });
    return user;
  }

  async getUserById(id: number): Promise<User | null> {
    const user = await new Promise<User | null>((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as User || null);
      });
    });
    return user;
  }

  async createChat(userId: number, title: string, model: string): Promise<Chat> {

    await new Promise<void>((resolve, reject) => {
      this.db.run(
        'INSERT INTO chats (user_id, title, model) VALUES (?, ?, ?)',
        [userId, title, model],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const chat = await new Promise<Chat | null>((resolve, reject) => {
      this.db.get('SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row as Chat || null);
      });
    });
    return chat!;
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    const chats = await new Promise<Chat[]>((resolve, reject) => {
      this.db.all(
        'SELECT * FROM chats WHERE user_id = ? ORDER BY updated_at DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Chat[]);
        }
      );
    });
    return chats;
  }

  async getChatById(chatId: number): Promise<Chat | null> {
    const chat = await new Promise<Chat | null>((resolve, reject) => {
      this.db.get('SELECT * FROM chats WHERE id = ?', [chatId], (err, row) => {
        if (err) reject(err);
        else resolve(row as Chat || null);
      });
    });
    return chat;
  }

  async updateChatTitle(chatId: number, title: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.db.run(
        'UPDATE chats SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, chatId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async addMessage(chatId: number, role: 'user' | 'assistant', content: string, imageUrl?: string): Promise<Message> {

    await new Promise<void>((resolve, reject) => {
      this.db.run(
        'INSERT INTO messages (chat_id, role, content, image_url) VALUES (?, ?, ?, ?)',
        [chatId, role, content, imageUrl],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const message = await new Promise<Message | null>((resolve, reject) => {
      this.db.get('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1', [chatId], (err, row) => {
        if (err) reject(err);
        else resolve(row as Message || null);
      });
    });
    return message!;
  }

  async getChatMessages(chatId: number): Promise<Message[]> {
    const messages = await new Promise<Message[]>((resolve, reject) => {
      this.db.all(
        'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
        [chatId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Message[]);
        }
      );
    });
    return messages;
  }

  async deleteChat(chatId: number): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.db.run(
        'DELETE FROM chats WHERE id = ?',
        [chatId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  close() {
    this.db.close();
  }
}

export const db = new Database();
