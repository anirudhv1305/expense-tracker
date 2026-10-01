# Expense Tracker V2

Expense Tracker V2 is a React progressive web app backed at runtime by Supabase Auth and PostgreSQL with Row Level Security. Vercel can host the frontend; the Spring Boot application remains in `backend/` as a legacy/reference implementation and is not needed by the Supabase frontend.

```text
Android / Desktop browser → React PWA on Vercel → Supabase Auth + PostgreSQL + RLS
```

## Features

- Supabase email/password registration and login, persistent sessions, and sign out
- First-time balance setup and monthly rollover from the previous closing balance
- Dashboard balances, income/expense totals, savings, transaction count, charts, and recent transactions
- Credit and debit creation, editing, deletion, validation, and recalculated running balances
- Per-user categories and subcategories, archive behavior, and historical labels
- Monthly history, daily trends, category/source breakdowns, insights, comparisons, notes, CSV, and Excel
- Responsive mobile navigation, transaction cards, dark mode, and installable PWA shell

## Frontend local development

Requirements: Node.js 20+ and npm.

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Set these Vite values in `frontend/.env.local` or the Vercel project settings:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

The public anon/publishable key is expected in the browser. Database RLS is the security boundary. Never put a Supabase service-role key in frontend environment variables.

## Supabase setup

1. Create a Supabase project. Keep the old PostgreSQL database unchanged as a backup/reference; this project intentionally starts with new accounts and no old expense transactions.
2. For local Supabase, install Docker and the Supabase CLI, then run `supabase start` and `supabase db reset` from the repository root. `supabase status` prints the local URL and public key for `frontend/.env.local`.
3. For a hosted project, install the Supabase CLI and authenticate with `supabase login`.
4. From the repository root, link the project with `supabase link --project-ref YOUR_PROJECT_REF`.
5. Apply the reproducible schema migration with `supabase db push`. The SQL is in `supabase/migrations/` and the local CLI configuration is `supabase/config.toml`.
6. The migration creates the schema, RLS policies, transactional RPCs, and an Auth signup trigger. New users receive the existing default categories (Food & Snacks, College Food Expenses, Travel, Outings, Shopping, Recharge, Miscellaneous, Others), Outings subcategories Friend and Girlfriend, and credit sources Parents, Salary, Scholarship, Friend, Refund, Other. Monthly tracking remains unset until the user supplies a starting balance.
7. In Supabase Auth, configure the production Site URL and allowed redirect URLs for the Vercel domain. Configure the email confirmation policy appropriate to the deployment. With confirmation enabled, a new user confirms email then logs in before setup.
8. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel. Do not add database passwords or a service-role key to Vercel frontend variables.
9. Deploy the `frontend` directory to Vercel with `npm run build` and output directory `dist`.
10. Test registration, email confirmation if enabled, login/logout, balance setup, categories, transactions, and cross-user isolation in the deployed project.

The migration is fresh-start only: it creates tables but does not copy data from Flyway/PostgreSQL. It does not modify or delete the existing database. Do not run the Flyway migrations against the Supabase project.

## Database model and security

`supabase/migrations/20261001000100_initial_schema_and_rls.sql` creates:

- `profiles` → `auth.users`
- `settings` → `auth.users` and the current `monthly_records` row
- `monthly_records` → `auth.users`, unique per user/year/month
- `transactions` → a same-owner monthly record and same-owner category/subcategory/credit source
- `categories` → `auth.users`; `subcategories` → same-owner parent category
- `credit_sources` → `auth.users`
- `monthly_notes` → a same-owner monthly record

RLS is enabled on every application table. Owner policies compare `user_id` (or profile `id`) to `auth.uid()`. Transaction and month rows are client-readable only; security-definer RPCs perform setup, rollover, balance editing, transaction writes/deletes, and note writes while deriving the caller from `auth.uid()`. Composite foreign keys prevent cross-user and cross-category subcategory links. Transaction label snapshots preserve report labels, and rename triggers keep snapshots aligned with renamed categories, subcategories, and sources. Archive operations mark referenced records inactive instead of cascading through transaction history.

## PWA and offline behavior

The frontend includes a web manifest, app icon, standalone display mode, mobile viewport, and a production service worker. The worker caches only the app shell and same-origin built assets. It deliberately does not cache Supabase responses or private financial data. Database operations need network access; failed requests surface errors and transactions are not queued or silently discarded.

## Checks

```bash
cd frontend
npm run lint
npm run build
npm audit
```

There is no frontend test script currently. The Supabase migrations and RLS require verification against a Supabase project/local Supabase stack; a configured project is required to test Auth and two-user policies. Do not treat a successful frontend build as proof of RLS or production readiness.

## Legacy backend

`backend/` retains the Spring Boot 3 / Java 21 implementation and its historical Flyway migrations as a reversible reference. It is not called by the Supabase frontend and should not be deployed as part of the Supabase/Vercel runtime. The old database remains separate and untouched.
