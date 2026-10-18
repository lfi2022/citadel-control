'use strict';

function compactState(state) {
  return {
    entity_id: state.entity_id,
    state: state.state,
    attributes: state.attributes || {},
    friendly_name: state.attributes?.friendly_name || state.entity_id,
    last_changed: state.last_changed,
    last_updated: state.last_updated
  };
}

function createHaClient(config) {
  async function request(path, options = {}) {
    let response;
    try {
      response = await fetch(`${config.haUrl}${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${config.haToken}`, Accept: 'application/json', ...options.headers },
        signal: AbortSignal.timeout(8000)
      });
    } catch (error) {
      throw new Error(`Home Assistant injoignable : ${error.message}`);
    }
    if (!response.ok) throw new Error(`Home Assistant a répondu HTTP ${response.status}`);
    if (response.status === 204) return null;
    return response.json();
  }

  return {
    ping: () => request('/api/'),
    states: () => request('/api/states'),
    service: (domain, service, body) => request(`/api/services/${encodeURIComponent(domain)}/${encodeURIComponent(service)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    }),
    compactState
  };
}

module.exports = { createHaClient, compactState };
