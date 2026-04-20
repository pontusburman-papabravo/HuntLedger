/**
 * In-memory store for F1.
 *
 * Mirrors the shape that the localStorage data adapter writes on the frontend
 * so swapping in `ApiDataAdapter` in F2 is a one-to-one replacement.
 *
 * Replaced with Postgres + drizzle/node-pg-migrate in F2.
 */
import { randomUUID } from 'node:crypto';
const users = new Map();
const dataByUser = new Map();
export const memoryStore = {
    // ----- users -----
    createUser(input) {
        if ([...users.values()].some((u) => u.user.email === input.email)) {
            throw new Error('email already in use');
        }
        const user = {
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
    findUserByEmail(email) {
        return [...users.values()].find((u) => u.user.email === email);
    },
    getUser(id) {
        return users.get(id)?.user;
    },
    // ----- aggregate data -----
    getData(userId) {
        return (dataByUser.get(userId) ?? {
            sessions: [],
            weapons: [],
            ammunition: [],
            dogs: [],
            locations: [],
        });
    },
    replaceData(userId, data) {
        dataByUser.set(userId, data);
        return data;
    },
    // ----- weapons -----
    addWeapon(userId, weapon) {
        const data = this.getData(userId);
        data.weapons.push(weapon);
        dataByUser.set(userId, data);
        return weapon;
    },
    // ----- ammunition -----
    addAmmunition(userId, ammo) {
        const data = this.getData(userId);
        data.ammunition.push(ammo);
        dataByUser.set(userId, data);
        return ammo;
    },
    // ----- dogs -----
    addDog(userId, dog) {
        const data = this.getData(userId);
        data.dogs.push(dog);
        dataByUser.set(userId, data);
        return dog;
    },
    // ----- locations -----
    addLocation(userId, location) {
        const data = this.getData(userId);
        data.locations.push(location);
        dataByUser.set(userId, data);
        return location;
    },
    // ----- sessions -----
    addSession(userId, session) {
        const data = this.getData(userId);
        data.sessions.push(session);
        dataByUser.set(userId, data);
        return session;
    },
};
