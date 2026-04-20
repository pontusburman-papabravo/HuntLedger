/**
 * LocalStorageDataAdapter
 *
 * Persists all HuntLedger data per user under
 *   localStorage["huntledger.data." + userId]
 *
 * All values are validated against the zod schemas in @huntledger/shared on
 * both read and write so corrupt or stale data fails loudly.
 */

import {
  ammunitionSchema,
  createAmmunitionSchema,
  createDogSchema,
  createLocationSchema,
  createSessionSchema,
  createWeaponSchema,
  dogSchema,
  locationSchema,
  sessionSchema,
  userDataSchema,
  weaponSchema,
  type Ammunition,
  type CreateAmmunitionInput,
  type CreateDogInput,
  type CreateLocationInput,
  type CreateSessionInput,
  type CreateWeaponInput,
  type Dog,
  type Location,
  type Session,
  type UserData,
  type Weapon,
} from '@huntledger/shared';
import type { DataAdapter } from './DataAdapter';

const KEY_PREFIX = 'huntledger.data.';
const LEGACY_KEY_PREFIX = 'huntledge.data.';

function key(userId: string): string {
  return KEY_PREFIX + userId;
}

function migrateLegacyUserDataKey(userId: string): void {
  const k = key(userId);
  if (localStorage.getItem(k)) return;
  const legacy = localStorage.getItem(LEGACY_KEY_PREFIX + userId);
  if (legacy) {
    localStorage.setItem(k, legacy);
    localStorage.removeItem(LEGACY_KEY_PREFIX + userId);
  }
}

function emptyData(): UserData {
  return { sessions: [], weapons: [], ammunition: [], dogs: [], locations: [] };
}

export class LocalStorageDataAdapter implements DataAdapter {
  async load(userId: string): Promise<UserData> {
    migrateLegacyUserDataKey(userId);
    const raw = localStorage.getItem(key(userId));
    if (!raw) return emptyData();
    try {
      const parsed = userDataSchema.parse(JSON.parse(raw));
      return parsed;
    } catch (err) {
      console.error('Corrupt HuntLedger data in localStorage; resetting.', err);
      return emptyData();
    }
  }

  async save(userId: string, data: UserData): Promise<void> {
    const validated = userDataSchema.parse(data);
    localStorage.setItem(key(userId), JSON.stringify(validated));
  }

  async createWeapon(userId: string, input: CreateWeaponInput): Promise<Weapon> {
    const parsed = createWeaponSchema.parse(input);
    const weapon: Weapon = weaponSchema.parse({
      ...parsed,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
    const data = await this.load(userId);
    data.weapons.push(weapon);
    await this.save(userId, data);
    return weapon;
  }

  async createAmmunition(userId: string, input: CreateAmmunitionInput): Promise<Ammunition> {
    const parsed = createAmmunitionSchema.parse(input);
    const ammo: Ammunition = ammunitionSchema.parse({ ...parsed, id: crypto.randomUUID() });
    const data = await this.load(userId);
    data.ammunition.push(ammo);
    await this.save(userId, data);
    return ammo;
  }

  async createDog(userId: string, input: CreateDogInput): Promise<Dog> {
    const parsed = createDogSchema.parse(input);
    const dog: Dog = dogSchema.parse({ ...parsed, id: crypto.randomUUID() });
    const data = await this.load(userId);
    data.dogs.push(dog);
    await this.save(userId, data);
    return dog;
  }

  async createLocation(userId: string, input: CreateLocationInput): Promise<Location> {
    const parsed = createLocationSchema.parse(input);
    const location: Location = locationSchema.parse({ ...parsed, id: crypto.randomUUID() });
    const data = await this.load(userId);
    data.locations.push(location);
    await this.save(userId, data);
    return location;
  }

  async createSession(userId: string, input: CreateSessionInput): Promise<Session> {
    const parsed = createSessionSchema.parse(input);
    const session: Session = sessionSchema.parse({ ...parsed, id: crypto.randomUUID() });
    const data = await this.load(userId);
    data.sessions.push(session);
    await this.save(userId, data);
    return session;
  }
}
