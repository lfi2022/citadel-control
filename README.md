# CITADEL CONTROL

The tablet dashboard is intentionally fixed: its page composition and entity mappings live in `frontend/src/dashboard.js`. There is no end-user layout editor, widget management, or administration interface.

## Installation

Copy `backend/.env.example` to `backend/.env`, set `HA_URL` and a Home Assistant long-lived token, then:

```sh
cd backend && npm ci
cd ../frontend && npm ci && npm run build
cd .. && pm2 start ecosystem.config.cjs
pm2 save
```

Fastify serves `frontend/dist` itself, including the SPA fallback; one PM2 process therefore runs both the API and the tablet interface. Rebuild the frontend after an interface change, then run `pm2 restart citadel-control`.

If Nginx is retained for TLS, use `deploy/nginx/citadel-control.conf`: it proxies every request to Fastify rather than serving a second copy of the frontend.

The API deliberately binds to `127.0.0.1`; expose it only through the supplied Nginx configuration. Copy `deploy/citadel-control-backend.service` to `/etc/systemd/system/`, then run `systemctl daemon-reload && systemctl enable --now citadel-control-backend`.

`GET /api/entities` returns the configured display entities. `GET /api/inventory` returns the real Home Assistant inventory and requires the optional client token when configured. `POST /api/services/light/turn_on` (and `turn_off`) is protected the same way. The HA token never leaves the backend.

## Checks

```sh
cd backend && npm test
cd frontend && npm run build && npm run lint
```
