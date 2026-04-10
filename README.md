# qrstorage_app

## Run locally

This project is a single Node app.

- backend: `src/server.js`
- frontend: server-rendered HTML from the same process

### 1. Install deps

```bash
npm install
```

### 2. Seed local data

The app does not appear to include a first-run signup/bootstrap flow.
Create `.data/data.json` with a starter workspace and user:

```json
{
  "workspaces": [{ "id": "workspace-1", "name": "Home Base" }],
  "members": [{ "id": "member-1", "email": "owner@example.com", "workspaceId": "workspace-1", "role": "owner" }],
  "boxes": [],
  "items": [],
  "magicLinks": [],
  "invites": [],
  "sessions": []
}
```

Example:

```bash
mkdir -p .data
```

Then save the JSON above to:

```text
.data/data.json
```

### 3. Start the app

```bash
npm start
```

Open:

```text
http://127.0.0.1:3000
```

### 4. Sign in

1. Open `/sign-in`
2. Enter `owner@example.com`
3. The app records a magic link token in `.data/data.json` under `magicLinks`
4. Open `/auth/magic-link?token=...`

## Scripts

- `npm start` — start server
- `npm test` — run tests
- `npm run check` — same as test

## Env vars

- `PORT` — default `3000`
- `DATA_DIR` — default `.data`
- `APP_BASE_URL` — optional
