/**
 * In-memory store for F1.
 *
 * Mirrors the shape that the localStorage data adapter writes on the frontend
 * so swapping in `ApiDataAdapter` in F2 is a one-to-one replacement.
 *
 * Replaced with Postgres + drizzle/node-pg-migrate in F2.
 */

import { randomUUID } from 'node:crypto';
import {
  type Ammunition,
  type Dog,
  type Location,
  type Session,
  type User,
  type UserData,
  type Weapon,
} from '@huntledger/shared';

interface UserRecord {
  user: User;
  passwordHash: string;
  salt: string;
}

const users = new Map<string, UserRecord>();
const dataByUser = new Map<string, UserData>();

export const memoryStore = {
  // ----- users -----
  createUser(input: Omit<User, 'id' | 'createdAt'> & { passwordHash: string; salt: string }): User {
    if ([...users.values()].some((u) => u.user.email === input.email)) {
      throw new Error('email already in use');
    }
    const user: User = {
      id: randomUUID(),
      email: input.email,
      name: input.name,
      createdAt: new Date().toISOString(),
    };
    users.set(user.id, { user, passwordHash: input.passwordHash, salt: input.salt });
    dataByUser.set(user.id, {
      sessions: [],
      weapons: [],
      ammunition: [],
      dogs: [],
      locations: [],
    });
    return user;
  },

  findUserByEmail(email: string): UserRecord | undefined {
    return [...users.values()].find((u) => u.user.email === email);
  },

  getUser(id: string): User | undefined {
    return users.get(id)?.user;
  },

  // ----- aggregate data -----
  getData(userId: string): UserData {
    return (
      dataByUser.get(userId) ?? {
        sessions: [],
        weapons: [],
        ammunition: [],
        dogs: [],
        locations: [],
      }
    );
  },

  replaceData(userId: string, data: UserData): UserData {
    dataByUser.set(userId, data);
    return data;
  },

  // ----- weapons -----
  addWeapon(userId: string, weapon: Weapon): Weapon {
    const data = this.getData(userId);
    data.weapons.push(weapon);
    dataByUser.set(userId, data);
    return weapon;
  },

  // ----- ammunition -----
  addAmmunition(userId: string, ammo: Ammunition): Ammunition {
    const data = this.getData(userId);
    data.ammunition.push(ammo);
    dataByUser.set(userId, data);
    return ammo;
  },

  // ----- dogs -----
  addDog(userId: string, dog: Dog): Dog {
    const data = this.getData(userId);
    data.dogs.push(dog);
    dataByUser.set(userId, data);
    return dog;
  },

  // ----- locations -----
  addLocation(userId: string, location: Location): Location {
    const data = this.getData(userId);
    data.locations.push(location);
    dataByUser.set(userId, data);
    return location;
  },

  // ----- sessions -----
  addSession(userId: string, session: Session): Session {
    const data = this.getData(userId);
    data.sessions.push(session);
    dataByUser.set(userId, data);
    return session;
  },
};

export type MemoryStore = typeof memoryStore;
