# Novalite Platform

Digital commerce and vendor management platform for **Nova Lite Solution** (Kishanganj, Bihar).

| App | Path | Stack | Who uses it |
| --- | --- | --- | --- |
| Storefront + company website | `apps/storefront` | Next.js 15 (App Router, ISR) | Customers, prospective dealers |
| Vendor (dealer) portal | `apps/vendor` | React 19 + Vite, installable PWA | Dealers and distributors |
| Admin control center | `apps/admin` | React 19 + Vite, installable PWA | Novalite team |
| Backend | `supabase/` | Postgres, Auth, RLS, Storage, Realtime, Edge Functions | Everything |

Shared code lives in `packages/shared` (types, formatting, order rules, WhatsApp helpers), `packages/ui` (design system) and `packages/assets` (logo, app icons, product art).
The previous static site is kept in `legacy/` for reference.

## What it does

- **Storefront**: product catalogue with typo-tolerant search, categories and filters; product pages with a one-tap **Buy on WhatsApp** button and a multi-product **enquiry list**. Every WhatsApp enquiry is logged with a reference number for analytics. It doubles as the company site: about, services, projects/case studies, testimonials, dealer application, FAQ, contact form, policies, SEO (sitemap, JSON-LD, Open Graph).
- **Vendor portal**: dealer login, catalogue with dealer prices, cart with MOQ / pack-size rules, order placement and live status tracking, targets with progress, incentives with a plain-language explanation of every payout, notifications.
- **Admin**: dashboard, order approval workflow, products (images, specs, trade prices), categories, vendors and their logins, leads and dealer applications, targets, incentive schemes and payouts, sales reports, analytics (sales, enquiries, funnel, vendor performance), website content (banners, services, projects, testimonials, FAQs, settings), notifications and an audit log.

## Local development

Requirements: Node 20+, pnpm 10, Docker (for the local Supabase stack), Supabase CLI.

```bash
pnpm install
supabase start                 # local Postgres/Auth/Storage on 127.0.0.1:54321
supabase db reset              # applies migrations + seed data
pnpm db:test                   # row-level-security test suite
cp apps/storefront/.env.example apps/storefront/.env.local   # then point URLs/keys at local or hosted
cp apps/admin/.env.example apps/admin/.env.local
cp apps/vendor/.env.example apps/vendor/.env.local
pnpm dev                       # storefront :3000, vendor :5174, admin :5173
```

`supabase status` prints the local anon key for the `.env.local` files.

Local seed logins (password `Novalite@2026`, **local only**):

| Role | Email |
| --- | --- |
| Super admin | admin@novalite.test |
| Admin | ops@novalite.test |
| Vendor | vendor@novalite.test (also purnia@, siliguri@, katihar@, araria@) |

After changing SQL, regenerate types with `pnpm db:types`.

## Docs

- [Business rules](docs/BUSINESS_RULES.md): orders, pricing, targets, incentives, enquiries.
- [Security and access control](docs/SECURITY.md): roles, RLS, what each role can see.
- [Deployment](docs/DEPLOYMENT.md): Supabase, Vercel, environment variables, backups.
