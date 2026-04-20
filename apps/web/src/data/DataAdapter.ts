/**
 * DataAdapter — abstract storage backend for HuntLedger data.
 *
 * F1: LocalStorageDataAdapter writes everything to localStorage.
 * F2: ApiDataAdapter calls the Fastify backend.
 *
 * The shape mirrors `UserData` so the implementations are interchangeable.
 */

import type {
  Ammunition,
  CreateAmmunitionInput,
  CreateDogInput,
  CreateLocationInput,
  CreateSessionInput,
  CreateWeaponInput,
  Dog,
  Location,
  Session,
  UserData,
  Weapon,
} from '@huntledger/shared';

export interface DataAdapter {
  load(userId: string): Promise<UserData>;
  save(userId: string, data: UserData): Promise<void>;

  createWeapon(userId: string, input: CreateWeaponInput): Promise<Weapon>;
  createAmmunition(userId: string, input: CreateAmmunitionInput): Promise<Ammunition>;
  createDog(userId: string, input: CreateDogInput): Promise<Dog>;
  createLocation(userId: string, input: CreateLocationInput): Promise<Location>;
  createSession(userId: string, input: CreateSessionInput): Promise<Session>;
}
