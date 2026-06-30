# Ultimate Service Solutions — Operations App

A working Customers + Jobs + Invoices system with role-based logins
(Owner / Technician / Customer). This is the real foundation for the
"everything in one place" tool — built to be extended module by module.

## What's included right now
- Login with role-based redirect (owner → dashboard, technician → their job list, customer → their portal)
- Customers: add, view, delete, click-to-call, click-to-WhatsApp
- Jobs: schedule, assign technician, track status (requested → scheduled → in progress → completed)
- Invoices: create, track status (draft → sent → paid → overdue)
- Technician view: see only their assigned jobs, start job, file a service report on completion
- Customer portal: customers log in and see only their own service history + invoices
- Row Level Security in the database so each role only ever sees what it should — this is enforced at the database level, not just hidden in the UI

## What's NOT built yet (next phases, in priority order)
1. Service report photo uploads (before/after) — needs Supabase Storage bucket setup
2. PDF invoice generation/download
3. Real WhatsApp/SMS/Email automation (current version only has click-to-WhatsApp/click-to-call links, no auto-sending)
4. Calendar/week view for jobs (currently a list)
5. AMC auto-renewal reminders
6. Editing customers/jobs after creation (currently add + delete only — edit can be added quickly once you confirm which fields matter most)

## Setup — step by step

### 1. Create a free Supabase project
Go to https://supabase.com → New Project. Save the database password somewhere safe.

### 2. Run the database schema
In your Supabase project: **SQL Editor → New query** → paste the entire contents of
`supabase/schema.sql` → Run.

### 3. Get your API keys
**Project Settings → API** → copy the `Project URL` and the `anon public` key.

### 4. Set environment variables
Create a file called `.env.local` in the project root:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Install and run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

### 6. Create your owner account
- Go to your Supabase project → **Authentication → Users → Add user** (use your real email + a password).
- Back in **SQL Editor**, run (replace with your email):
```sql
update profiles set role = 'owner' where id = (
  select id from auth.users where email = 'you@example.com'
);
```
- Now log in at `/login` with that email — you'll land on the full dashboard.

### 7. Add a technician
Same process: create their user in Authentication → Users, then run:
```sql
update profiles set role = 'technician' where id = (
  select id from auth.users where email = 'technician@example.com'
);
```

### 8. Customers logging in themselves
When a customer signs up (you'd need to add a signup page, or create their login manually
the same way), their profile defaults to role `customer`. To link their login to an existing
customer record so they can see their own jobs/invoices, run:
```sql
update customers set profile_id = (
  select id from auth.users where email = 'customer@example.com'
) where id = 'the-customer-row-id';
```

### 9. Deploy to Vercel
- Push this folder to a GitHub repo
- Import it in Vercel
- Add the same two environment variables in Vercel's project settings
- Deploy

## Notes
- WhatsApp links use the format `wa.me/91XXXXXXXXXX` — adjust the country code in
  `app/dashboard/customers/page.tsx` if needed.
- The "AMC Renewals (30 days)" stat on the dashboard pulls from `amc_renewal_date` on the
  customer record — set this when adding/editing a customer with an AMC plan.
