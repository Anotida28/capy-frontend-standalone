# Capy Frontend Standalone

This folder is a standalone copy of the frontend app.

## Local setup

```bash
npm install
npm run dev
```

Create a local `.env.local` (do not commit it) from `.env.example`.

```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

If you want frontend-only mock mode:

```env
NEXT_PUBLIC_USE_MOCK_API=true
```

## Railway

Set frontend variables in Railway:

```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=https://<your-backend-service>.up.railway.app
```
