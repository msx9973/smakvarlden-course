# Smakvärlden

## Overview

A professional chef platform for recipe cost calculation, ingredient price tracking, and community recipe sharing. Built as a full-stack application with a React + Vite frontend and an Express API backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/smakvarlden), Wouter routing, TailwindCSS, Shadcn/ui, Recharts
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Fonts**: Playfair Display (headings) + DM Sans (body) from Google Fonts

## Application Features

- **Dashboard**: Summary stats, recent activity feed, top-performing recipes by margin
- **Recipes**: Full CRUD cookbook with cost/margin display per recipe, category filters
- **Recipe Detail**: Per-ingredient cost breakdown, profitability kalkyl
- **Ingredients**: Live ingredient price table with price trend line chart (7 weeks), category breakdown
- **Calculator**: Profit margin comparison bar chart + ingredient category average price chart
- **Community**: Chef posts feed with like button, share recipe dialog

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Brand

- **Colors**: Espresso sidebar (#3A2E26), warm taupe primary (#A89888), parchment background (#F8F8F7)
- **Typography**: Playfair Display for headings, DM Sans for body
- **Theme**: Light and dark mode supported

## Architecture

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — auto-generated Zod validation schemas (do not edit)
- `lib/db/src/schema/index.ts` — Drizzle ORM schema
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/smakvarlden/src/pages/` — React page components
- `artifacts/smakvarlden/src/components/` — Shared UI components

## Codegen Note

After each OpenAPI spec change, run codegen before using updated types. The `lib/api-spec/package.json` codegen script patches the generated `api-zod/src/index.ts` to avoid naming conflicts between Zod schemas and TypeScript types.
