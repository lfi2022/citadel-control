'use strict';

require('dotenv').config();
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const fastifyStatic = require('@fastify/static');
const websocket = require('@fastify/websocket');
const { loadConfig, assertConfig } = require('./config');
const { createHaClient } = require('./ha-client');
const registerRealtime = require('./realtime');

function authorized(request, config) {
  return !config.clientToken || request.headers.authorization === `Bearer ${config.clientToken}`;
}

function createServer(config = loadConfig()) {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' }, trustProxy: true });
  const frontendDist = join(__dirname, '..', 'frontend', 'dist');
  const ha = createHaClient(config);
  const allowed = new Set(config.entities);
  const realtime = { getStates: () => [] };
  const secure = async (request, reply) => {
    if (!authorized(request, config)) return reply.code(401).send({ error: 'Authentification client requise' });
  };
  app.register(cors, { origin: config.allowedOrigins.length ? config.allowedOrigins : false });
  app.register(websocket);
  app.register(registerRealtime, { config, ha, allowed, realtime });
  app.get('/api/health', async () => ({ status: 'ok', application: 'CITADEL CONTROL', timestamp: new Date().toISOString() }));
  app.get('/api/ha/status', async (request, reply) => {
    try { const data = await ha.ping(); return { connected: true, message: data.message || 'Home Assistant accessible' }; }
    catch (error) { request.log.warn({ err: error }, 'Home Assistant REST unavailable'); return reply.code(502).send({ connected: false, error: 'Connexion Home Assistant indisponible' }); }
  });
  app.get('/api/entities', async () => ({ count: realtime.getStates().length, entities: realtime.getStates() }));
  app.get('/api/inventory', { preHandler: secure }, async (request, reply) => {
    try { const states = await ha.states(); return { count: states.length, entities: states.map(ha.compactState) }; }
    catch (error) { request.log.warn({ err: error }, 'Home Assistant inventory unavailable'); return reply.code(502).send({ error: 'Inventaire Home Assistant indisponible' }); }
  });
  app.post('/api/services/:domain/:service', { preHandler: secure }, async (request, reply) => {
    const { domain, service } = request.params;
    const entityId = request.body?.entity_id;
    const permitted = domain === 'light' && ['turn_on', 'turn_off', 'toggle'].includes(service) && allowed.has(entityId);
    if (!permitted) return reply.code(403).send({ error: 'Service ou entité non autorisé' });
    try { await ha.service(domain, service, { entity_id: entityId }); return reply.code(202).send({ accepted: true }); }
    catch (error) { request.log.warn({ err: error, entityId }, 'Home Assistant service failed'); return reply.code(502).send({ error: 'Commande Home Assistant refusée ou indisponible' }); }
  });
  if (existsSync(frontendDist)) {
    app.register(fastifyStatic, { root: join(frontendDist, 'assets'), prefix: '/assets/', decorateReply: false });
    app.get('/', async (request, reply) => reply.type('text/html').send(require('node:fs').readFileSync(join(frontendDist, 'index.html'))));
    // All non-API browser routes belong to React's client-side router.
    app.get('/*', async (request, reply) => reply.type('text/html').send(require('node:fs').readFileSync(join(frontendDist, 'index.html'))));
  } else {
    app.log.warn({ frontendDist }, 'Frontend build absent: only the API is available');
  }
  app.setErrorHandler((error, request, reply) => { request.log.error({ err: error }, 'Unhandled API error'); reply.code(500).send({ error: 'Erreur interne CITADEL CONTROL' }); });
  return app;
}

async function start() { const config = loadConfig(); assertConfig(config); const app = createServer(config); await app.listen({ host: config.host, port: config.port }); }
if (require.main === module) start().catch(error => { console.error(error.message); process.exit(1); });
module.exports = { createServer };
