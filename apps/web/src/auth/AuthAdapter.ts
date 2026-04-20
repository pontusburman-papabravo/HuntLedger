/**
 * AuthAdapter — abstract authentication backend.
 *
 * F1 implementation: LocalStorageAuthAdapter (PBKDF2-SHA256, no server).
 * F2 implementation: FirebaseAuthAdapter (frontend SDK + ID token to API).
 *
 * Keep this interface intentionally minimal — we only swap the implementation,
 * never the surface.
 */

import type { User } from '@huntledger/shared';

export interface AuthSession {
  user: User;
  /** ISO date string when this session expires. */
  expiresAt: string;
}

export interface AuthAdapter {
  /** Returns the current session if one is restored from persistent storage. */
  getCurrentSession(): Promise<AuthSession | null>;

  /** Creates a new account and returns the resulting session. */
  register(input: { email: string; name: string; password: string }): Promise<AuthSession>;

  /** Signs an existing user in. Throws on bad credentials. */
  login(input: { email: string; password: string }): Promise<AuthSession>;

  /** Clears any persisted session. */
  logout(): Promise<void>;
}
