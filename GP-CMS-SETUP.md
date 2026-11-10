# Galaxy Point website ↔ editor sync preparation

This branch is **integration preparation, NOT live synchronization** until an authenticated Supabase project is connected and the original panel HTML is attached.

1. Create/connect a Supabase project. Run `gp-cms-setup.sql` in its SQL editor.
2. Add **only** the public Supabase project URL and publishable/anon key to `gp-cms-config.js` (never secret/service_role).
3. Create boss and manager users via Supabase Auth; insert those two user IDs in `gp_admin_users` using SQL Editor. Disable public signups.
4. Integrate the already-created Galaxy Point Website Management Panel HTML using `gp-cms-admin-api.js`. Keep the panel's exact original design, remove Demo markings only once its Save/Publish actions truly write to Supabase.
5. Publish storefront updates after login, upload assets to the `gp-site-media` bucket, use the returned HTTPS URL in website content.
6. Verify: new product, price change, stock, category photo, hero video; site should reflect published changes after reload/within 60s.
7. Leave payment checkout as a separate project — existing storefront demo checkout is not a live payment gateway.

The public website has a fail-safe: when no Supabase credentials or API are available, the existing storefront appearance/data remain unchanged.

Important: Do not put a GitHub token or Supabase service-role key in public HTML. Do not expose the editor page without working Auth + RLS.
