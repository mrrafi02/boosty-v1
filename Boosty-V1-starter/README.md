# Boosty V1

Boosty is a React + TypeScript + Vite + Tailwind + Supabase manual-order SMM panel.

## 1. Install

```bash
npm install
```

## 2. Supabase

Create a Supabase project, open SQL Editor, and run:

`supabase/schema.sql`

Then create `.env.local` from `.env.example` and add your Supabase URL and anon key.

## 3. Run

```bash
npm run dev
```

## 4. Admin

Register the intended admin email normally. Then find that user's Auth UUID in Supabase and run:

```sql
insert into public.user_roles(user_id, role)
values ('YOUR_AUTH_USER_UUID', 'admin')
on conflict (user_id) do update set role='admin';
```

Do NOT put an admin password in source code.

## Important V1 note

The order creation flow is real and balance-safe through the `place_order` database function. Deposit approval and broader admin CRUD are intentionally protected for the next implementation pass; this scaffold does not fake provider fulfillment or automatic payments.

## Free deployment

The Vite frontend is compatible with Cloudflare Pages, Vercel, or Netlify. Supabase can provide the database/authentication on its free tier subject to its current limits.
