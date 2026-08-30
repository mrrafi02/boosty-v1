-- BOOSTY V1 DATABASE
-- Run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

create type public.user_status as enum ('active','suspended');
create type public.app_role as enum ('user','admin');
create type public.service_status as enum ('active','disabled');
create type public.order_status as enum ('Pending','Processing','In Progress','Completed','Partial','Cancelled','Refunded');
create type public.deposit_status as enum ('Pending','Approved','Rejected');
create type public.transaction_type as enum ('Deposit','Order','Refund','Admin Adjustment');
create type public.ticket_status as enum ('Open','Pending','Answered','Closed');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  username text unique,
  email text,
  phone text,
  balance numeric(14,2) not null default 0 check (balance >= 0),
  status public.user_status not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'user'
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  name text not null,
  description text,
  status public.service_status not null default 'active',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  service_id text unique not null,
  platform text not null,
  category_id uuid not null references public.categories(id),
  name text not null,
  description text,
  rate_per_1000 numeric(14,4) not null check (rate_per_1000 >= 0),
  min_quantity int not null check (min_quantity > 0),
  max_quantity int not null check (max_quantity >= min_quantity),
  speed text,
  start_time text,
  refill text,
  status public.service_status not null default 'active',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_number text not null,
  instructions text,
  status public.service_status not null default 'active',
  sort_order int not null default 0
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid not null references public.profiles(id),
  service_id uuid not null references public.services(id),
  link text not null,
  quantity int not null,
  charge numeric(14,2) not null check (charge >= 0),
  status public.order_status not null default 'Pending',
  internal_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  type public.transaction_type not null,
  amount numeric(14,2) not null,
  balance_after numeric(14,2) not null check (balance_after >= 0),
  reference_id text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  payment_method_id uuid not null references public.payment_methods(id),
  amount numeric(14,2) not null check (amount > 0),
  transaction_id text not null,
  status public.deposit_status not null default 'Pending',
  created_at timestamptz not null default now(),
  unique(user_id, transaction_id)
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  subject text not null,
  message text not null,
  status public.ticket_status not null default 'Open',
  created_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists services_category_idx on public.services(category_id);
create index if not exists orders_user_idx on public.orders(user_id, created_at desc);
create index if not exists transactions_user_idx on public.transactions(user_id, created_at desc);
create index if not exists deposits_user_idx on public.deposits(user_id, created_at desc);

create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.user_roles where user_id=uid and role='admin'); $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.profiles(id,name,username,email)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'username', new.email)
  on conflict (id) do nothing;
  insert into public.user_roles(user_id,role) values(new.id,'user') on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.payment_methods enable row level security;
alter table public.orders enable row level security;
alter table public.transactions enable row level security;
alter table public.deposits enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.announcements enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

create policy "profile own read" on public.profiles for select using (id=auth.uid() or public.is_admin(auth.uid()));
create policy "profile own update" on public.profiles for update using (id=auth.uid() or public.is_admin(auth.uid())) with check (id=auth.uid() or public.is_admin(auth.uid()));
create policy "roles own read" on public.user_roles for select using (user_id=auth.uid() or public.is_admin(auth.uid()));

create policy "public active categories" on public.categories for select using (status='active' or public.is_admin(auth.uid()));
create policy "public active services" on public.services for select using (status='active' or public.is_admin(auth.uid()));
create policy "active payment methods" on public.payment_methods for select using (status='active' or public.is_admin(auth.uid()));
create policy "own orders" on public.orders for select using (user_id=auth.uid() or public.is_admin(auth.uid()));
create policy "own transactions" on public.transactions for select using (user_id=auth.uid() or public.is_admin(auth.uid()));
create policy "own deposits" on public.deposits for select using (user_id=auth.uid() or public.is_admin(auth.uid()));
create policy "own deposits insert" on public.deposits for insert with check (user_id=auth.uid());
create policy "own tickets" on public.support_tickets for select using (user_id=auth.uid() or public.is_admin(auth.uid()));
create policy "own tickets insert" on public.support_tickets for insert with check (user_id=auth.uid());
create policy "ticket messages" on public.support_messages for select using (exists(select 1 from public.support_tickets t where t.id=ticket_id and (t.user_id=auth.uid() or public.is_admin(auth.uid()))));
create policy "own notifications" on public.notifications for select using (user_id=auth.uid() or public.is_admin(auth.uid()));
create policy "announcements read" on public.announcements for select using (published=true or public.is_admin(auth.uid()));
create policy "settings read" on public.site_settings for select using (true);
create policy "audit admin" on public.audit_logs for select using (public.is_admin(auth.uid()));

create or replace function public.place_order(p_service_id uuid, p_link text, p_quantity int)
returns text language plpgsql security definer set search_path=public
as $$
declare
  v_service services%rowtype;
  v_profile profiles%rowtype;
  v_charge numeric(14,2);
  v_order_number text;
  v_order_id uuid;
begin
  select * into v_service from services where id=p_service_id and status='active' for share;
  if not found then raise exception 'Service is unavailable'; end if;
  if p_quantity < v_service.min_quantity or p_quantity > v_service.max_quantity then raise exception 'Invalid quantity'; end if;
  if length(trim(p_link)) < 5 then raise exception 'Invalid link'; end if;
  select * into v_profile from profiles where id=auth.uid() and status='active' for update;
  if not found then raise exception 'Account unavailable'; end if;
  v_charge := round((p_quantity::numeric / 1000) * v_service.rate_per_1000, 2);
  if v_profile.balance < v_charge then raise exception 'Insufficient balance'; end if;
  v_order_number := 'BST-' || to_char(now(),'YYMMDDHH24MISS') || '-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,6));
  insert into orders(order_number,user_id,service_id,link,quantity,charge) values(v_order_number,auth.uid(),p_service_id,trim(p_link),p_quantity,v_charge) returning id into v_order_id;
  update profiles set balance=balance-v_charge where id=auth.uid();
  insert into transactions(user_id,type,amount,balance_after,reference_id,description)
  select auth.uid(),'Order',-v_charge,balance,v_order_number,'Order charge'
  from profiles where id=auth.uid();
  insert into notifications(user_id,title,message) values(auth.uid(),'Order created','Your order '||v_order_number||' has been created.');
  return v_order_number;
end;
$$;

grant execute on function public.place_order(uuid,text,int) to authenticated;

-- Initial Boosty catalog
insert into categories(platform,name,description,sort_order)
select 'Facebook','Followers','Real Account - Fast Speed',10
where not exists(select 1 from categories where platform='Facebook' and name='Followers');

insert into categories(platform,name,description,sort_order)
select 'Facebook','Post Reactions','Global Data - Medium Speed',20
where not exists(select 1 from categories where platform='Facebook' and name='Post Reactions');

insert into services(service_id,platform,category_id,name,description,rate_per_1000,min_quantity,max_quantity,speed,start_time,refill,sort_order)
select x.service_id,'Facebook',c.id,x.name,x.description,x.rate,100,x.max_qty,x.speed,x.start_time,x.refill,x.sort_order
from (values
('18717','All Type Profile/Page Followers — Real Account','Facebook Followers · Real Account · Max 1M · 50K/day · Instant · No Refill',50,1000000,'50K/day','Instant','No Refill',10),
('18718','All Type Profile/Page Followers — Real Account','Facebook Followers · Real Account · Max 1M · 50K/day · Instant · Refill 30D',57,1000000,'50K/day','Instant','30D',11),
('18719','All Type Profile/Page Followers — Real Account','Facebook Followers · Real Account · Max 1M · 50K/day · Instant · Refill 60D',62,1000000,'50K/day','Instant','60D',12),
('18720','All Type Profile/Page Followers — Real Account','Facebook Followers · Real Account · Max 1M · 50K/day · Instant · Refill 90D',66,1000000,'50K/day','Instant','90D',13),
('18721','All Type Profile/Page Followers — Real Account','Facebook Followers · Real Account · Max 1M · 50K/day · Instant · Refill 365D',71,1000000,'50K/day','Instant','365D',14),
('18722','All Type Profile/Page Followers — Real Account','Facebook Followers · Real Account · Max 1M · 50K/day · Instant · Lifetime',75,1000000,'50K/day','Instant','Lifetime',15)
) as x(service_id,name,description,rate,max_qty,speed,start_time,refill,sort_order)
cross join categories c where c.platform='Facebook' and c.name='Followers'
and not exists(select 1 from services s where s.service_id=x.service_id);

insert into services(service_id,platform,category_id,name,description,rate_per_1000,min_quantity,max_quantity,speed,start_time,refill,sort_order)
select x.service_id,'Facebook',c.id,x.name,x.description,40,100,100000,'10K/day','Instant','No Refill',x.sort_order
from (values
('16823','Post Likes 👍','Facebook Post Likes',10),
('16824','Post Reaction — Love 💖','Facebook Post Reaction',11),
('16825','Post Reaction — Care 🤗','Facebook Post Reaction',12),
('16826','Post Reaction — Wow 😮','Facebook Post Reaction',13),
('16827','Post Reaction — Haha 😂','Facebook Post Reaction',14),
('16828','Post Reaction — Sad 😭','Facebook Post Reaction',15),
('16829','Post Reaction — Angry 😡','Facebook Post Reaction',16)
) as x(service_id,name,description,sort_order)
cross join categories c where c.platform='Facebook' and c.name='Post Reactions'
and not exists(select 1 from services s where s.service_id=x.service_id);

insert into payment_methods(name,account_number,instructions,sort_order)
select 'bKash Personal','01774904218','Send money manually, then enter the transaction ID. Admin approval is required.',10
where not exists(select 1 from payment_methods where name='bKash Personal' and account_number='01774904218');
insert into payment_methods(name,account_number,instructions,sort_order)
select 'bKash Personal','01410042184','Send money manually, then enter the transaction ID. Admin approval is required.',11
where not exists(select 1 from payment_methods where name='bKash Personal' and account_number='01410042184');
insert into payment_methods(name,account_number,instructions,sort_order)
select 'Nagad Personal','01774904218','Send money manually, then enter the transaction ID. Admin approval is required.',20
where not exists(select 1 from payment_methods where name='Nagad Personal' and account_number='01774904218');
insert into payment_methods(name,account_number,instructions,sort_order)
select 'Rocket Personal','01774904218','Send money manually, then enter the transaction ID. Admin approval is required.',30
where not exists(select 1 from payment_methods where name='Rocket Personal' and account_number='01774904218');

-- IMPORTANT: after creating the admin auth user, run:
-- insert into public.user_roles(user_id, role) values('ADMIN_AUTH_USER_UUID','admin')
-- on conflict (user_id) do update set role='admin';