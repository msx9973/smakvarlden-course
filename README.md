# Smakvärlden Course

Smakvärlden is a full-stack restaurant toolkit for chefs and restaurant owners. It helps track ingredient costs, calculate recipe margins, understand waste, and present market insights in one focused workspace.

The app is built as a TypeScript monorepo with a React/Vite frontend, an Express API, PostgreSQL/Drizzle data models, and Netlify-ready deployment artifacts.

## Features

- Recipe cost and margin calculation
- Ingredient price tracking with category breakdowns
- Clickable recipe and ingredient detail panels
- Swedish starter data for empty accounts
- Food imagery for starter recipes and ingredients
- Waste analysis by ingredient category
- Clickable waste category details with ingredient-level estimates
- Detailed saving tips and industry waste benchmarks
- Market insight dashboards with clickable drill-downs
- Stripe checkout and webhook handling for Pro upgrades
- Netlify function bundle for API deployment

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, Recharts, Wouter
- Backend: Express 5, TypeScript, esbuild
- Database: PostgreSQL with Drizzle ORM
- Validation: Zod
- Package manager: pnpm workspaces
- Deployment: Netlify static site plus Netlify Functions
- Runtime: Node.js 22+

## Repository Structure

```text
artifacts/
  api-server/            Express API source and built server bundle
  smakvarlden/           React frontend source and built static files
lib/
  api-zod/               Shared API validation schemas
  db/                    Drizzle schema and database exports
netlify/
  functions/api.js       Prebuilt Netlify API function bundle
netlify.toml             Netlify deploy configuration
Dockerfile               Production container using prebuilt artifacts
compose.yaml             Local container run config
```

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the frontend build:

```bash
PORT=4173 BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/smakvarlden run build
```

Build the API and Netlify function bundle:

```bash
NODE_ENV=production pnpm --filter @workspace/api-server run build
```

Run type checks:

```bash
pnpm run typecheck
```

Note: some generated or legacy TypeScript warnings may exist in the current workspace. The production deploy path depends on the frontend and API build commands above.

## Environment Variables

Common production variables:

```text
DATABASE_URL=
SESSION_SECRET=
JWT_SECRET=
ANTHROPIC_API_KEY=
SPOONACULAR_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
VITE_STRIPE_PUBLIC_KEY=
```

Netlify should store secrets in the site environment settings. Do not commit real keys.

## Deployment

This repository is configured for Netlify:

```toml
[build]
  publish = "artifacts/smakvarlden/dist/public"
  functions = "netlify/functions"
```

Important: Netlify serves the committed build artifacts. After changing frontend or API source, rebuild and commit:

- `artifacts/smakvarlden/dist/public`
- `netlify/functions/api.js`
- API build output under `artifacts/api-server/dist` when relevant

Once the changes are merged into `main`, Netlify can redeploy automatically.

## Starter Data

Empty accounts can load a Swedish starter dataset from the app. The starter seed creates realistic ingredients, suppliers, prices, recipes, recipe ingredients, and activity entries without requiring the user to manually enter data first.

Starter images are deterministic public food-image URLs used by the frontend helper in:

```text
artifacts/smakvarlden/src/lib/foodImages.ts
```

This avoids a database migration for image storage while still making the app feel complete. A future production upgrade can add uploaded image storage through Cloudinary, Supabase Storage, S3, or Netlify Blobs.

## Data Notes

Some dashboards use modeled or curated reference values for presentation:

- market indexes from SCB when available
- industry benchmarks
- seasonal guidance
- waste assumptions

Recipe and ingredient costs come from the database, while market and benchmark references should be treated as planning signals rather than audited live market data.

## Security Notes

- Stripe checkout uses the authenticated user instead of trusting browser-supplied customer data.
- Stripe webhooks use raw request bodies for signature verification.
- Secrets belong in Netlify environment variables, not source control.
- Do not commit `node_modules` or local lockfile churn unless intentionally changing dependency resolution.

## Production Container

The Docker image uses prebuilt files:

```bash
docker compose up --build
```

The container serves:

- API bundle from `artifacts/api-server/dist`
- static frontend from `artifacts/smakvarlden/dist/public`

## Current Product Direction

Smakvärlden is designed for chefs who need practical operational clarity rather than a marketing-style landing page. The main experience should stay focused on:

- fast scanning
- actionable food cost numbers
- ingredient and recipe drill-downs
- waste reduction
- margin protection
- clear Swedish restaurant context
