# UpiSense Frontend

React + Vite + Tailwind dashboard for UpiSense.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Runs on http://localhost:5173. Proxies `/api` and `/auth` to the backend (default: localhost:3000).

## Environment

Create `.env` (optional for dev):

- `VITE_API_URL` - Backend API URL. Leave empty to use Vite proxy.
- `VITE_SUPABASE_URL` - For real-time updates (optional).
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key (optional).

## Production Build

```bash
npm run build
```

Set `VITE_API_URL` to your deployed backend URL before building.
