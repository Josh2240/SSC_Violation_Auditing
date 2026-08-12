import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export interface UserPayload {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
}

// Get user from request
export async function getUserFromRequest(request: NextRequest): Promise<UserPayload | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Middleware to check authentication
export async function requireAuth(request: NextRequest): Promise<UserPayload> {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

// Middleware to check role
export async function requireRole(request: NextRequest, allowedRoles: string[]): Promise<UserPayload> {
  const user = await requireAuth(request);
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  return user;
}

