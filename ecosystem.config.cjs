module.exports = {
  apps: [{
    name: 'citadel-control',
    cwd: './backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    env: { NODE_ENV: 'production' }
  }]
};
