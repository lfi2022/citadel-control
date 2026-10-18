'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { compactState } = require('../ha-client');
const { loadConfig, assertConfig } = require('../config');

test('compactState preserves Home Assistant state and attributes', () => {
  const state = compactState({ entity_id: 'light.salon', state: 'on', attributes: { friendly_name: 'Salon', brightness: 120 }, last_changed: '2026-01-01T00:00:00Z' });
  assert.equal(state.friendly_name, 'Salon');
  assert.equal(state.attributes.brightness, 120);
});

test('configuration rejects an absent Home Assistant setup', () => {
  const config = loadConfig();
  const oldUrl = process.env.HA_URL; const oldToken = process.env.HA_TOKEN;
  delete process.env.HA_URL; delete process.env.HA_TOKEN;
  assert.throws(() => assertConfig(config), /Configuration manquante/);
  if (oldUrl === undefined) delete process.env.HA_URL; else process.env.HA_URL = oldUrl;
  if (oldToken === undefined) delete process.env.HA_TOKEN; else process.env.HA_TOKEN = oldToken;
});
