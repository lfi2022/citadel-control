'use strict';

const required = ['HA_URL', 'HA_TOKEN'];

function env(name, fallback) {
  return process.env[name] || fallback;
}

function loadConfig() {
  const config = {
    haUrl: env('HA_URL', '').replace(/\/$/, ''),
    haToken: env('HA_TOKEN', ''),
    host: env('HOST', '127.0.0.1'),
    port: Number(env('PORT', '3001')),
    clientToken: env('CITADEL_CLIENT_TOKEN', ''),
    allowedOrigins: env('CORS_ORIGIN', '').split(',').map(value => value.trim()).filter(Boolean),
    entities: env('CITADEL_ENTITIES', [
      'weather.forecast_maison', 'alarm_control_panel.alarmo', 'light.salon',
      'light.ampoule_bureau', 'light.cuisine_1', 'light.cuisine_2',
      'camera.lsc_camera_solaire_exterieure', 'camera.outdoor_battery_solar_ptz_camera',
      'switch.machine_a_laver', 'switch.sechoir', 'switch.lfinfo_citadel_active'
    ].join(',')).split(',').map(value => value.trim()).filter(Boolean)
  };
  return config;
}

function assertConfig(config) {
  const missing = required.filter(key => !process.env[key] || process.env[key] === 'COLLER_ICI_LE_JETON_HOME_ASSISTANT');
  if (missing.length) throw new Error(`Configuration manquante : ${missing.join(', ')}`);
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) throw new Error('PORT doit être un port valide');
}

module.exports = { loadConfig, assertConfig };
