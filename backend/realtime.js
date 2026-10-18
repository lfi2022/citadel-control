'use strict';
const WebSocket = require('ws');

function registerRealtime(app, { config, ha, allowed, realtime }) {
  const clients = new Set(); const states = new Map();
  let upstream; let reconnectTimer; let retryDelay = 1000; let stopped = false; let requestId = 1;
  const snapshot = () => [...states.values()].sort((a, b) => a.entity_id.localeCompare(b.entity_id));
  const broadcast = message => { const payload = JSON.stringify(message); clients.forEach(client => { if (client.readyState === WebSocket.OPEN) client.send(payload); }); };
  const upsert = state => { if (state?.entity_id && allowed.has(state.entity_id)) states.set(state.entity_id, ha.compactState(state)); };
  async function synchronize() {
    try { const allStates = await ha.states(); states.clear(); allStates.forEach(upsert); broadcast({ type: 'snapshot', entities: snapshot() }); app.log.info({ count: states.size }, 'Home Assistant state cache synchronized'); }
    catch (error) { app.log.warn({ err: error }, 'Home Assistant cache synchronization failed'); }
  }
  function scheduleReconnect() { clearTimeout(reconnectTimer); const delay = retryDelay; retryDelay = Math.min(retryDelay * 2, 30000); reconnectTimer = setTimeout(connect, delay); app.log.info({ retryInMs: delay }, 'Home Assistant WebSocket reconnect scheduled'); }
  function connect() {
    if (stopped) return;
    const url = new URL(config.haUrl); url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'; url.pathname = '/api/websocket'; url.search = '';
    upstream = new WebSocket(url.toString(), { handshakeTimeout: 8000 });
    upstream.on('message', raw => {
      let message; try { message = JSON.parse(raw.toString()); } catch { return; }
      if (message.type === 'auth_required') upstream.send(JSON.stringify({ type: 'auth', access_token: config.haToken }));
      if (message.type === 'auth_ok') { retryDelay = 1000; upstream.send(JSON.stringify({ id: requestId++, type: 'subscribe_events', event_type: 'state_changed' })); broadcast({ type: 'connection', connected: true }); synchronize(); app.log.info('Home Assistant WebSocket connected'); }
      if (message.type === 'auth_invalid') { app.log.error({ message: message.message }, 'Home Assistant WebSocket authentication rejected'); upstream.close(); }
      if (message.type === 'event' && message.event?.event_type === 'state_changed') { const state = message.event.data?.new_state; if (state && allowed.has(state.entity_id)) { upsert(state); broadcast({ type: 'state_changed', entity: states.get(state.entity_id) }); } }
    });
    upstream.on('error', error => { if (!stopped) app.log.warn({ err: error }, 'Home Assistant WebSocket error'); });
    upstream.on('close', () => { broadcast({ type: 'connection', connected: false }); if (!stopped) scheduleReconnect(); });
  }
  realtime.getStates = snapshot;
  app.get('/api/live', { websocket: true }, socket => { clients.add(socket); socket.send(JSON.stringify({ type: 'connection', connected: upstream?.readyState === WebSocket.OPEN })); socket.send(JSON.stringify({ type: 'snapshot', entities: snapshot() })); socket.on('close', () => clients.delete(socket)); });
  app.addHook('onClose', async () => { stopped = true; clearTimeout(reconnectTimer); if (upstream?.readyState === WebSocket.OPEN) upstream.close(); else upstream?.terminate(); clients.forEach(client => client.close()); });
  connect();
}
module.exports = registerRealtime;
