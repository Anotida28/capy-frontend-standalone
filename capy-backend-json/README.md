# Capy Backend (JSON DB)

Express + TypeScript backend that serves the frontend contract at `http://localhost:8080/api/v1`.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` (optional; defaults already work).

3. Run in dev mode:

```bash
npm run dev
```

4. Health check:

```bash
GET http://localhost:8080/health
```

## Frontend Switch

In frontend `.env.local`:

```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## Demo Credentials

Default basic-auth users are aligned with frontend login role mapping:

- `admin:admin`
- `finance:finance`
- `sitemanager:sitemanager`
- `stores:stores`

You can override using:

```env
BASIC_AUTH_USERS=user1:pass1,user2:pass2
```
