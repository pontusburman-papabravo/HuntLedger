/**
 * Seed data inserted the first time a user logs in and has no data yet.
 *
 * Goals:
 *   - Two weapons, two ammunition entries, five sessions.
 *   - Sessions span the last ~6 weeks so the dashboard charts immediately
 *     show meaningful trends.
 *   - Mix of hunt / shooting / maintenance.
 */

import {
  ammunitionSchema,
  locationSchema,
  sessionSchema,
  userDataSchema,
  weaponSchema,
  type Ammunition,
  type Location,
  type Session,
  type UserData,
  type Weapon,
} from '@huntledger/shared';

const DAY_MS = 1000 * 60 * 60 * 24;

function daysAgo(n: number, hour = 8): string {
  const d = new Date(Date.now() - n * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function endOf(start: string, hours: number): string {
  return new Date(new Date(start).getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function buildSeedData(userId: string): UserData {
  const now = new Date().toISOString();

  const weapons: Weapon[] = [
    weaponSchema.parse({
      id: crypto.randomUUID(),
      name: 'Sako 85 Hunter',
      type: 'rifle',
      caliber: '.308 Winchester',
      serialNumber: 'SK85-001234',
      createdAt: now,
    }),
    weaponSchema.parse({
      id: crypto.randomUUID(),
      name: 'Beretta 686 Silver Pigeon',
      type: 'shotgun',
      caliber: '12/70',
      serialNumber: 'BR686-998877',
      createdAt: now,
    }),
  ];

  const ammunition: Ammunition[] = [
    ammunitionSchema.parse({
      id: crypto.randomUUID(),
      brand: 'Norma',
      caliber: '.308 Winchester',
      bulletType: 'Oryx 165 gr',
    }),
    ammunitionSchema.parse({
      id: crypto.randomUUID(),
      brand: 'Gyttorp',
      caliber: '12/70',
      bulletType: 'Trap 24g #7.5',
    }),
  ];

  const locations: Location[] = [
    locationSchema.parse({
      id: crypto.randomUUID(),
      name: 'Hemma',
      latitude: 59.3293,
      longitude: 18.0686,
      type: 'home',
    }),
    locationSchema.parse({
      id: crypto.randomUUID(),
      name: 'Skyttebanan',
      latitude: 59.4023,
      longitude: 17.9543,
      type: 'shooting_range',
    }),
    locationSchema.parse({
      id: crypto.randomUUID(),
      name: 'Marken',
      latitude: 60.1282,
      longitude: 18.6435,
      type: 'hunting_ground',
    }),
  ];

  const home = locations[0]!;
  const range = locations[1]!;
  const ground = locations[2]!;
  const rifle = weapons[0]!;
  const shotgun = weapons[1]!;
  const rifleAmmo = ammunition[0]!;
  const shotgunAmmo = ammunition[1]!;

  const sessions: Session[] = [
    sessionSchema.parse({
      id: crypto.randomUUID(),
      type: 'shooting',
      timestampStart: daysAgo(40),
      timestampEnd: endOf(daysAgo(40), 2),
      locationId: range.id,
      userId,
      weaponIds: [rifle.id],
      ammunitionIds: [rifleAmmo.id],
      dogIds: [],
      shotsFired: 30,
      hits: 26,
      notes: 'Inskjutning på 100m.',
      weather: { temperature: 8, humidity: 70, wind: 2 },
    }),
    sessionSchema.parse({
      id: crypto.randomUUID(),
      type: 'shooting',
      timestampStart: daysAgo(28),
      timestampEnd: endOf(daysAgo(28), 1),
      locationId: range.id,
      userId,
      weaponIds: [shotgun.id],
      ammunitionIds: [shotgunAmmo.id],
      dogIds: [],
      shotsFired: 50,
      hits: 41,
      notes: 'Trap-träning.',
      weather: { temperature: 12, humidity: 55, wind: 3 },
    }),
    sessionSchema.parse({
      id: crypto.randomUUID(),
      type: 'hunt',
      timestampStart: daysAgo(20),
      timestampEnd: endOf(daysAgo(20), 6),
      locationId: ground.id,
      userId,
      weaponIds: [rifle.id],
      ammunitionIds: [rifleAmmo.id],
      dogIds: [],
      shotsFired: 2,
      hits: 1,
      notes: 'Älgpass på morgonen.',
      weather: { temperature: 4, humidity: 88, wind: 1, precipitation: 0.2 },
    }),
    sessionSchema.parse({
      id: crypto.randomUUID(),
      type: 'maintenance',
      timestampStart: daysAgo(15),
      locationId: home.id,
      userId,
      weaponIds: [rifle.id],
      ammunitionIds: [],
      dogIds: [],
      maintenance: {
        type: 'cleaning',
        description: 'Rengjort pipan, oljat slutstycket.',
      },
    }),
    sessionSchema.parse({
      id: crypto.randomUUID(),
      type: 'shooting',
      timestampStart: daysAgo(5),
      timestampEnd: endOf(daysAgo(5), 1),
      locationId: range.id,
      userId,
      weaponIds: [rifle.id],
      ammunitionIds: [rifleAmmo.id],
      dogIds: [],
      shotsFired: 20,
      hits: 18,
      notes: 'Kontrollskott inför säsongsstart.',
      weather: { temperature: 6, humidity: 72, wind: 2 },
    }),
  ];

  return userDataSchema.parse({ sessions, weapons, ammunition, dogs: [], locations });
}
