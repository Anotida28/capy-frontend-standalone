# Capy Frontend Standalone

This folder is a standalone copy of the frontend app.

## Run locally

```bash
npm install
npm run dev
```

The app includes `.env.local` with:

```env
NEXT_PUBLIC_USE_MOCK_API=true
```

That means it runs against local mock data by default and does not require the backend server.

## Optional: connect to backend

Set either:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

or leave it empty and use the `next.config.js` rewrite to `/api/v1`.
