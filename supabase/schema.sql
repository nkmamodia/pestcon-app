-- =====================================================================
-- PESTCON APP — DATABASE SCHEMA
-- Run this whole file in: Supabase Dashboard -> SQL Editor -> New query
-- =====================================================================

-- 1. PROFILES (extends Supabase's built-in auth.users with role + name)
-- ---------------------------------------------------------------------
create type user_role as enum ('owner', 'technician', 'customer');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null default 'customer',
  created_at timestamptz default now()
);

-- Automatically create a profile row whenever someone signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'customer');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 2. CUSTOMERS (the property/account record, separate from login profile)
-- ---------------------------------------------------------------------
create table customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null, -- linked once customer has a login
  full_name text not null,
  phone text not null,
  email text,
  address text,
  property_type text, -- Apartment, Villa, Office, Restaurant, Factory, etc.
  city text,
  notes text,
  amc_plan text, -- 'none' | 'residential' | 'commercial' | 'industrial'
  amc_renewal_date date,
  created_at timestamptz default now()
);

-- 3. JOBS (a single visit / treatment)
-- ---------------------------------------------------------------------
create type job_status as enum ('requested', 'scheduled', 'in_progress', 'completed', 'cancelled');

create table jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade not null,
  technician_id uuid references profiles(id) on delete set null,
  service_type text not null, -- General Pest Control, Termite, Rodent, etc.
  status job_status not null default 'requested',
  scheduled_date date,
  scheduled_time text,
  address text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. SERVICE REPORTS (technician fills this in after a job)
-- ---------------------------------------------------------------------
create table service_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade not null,
  chemicals_used text,
  work_summary text,
  before_photo_url text,
  after_photo_url text,
  technician_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- 5. INVOICES
-- ---------------------------------------------------------------------
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue');

create table invoices (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete set null,
  customer_id uuid references customers(id) on delete cascade not null,
  amount numeric(10,2) not null,
  status invoice_status not null default 'draft',
  issued_date date default current_date,
  due_date date,
  paid_date date,
  payment_method text, -- UPI, Cash, Bank Transfer
  notes text,
  created_at timestamptz default now()
);

-- =====================================================================
-- ROW LEVEL SECURITY — locks data down by role
-- =====================================================================
alter table profiles enable row level security;
alter table customers enable row level security;
alter table jobs enable row level security;
alter table service_reports enable row level security;
alter table invoices enable row level security;

-- Helper: get current user's role
create or replace function my_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

-- PROFILES: everyone can see their own; owner sees all
create policy "view own profile" on profiles for select using (auth.uid() = id or my_role() = 'owner');
create policy "update own profile" on profiles for update using (auth.uid() = id);

-- CUSTOMERS: owner & technicians see all; customer sees only their own linked record
create policy "owner_tech view customers" on customers for select using (my_role() in ('owner','technician'));
create policy "customer view own record" on customers for select using (profile_id = auth.uid());
create policy "owner manage customers" on customers for insert with check (my_role() = 'owner');
create policy "owner update customers" on customers for update using (my_role() = 'owner');
create policy "owner delete customers" on customers for delete using (my_role() = 'owner');

-- JOBS: owner sees all; technician sees only jobs assigned to them; customer sees only their own jobs
create policy "owner view all jobs" on jobs for select using (my_role() = 'owner');
create policy "technician view assigned jobs" on jobs for select using (technician_id = auth.uid());
create policy "customer view own jobs" on jobs for select using (
  customer_id in (select id from customers where profile_id = auth.uid())
);
create policy "owner manage jobs" on jobs for insert with check (my_role() = 'owner');
create policy "owner update jobs" on jobs for update using (my_role() = 'owner');
create policy "technician update assigned jobs" on jobs for update using (technician_id = auth.uid());
create policy "owner delete jobs" on jobs for delete using (my_role() = 'owner');

-- SERVICE REPORTS: owner sees all; technician manages their own; customer sees reports for their jobs
create policy "owner view reports" on service_reports for select using (my_role() = 'owner');
create policy "technician view own reports" on service_reports for select using (technician_id = auth.uid());
create policy "customer view own job reports" on service_reports for select using (
  job_id in (select id from jobs where customer_id in (select id from customers where profile_id = auth.uid()))
);
create policy "technician create reports" on service_reports for insert with check (technician_id = auth.uid());

-- INVOICES: owner sees/manages all; customer sees only their own
create policy "owner view invoices" on invoices for select using (my_role() = 'owner');
create policy "customer view own invoices" on invoices for select using (
  customer_id in (select id from customers where profile_id = auth.uid())
);
create policy "owner manage invoices" on invoices for insert with check (my_role() = 'owner');
create policy "owner update invoices" on invoices for update using (my_role() = 'owner');
create policy "owner delete invoices" on invoices for delete using (my_role() = 'owner');

-- =====================================================================
-- AFTER RUNNING THIS: go to Authentication -> Users in Supabase,
-- create your own user (the owner), then run this once, replacing the
-- email with yours, to promote yourself to 'owner':
--
-- update profiles set role = 'owner' where id = (
--   select id from auth.users where email = 'you@example.com'
-- );
-- =====================================================================
