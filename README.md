# Smakvarlden

Smakvarlden is a chef platform for recipe costing, ingredient price tracking, AI help, planning, and kitchen workflow tools.

## Where Things Are

- Frontend app: `artifacts/smakvarlden`
- API server: `artifacts/api-server`
- Shared API client: `lib/api-client-react`
- Shared validation schemas: `lib/api-zod`
- Shared database code: `lib/db`

## Quick Start

Open PowerShell in this folder:

```powershell
cd "C:\Users\msx99\OneDrive\Documents\New project\smakvarlden-course"
```

Install packages:

```powershell
corepack pnpm install
```

Run the full app:

```powershell
corepack pnpm run dev
```

Then open:

```text
http://localhost:5173
```

The frontend runs on port `5173`. The API runs on port `5000`.

## Useful Commands

```powershell
corepack pnpm run dev
```

Starts the frontend and API together.

```powershell
corepack pnpm run dev:web
```

Starts only the frontend.

```powershell
corepack pnpm run dev:api
```

Starts only the API.

```powershell
corepack pnpm run typecheck
```

Checks TypeScript errors.

```powershell
corepack pnpm run build
```

Builds the whole project.

## Notes

- Use `pnpm`, not `npm` or `yarn`.
- The API uses port `5000` by default.
- The frontend proxies `/api` requests to `http://127.0.0.1:5000`.
- This folder now includes the newer local files from your Downloads copy, because the GitHub download alone was missing packages needed by the frontend.
