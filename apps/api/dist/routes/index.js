/**
 * Route registration. Kept thin in F1; populated in F2 with auth middleware
 * and Postgres-backed handlers.
 */
import { randomUUID } from 'node:crypto';
import { createAmmunitionSchema, createSessionSchema, createWeaponSchema, } from '@huntledger/shared';
import { memoryStore } from '../store.js';
export async function registerRoutes(app) {
    app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));
    // F1: a tiny demo of the API surface using the same shared schemas the web
    // app uses. Swap the in-memory store for Postgres in F2; the contract stays.
    app.get('/api/v1/data/:userId', async (req) => {
        const { userId } = req.params;
        return memoryStore.getData(userId);
    });
    app.post('/api/v1/data/:userId/weapons', async (req, reply) => {
        const { userId } = req.params;
        const parsed = createWeaponSchema.safeParse(req.body);
        if (!parsed.success)
            return reply.status(400).send({ error: parsed.error.flatten() });
        const weapon = {
            ...parsed.data,
            id: randomUUID(),
            createdAt: new Date().toISOString(),
        };
        return memoryStore.addWeapon(userId, weapon);
    });
    app.post('/api/v1/data/:userId/ammunition', async (req, reply) => {
        const { userId } = req.params;
        const parsed = createAmmunitionSchema.safeParse(req.body);
        if (!parsed.success)
            return reply.status(400).send({ error: parsed.error.flatten() });
        const ammo = { ...parsed.data, id: randomUUID() };
        return memoryStore.addAmmunition(userId, ammo);
    });
    app.post('/api/v1/data/:userId/sessions', async (req, reply) => {
        const { userId } = req.params;
        const parsed = createSessionSchema.safeParse(req.body);
        if (!parsed.success)
            return reply.status(400).send({ error: parsed.error.flatten() });
        const session = { ...parsed.data, id: randomUUID() };
        return memoryStore.addSession(userId, session);
    });
}
