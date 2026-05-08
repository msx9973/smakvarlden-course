# Supabase, Google Auth, Spoonacular, and Netlify

## 1. Supabase database

1. Create or open your Supabase project.
2. Open SQL Editor.
3. Run `supabase/migrations/20260508000000_smakvarlden_core.sql`.
4. Copy the pooled Postgres connection string from Project Settings > Database.
5. Put it in `DATABASE_URL`.

The existing Express API uses `DATABASE_URL`, so Supabase works as the hosted Postgres database without changing the app code again.

## 2. Google Auth through Supabase

1. In Supabase, open Authentication > Providers > Google.
2. Add your Google OAuth client id and secret.
3. Add these redirect URLs in Supabase Authentication > URL Configuration:
   - `http://localhost:5173`
   - your Netlify site URL, for example `https://your-site.netlify.app`
4. Add these frontend variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

When these are present, the login page shows a Google login button. Email/password login still remains as a fallback for the existing API auth.

## 3. Spoonacular

Set this only on the API server:

```text
SPOONACULAR_API_KEY=your_key
```

Available local API routes:

- `GET /api/spoonacular/recipes/search?query=pasta&diet=vegan&intolerances=gluten`
- `GET /api/spoonacular/recipes/:id/information`
- `GET /api/spoonacular/ingredients/search?query=tomato`
- `GET /api/spoonacular/ingredients/:id/information`

The key is never exposed to the frontend.

## 4. Netlify

The frontend is ready for Netlify with `netlify.toml`.

Set these Netlify environment variables:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_API_URL=https://YOUR_API_HOST/api
```

The Express API still needs a Node host such as Render, Railway, Fly.io, Supabase Edge Functions, or Netlify Functions. Once the API is hosted, put that API URL into `VITE_API_URL`.

## 5. Stripe

Create products and prices in Stripe Dashboard, then set these only on the API host:

```text
STRIPE_SECRET_KEY=sk_test_or_live_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...
APP_URL=https://your-site.netlify.app
```

The current app uses:

- `POST /api/billing/checkout` to create a Stripe Checkout subscription session.
- `GET /api/billing/config` to check whether Stripe is configured.
- `POST /api/billing/portal` as a prepared billing portal endpoint when customer ids are stored.

For local testing, set `APP_URL=http://localhost:5173`. The Pro Chef button on `/plans` redirects to Stripe Checkout when `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID` are present.
