# Deployment

## 1. Supabase (already provisioned)
Project ref: `ayoobhmqdsxoabdbfzru` · URL: `https://ayoobhmqdsxoabdbfzru.supabase.co`

To apply changes from this repo to the hosted project:
```bash
supabase link --project-ref ayoobhmqdsxoabdbfzru
supabase db push                                   # applies new files in supabase/migrations
supabase functions deploy admin-users              # user management function
```
Do **not** run `supabase/seed.sql` against production; it contains demo data with a public demo password.

Recommended Auth settings (Dashboard → Authentication):
- Disable public sign-ups (accounts are created by admins).
- Set the Site URL to the vendor portal URL and add the admin portal URL to redirect URLs (used by password reset links).
- Configure a custom SMTP provider so password-reset emails are delivered reliably.

## 2. Vercel (three projects from the same repo)
| Project | Root directory | Framework | Build command | Output |
| --- | --- | --- | --- | --- |
| Storefront | `apps/storefront` | Next.js | default | default |
| Admin | `apps/admin` | Vite | `pnpm build` | `dist` |
| Vendor | `apps/vendor` | Vite | `pnpm build` | `dist` |

Enable "Include files outside the root directory" (default for monorepos). `vercel.json` in each Vite app rewrites all routes to `index.html`.

### Environment variables
Storefront:
```
NEXT_PUBLIC_SUPABASE_URL=https://ayoobhmqdsxoabdbfzru.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
NEXT_PUBLIC_SITE_URL=https://www.your-domain.in
NEXT_PUBLIC_VENDOR_PORTAL_URL=https://dealer.your-domain.in
```
Admin and vendor:
```
VITE_SUPABASE_URL=https://ayoobhmqdsxoabdbfzru.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable key>
VITE_STOREFRONT_URL=https://www.your-domain.in
```
The publishable key is already filled in each `.env.example`.

Suggested domains: `www.` storefront, `dealer.` vendor portal, `admin.` admin portal.

## 3. Content updates
Website content (banners, services, projects, testimonials, FAQs, contact details, announcement bar) is edited in **Admin → Content / Settings**. The storefront refreshes cached pages every 5 minutes.

## 4. Backups and monitoring
- Supabase Pro includes daily backups; enable Point-in-Time Recovery for stronger guarantees.
- Check **Advisors** (security and performance) in the Supabase dashboard after schema changes.
- Admin → Audit log shows who changed what.
