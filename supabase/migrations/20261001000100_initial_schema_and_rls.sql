create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name varchar(120) not null,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(btrim(name)) > 0),
  unique (id, user_id),
  unique (user_id, name)
);

create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid not null,
  name varchar(80) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(btrim(name)) > 0),
  unique (id, user_id),
  unique (id, category_id, user_id),
  unique (category_id, name),
  foreign key (category_id, user_id) references public.categories(id, user_id) on delete cascade
);

create table public.credit_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name varchar(120) not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(btrim(name)) > 0),
  unique (id, user_id),
  unique (user_id, name)
);

create table public.monthly_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  year integer not null check (year between 1900 and 9999),
  month integer not null check (month between 1 and 12),
  start_date date not null,
  end_date date not null,
  opening_balance numeric(14,2) not null default 0,
  total_credits numeric(14,2) not null default 0,
  total_debits numeric(14,2) not null default 0,
  closing_balance numeric(14,2) not null default 0,
  transaction_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year, month),
  unique (id, user_id)
);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users(id) on delete cascade,
  setup_complete boolean not null default false,
  initial_balance numeric(14,2) not null default 0,
  current_month_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (current_month_id, user_id) references public.monthly_records(id, user_id) on delete set null (current_month_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  monthly_record_id uuid not null,
  type varchar(20) not null check (type in ('DEBIT', 'CREDIT')),
  category_id uuid,
  category_name varchar(120),
  subcategory_id uuid,
  subcategory_name varchar(80),
  credit_source_id uuid,
  credit_source_name varchar(120),
  amount numeric(14,2) not null check (amount > 0),
  occurred_at timestamp without time zone not null,
  description varchar(180) not null,
  balance_after_transaction numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (monthly_record_id, user_id) references public.monthly_records(id, user_id) on delete cascade,
  foreign key (category_id, user_id) references public.categories(id, user_id) on delete restrict,
  foreign key (subcategory_id, category_id, user_id) references public.subcategories(id, category_id, user_id) on delete restrict,
  foreign key (credit_source_id, user_id) references public.credit_sources(id, user_id) on delete restrict,
  check ((type = 'DEBIT' and category_id is not null and credit_source_id is null)
      or (type = 'CREDIT' and credit_source_id is not null and category_id is null))
);

create table public.monthly_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  monthly_record_id uuid not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (monthly_record_id),
  foreign key (monthly_record_id, user_id) references public.monthly_records(id, user_id) on delete cascade
);

create index on public.categories(user_id, display_order);
create index on public.subcategories(category_id, created_at);
create index on public.credit_sources(user_id, display_order);
create index on public.monthly_records(user_id, year desc, month desc);
create index on public.transactions(user_id, monthly_record_id, occurred_at, created_at);
create index on public.transactions(user_id, occurred_at);
create unique index categories_user_lower_name on public.categories(user_id, lower(name));
create unique index subcategories_category_lower_name on public.subcategories(category_id, lower(name));

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['profiles','categories','subcategories','credit_sources','monthly_records','settings','transactions','monthly_notes'] loop
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  insert into public.settings(user_id) values (new.id);
  insert into public.categories(user_id, name, display_order) values
    (new.id,'Food & Snacks',1),(new.id,'College Food Expenses',2),(new.id,'Travel',3),(new.id,'Outings',4),
    (new.id,'Shopping',5),(new.id,'Recharge',6),(new.id,'Miscellaneous',7),(new.id,'Others',8);
  insert into public.subcategories(user_id, category_id, name)
    select new.id, c.id, d.name from public.categories c cross join (values ('Friend'),('Girlfriend')) d(name)
    where c.user_id = new.id and c.name = 'Outings';
  insert into public.credit_sources(user_id, name, display_order) values
    (new.id,'Parents',1),(new.id,'Salary',2),(new.id,'Scholarship',3),(new.id,'Friend',4),(new.id,'Refund',5),(new.id,'Other',6);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.sync_transaction_labels() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'categories' then
    update public.transactions set category_name = new.name where category_id = new.id;
  elsif tg_table_name = 'subcategories' then
    update public.transactions set subcategory_name = new.name where subcategory_id = new.id;
  elsif tg_table_name = 'credit_sources' then
    update public.transactions set credit_source_name = new.name where credit_source_id = new.id;
  end if;
  return new;
end $$;
create trigger categories_sync_labels after update of name on public.categories for each row execute function public.sync_transaction_labels();
create trigger subcategories_sync_labels after update of name on public.subcategories for each row execute function public.sync_transaction_labels();
create trigger credit_sources_sync_labels after update of name on public.credit_sources for each row execute function public.sync_transaction_labels();

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.monthly_records enable row level security;
alter table public.transactions enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.credit_sources enable row level security;
alter table public.monthly_notes enable row level security;

create policy "profile owner read" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profile owner update" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "settings owner read" on public.settings for select to authenticated using (user_id = (select auth.uid()));
create policy "months owner read" on public.monthly_records for select to authenticated using (user_id = (select auth.uid()));
create policy "transactions owner read" on public.transactions for select to authenticated using (user_id = (select auth.uid()));
create policy "categories owner all" on public.categories for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "subcategories owner all" on public.subcategories for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "credit sources owner read" on public.credit_sources for select to authenticated using (user_id = (select auth.uid()));
create policy "notes owner all" on public.monthly_notes for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.settings, public.monthly_records, public.transactions from anon, authenticated;
grant select on public.settings, public.monthly_records, public.transactions to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.categories, public.subcategories to authenticated;
grant select on public.credit_sources to authenticated;
grant select, insert, update, delete on public.monthly_notes to authenticated;

create function public.recalculate_month(p_month_id uuid) returns public.monthly_records
language plpgsql security definer set search_path = '' as $$
declare m public.monthly_records; running numeric(14,2); credits numeric(14,2) := 0; debits numeric(14,2) := 0; tx record;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into m from public.monthly_records where id = p_month_id and user_id = auth.uid() for update;
  if not found then raise exception 'Month not found'; end if;
  running := m.opening_balance;
  for tx in select id, type, amount from public.transactions where monthly_record_id = m.id and user_id = auth.uid() order by occurred_at, created_at, id for update loop
    if tx.type = 'CREDIT' then running := running + tx.amount; credits := credits + tx.amount;
    else running := running - tx.amount; debits := debits + tx.amount; end if;
    update public.transactions set balance_after_transaction = running where id = tx.id;
  end loop;
  update public.monthly_records set total_credits = credits, total_debits = debits, closing_balance = running,
    transaction_count = (select count(*) from public.transactions where monthly_record_id=m.id and user_id=auth.uid())
    where id=m.id returning * into m;
  return m;
end $$;

create function public.setup_tracking(p_initial_balance numeric, p_today date default current_date) returns public.monthly_records
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); today date := p_today; first_day date; last_day date; m public.monthly_records;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if p_initial_balance < 0 then raise exception 'Initial balance cannot be negative'; end if;
  perform 1 from public.settings where user_id=uid and not setup_complete for update;
  if not found then raise exception 'Setup has already been completed'; end if;
  first_day := date_trunc('month', today)::date; last_day := (first_day + interval '1 month - 1 day')::date;
  insert into public.monthly_records(user_id,year,month,start_date,end_date,opening_balance,closing_balance)
    values(uid,extract(year from today)::int,extract(month from today)::int,today,last_day,p_initial_balance,p_initial_balance)
    on conflict(user_id,year,month) do update set start_date=excluded.start_date returning * into m;
  update public.settings set setup_complete=true, initial_balance=p_initial_balance, current_month_id=m.id where user_id=uid;
  return m;
end $$;

create function public.ensure_current_month(p_today date default current_date) returns public.monthly_records
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); s public.settings; m public.monthly_records; today date := p_today; first_day date;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  select * into s from public.settings where user_id=uid for update;
  if not found or not s.setup_complete then raise exception 'Complete first-time setup'; end if;
  if s.current_month_id is not null then select * into m from public.monthly_records where id=s.current_month_id and user_id=uid; end if;
  if found and m.year=extract(year from today)::int and m.month=extract(month from today)::int then return m; end if;
  first_day := date_trunc('month', today)::date;
  insert into public.monthly_records(user_id,year,month,start_date,end_date,opening_balance,closing_balance)
    values(uid,extract(year from today)::int,extract(month from today)::int,first_day,(first_day + interval '1 month - 1 day')::date,
      coalesce(m.closing_balance,s.initial_balance),coalesce(m.closing_balance,s.initial_balance))
    on conflict(user_id,year,month) do update set user_id=excluded.user_id returning * into m;
  update public.settings set current_month_id=m.id where user_id=uid;
  return m;
end $$;

create function public.update_opening_balance(p_opening_balance numeric, p_today date default current_date) returns public.monthly_records
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); m public.monthly_records;
begin
  if p_opening_balance < 0 then raise exception 'Opening balance cannot be negative'; end if;
  m := public.ensure_current_month(p_today);
  update public.monthly_records set opening_balance=p_opening_balance where id=m.id and user_id=uid;
  update public.settings set initial_balance=p_opening_balance where user_id=uid;
  return public.recalculate_month(m.id);
end $$;

create function public.save_transaction(p_type text,p_amount numeric,p_date date,p_description text,p_category_id uuid default null,p_credit_source_id uuid default null,p_subcategory_id uuid default null,p_transaction_id uuid default null,p_today date default current_date) returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); m public.monthly_records; c public.categories; sc public.subcategories; cs public.credit_sources; t public.transactions; stamp time without time zone; saved_id uuid;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if p_amount <= 0 or length(trim(p_description))=0 or length(p_description)>180 then raise exception 'Invalid transaction details'; end if;
  if p_transaction_id is null then
    m := public.ensure_current_month(p_today);
  else
    select * into t from public.transactions where id=p_transaction_id and user_id=uid for update;
    if not found then raise exception 'Transaction not found'; end if;
    select * into m from public.monthly_records where id=t.monthly_record_id and user_id=uid;
    stamp := t.occurred_at::time;
  end if;
  if p_date < m.start_date or p_date > m.end_date then raise exception 'Transaction date must stay inside its tracking month'; end if;
  if p_type='DEBIT' then
    select * into c from public.categories where id=p_category_id and user_id=uid and active for update;
    if not found then raise exception 'Choose an active category'; end if;
    if p_subcategory_id is not null then
      select * into sc from public.subcategories where id=p_subcategory_id and category_id=c.id and user_id=uid and active for update;
      if not found then raise exception 'Choose an active subcategory for this category'; end if;
    end if;
    cs := null;
  elsif p_type='CREDIT' then
    if p_subcategory_id is not null or p_category_id is not null then raise exception 'Invalid credit target'; end if;
    select * into cs from public.credit_sources where id=p_credit_source_id and user_id=uid;
    if not found then raise exception 'Choose a credit source'; end if;
    c := null; sc := null;
  else raise exception 'Invalid transaction type'; end if;
  if p_transaction_id is null then stamp := localtime; end if;
  saved_id := coalesce(p_transaction_id,gen_random_uuid());
  insert into public.transactions(id,user_id,monthly_record_id,type,category_id,category_name,subcategory_id,subcategory_name,credit_source_id,credit_source_name,amount,occurred_at,description,balance_after_transaction)
  values(saved_id,uid,m.id,p_type,c.id,c.name,sc.id,sc.name,cs.id,cs.name,p_amount,p_date+stamp,trim(p_description),0)
  on conflict(id) do update set type=excluded.type,category_id=excluded.category_id,category_name=excluded.category_name,subcategory_id=excluded.subcategory_id,subcategory_name=excluded.subcategory_name,credit_source_id=excluded.credit_source_id,credit_source_name=excluded.credit_source_name,amount=excluded.amount,occurred_at=excluded.occurred_at,description=excluded.description;
  perform public.recalculate_month(m.id);
  return saved_id;
end $$;

create function public.delete_transaction(p_transaction_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare mid uuid;
begin
  delete from public.transactions where id=p_transaction_id and user_id=auth.uid() returning monthly_record_id into mid;
  if mid is null then raise exception 'Transaction not found'; end if;
  perform public.recalculate_month(mid);
end $$;

create function public.save_month_note(p_month_id uuid,p_content text) returns public.monthly_notes
language plpgsql security definer set search_path = '' as $$
declare n public.monthly_notes;
begin
  insert into public.monthly_notes(user_id,monthly_record_id,content)
    select auth.uid(),id,left(coalesce(p_content,''),5000) from public.monthly_records where id=p_month_id and user_id=auth.uid()
    on conflict(monthly_record_id) do update set content=excluded.content returning * into n;
  if n.id is null then raise exception 'Month not found'; end if;
  return n;
end $$;

revoke all on function public.recalculate_month(uuid), public.setup_tracking(numeric,date), public.ensure_current_month(date), public.update_opening_balance(numeric,date), public.save_transaction(text,numeric,date,text,uuid,uuid,uuid,uuid,date), public.delete_transaction(uuid), public.save_month_note(uuid,text) from public, anon;
grant execute on function public.setup_tracking(numeric,date), public.ensure_current_month(date), public.update_opening_balance(numeric,date), public.save_transaction(text,numeric,date,text,uuid,uuid,uuid,uuid,date), public.delete_transaction(uuid), public.save_month_note(uuid,text) to authenticated;
