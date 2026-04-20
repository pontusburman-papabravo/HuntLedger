/**
 * LocalStorageAuthAdapter
 *
 * Stores users and sessions in the browser's localStorage. Passwords are
 * hashed with PBKDF2-SHA256 (WebCrypto). See `crypto.ts` for the disclaimer.
 *
 * Storage layout:
 *   localStorage["huntledger.users"]        = StoredUser[]
 *   localStorage["huntledger.currentUser"]  = { userId, expiresAt }
 *
 * StoredUser is { id, email, name, salt, passwordHash, createdAt }.
 */

import type { User } from '@huntledger/shared';
import type { AuthAdapter, AuthSession } from './AuthAdapter';
import { generateSaltBase64, hashPassword, safeEqual } from './crypto';

const USERS_KEY = 'huntledger.users';
const SESSION_KEY = 'huntledger.currentUser';
const LEGACY_USERS_KEY = 'huntledge.users';
const LEGACY_SESSION_KEY = 'huntledge.currentUser';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days.

function migrateAuthStorageKeys(): void {
  if (!localStorage.getItem(USERS_KEY) && localStorage.getItem(LEGACY_USERS_KEY)) {
    localStorage.setItem(USERS_KEY, localStorage.getItem(LEGACY_USERS_KEY)!);
    localStorage.removeItem(LEGACY_USERS_KEY);
  }
  if (!localStorage.getItem(SESSION_KEY) && localStorage.getItem(LEGACY_SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, localStorage.getItem(LEGACY_SESSION_KEY)!);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  }
}

migrateAuthStorageKeys();

interface StoredUser {
  id: string;
  email: string;
  name: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

interface StoredSession {
  userId: string;
  expiresAt: string;
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(s: StoredSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

function toPublicUser(u: StoredUser): User {
  return { id: u.id, email: u.email, name: u.name, createdAt: u.createdAt };
}

function newSessionFor(user: User): AuthSession {
  const session: AuthSession = {
    user,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  writeSession({ userId: user.id, expiresAt: session.expiresAt });
  return session;
}

export class LocalStorageAuthAdapter implements AuthAdapter {
  async getCurrentSession(): Promise<AuthSession | null> {
    const stored = readSession();
    if (!stored) return null;
    const user = readUsers().find((u) => u.id === stored.userId);
    if (!user) return null;
    return { user: toPublicUser(user), expiresAt: stored.expiresAt };
  }

  async register(input: { email: string; name: string; password: string }): Promise<AuthSession> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (!email || !name || !input.password) {
      throw new Error('Missing required fields');
    }
    if (input.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const users = readUsers();
    if (users.some((u) => u.email === email)) {
      throw new Error('An account with that email already exists');
    }

    const salt = generateSaltBase64();
    const passwordHash = await hashPassword(input.password, salt);
    const stored: StoredUser = {
      id: crypto.randomUUID(),
      email,
      name,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    users.push(stored);
    writeUsers(users);
    return newSessionFor(toPublicUser(stored));
  }

  async login(input: { email: string; password: string }): Promise<AuthSession> {
    const email = input.email.trim().toLowerCase();
    const user = readUsers().find((u) => u.email === email);
    if (!user) throw new Error('Invalid email or password');
    const candidate = await hashPassword(input.password, user.salt);
    if (!safeEqual(candidate, user.passwordHash)) {
      throw new Error('Invalid email or password');
    }
    return newSessionFor(toPublicUser(user));
  }

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  }
}
