import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, User } from './database';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MAX_USERS = parseInt(process.env.MAX_USERS || '10');

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function registerUser(username: string, email: string, password: string): Promise<{ success: boolean; message: string; user?: AuthUser; token?: string }> {
  // Check if user limit is reached
  const userCount = await db.getUserCount();
  if (userCount >= MAX_USERS) {
    return { success: false, message: 'Registration is currently closed. Maximum number of users reached.' };
  }

  // Check if username already exists
  const existingUserByUsername = await db.getUserByUsername(username);
  if (existingUserByUsername) {
    return { success: false, message: 'Username already exists' };
  }

  // Check if email already exists
  const existingUserByEmail = await db.getUserByEmail(email);
  if (existingUserByEmail) {
    return { success: false, message: 'Email already exists' };
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await db.createUser(username, email, passwordHash);
    
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    const token = generateToken(authUser);

    return { success: true, message: 'User created successfully', user: authUser, token };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registration failed' };
  }
}

export async function loginUser(username: string, password: string): Promise<{ success: boolean; message: string; user?: AuthUser; token?: string }> {
  try {
    const user = await db.getUserByUsername(username);
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, message: 'Invalid credentials' };
    }

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    const token = generateToken(authUser);

    return { success: true, message: 'Login successful', user: authUser, token };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Login failed' };
  }
}

export function getAuthUserFromRequest(request: NextRequest): AuthUser | null {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  return verifyToken(token);
}

export function getAuthUserFromToken(token: string): AuthUser | null {
  return verifyToken(token);
}
