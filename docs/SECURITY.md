# Security and access control

## Roles
| Role | How it is assigned | Can do |
| --- | --- | --- |
| Anonymous (website visitor) | – | Read published catalogue and website content, log enquiries, submit leads. Never sees trade prices, orders, vendors or leads. |
| Vendor | Admin creates the dealer and a login in the admin portal | Read the catalogue with trade prices; read and manage **only their own** orders, targets, incentives and notifications; edit only their own contact fields. |
| Admin | Super admin creates it | Manage catalogue, orders, vendors, leads, targets, schemes, content and settings. |
| Super admin | Seeded / promoted by another super admin | Everything an admin can do, plus manage admin accounts. |

Roles are stored in `auth.users.raw_app_meta_data.role` (not user-editable) and mirrored to `profiles`. New sign-ups without a role become **inactive** and cannot see anything.

## Enforcement
- **Row Level Security is enabled on every table.** Policies use helper functions `is_admin()`, `is_super_admin()` and `current_vendor_id()`.
- Sensitive writes go through `security definer` functions that validate input (`place_order`, `update_order_status`, `submit_lead`, `log_enquiry`, …). Direct inserts into orders are not allowed.
- Triggers stop users from changing their own role or status, stop vendors editing commercial fields (tier, credit, status) and freeze order totals.
- User management (creating vendor logins, resetting passwords, suspending accounts) happens only in the `admin-users` Edge Function, which checks the caller is an active admin before using the service role. Suspending a vendor also bans the auth user.
- Changes to important tables are written to `audit_logs`, readable only by admins.
- Storage buckets `product-media` and `site-media` are publicly readable; only admins can upload (5 MB, images only).
- `supabase/tests/rls_checks.sql` tests anonymous, vendor, cross-vendor, inactive-vendor and admin access. Run it with `pnpm db:test` after any policy change.

## Keys
- The **publishable/anon key** in the `.env` files is safe in browsers; RLS protects the data.
- The **service role key** must never be put in any app. Only the Edge Function uses it, through Supabase's built-in secret.
