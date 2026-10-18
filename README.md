# CreditFlow

Supplier-credit repayment app: a shop takes stock on credit, and a pre-agreed share of every UPI sale repays the lender automatically. Vite + React + TypeScript, mock data only.

## Layout

- `frontend/` — the Vite app, with the Merchant, Lender and Operations portals

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. Sign in with any valid 10-digit number; the demo code is shown on screen.

## Deploy

On Vercel, import this repository and set the Root Directory to `frontend`. `frontend/vercel.json` already defines the build command, the `dist` output and the SPA rewrite.
