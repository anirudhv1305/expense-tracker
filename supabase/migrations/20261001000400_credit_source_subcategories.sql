alter table public.credit_sources
  add column if not exists active boolean not null default true;
create unique index if not exists credit_sources_user_lower_name
  on public.credit_sources(user_id, lower(name));
drop policy if exists "credit sources owner read" on public.credit_sources;
drop policy if exists "credit sources owner all" on public.credit_sources;
create policy "credit sources owner all"
  on public.credit_sources
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.credit_sources to authenticated;

create table if not exists public.credit_subcategories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  credit_source_id uuid not null,
  name varchar(80) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(btrim(name)) > 0),
  unique (id, credit_source_id, user_id),
  unique (credit_source_id, name),
  foreign key (credit_source_id, user_id)
    references public.credit_sources(id, user_id) on delete cascade
);

create index if not exists credit_subcategories_source_created_idx
  on public.credit_subcategories(credit_source_id, created_at);
create unique index if not exists credit_subcategories_source_lower_name
  on public.credit_subcategories(credit_source_id, lower(name));

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'credit_subcategories_touch_updated_at'
      and tgrelid = 'public.credit_subcategories'::regclass
  ) then
    create trigger credit_subcategories_touch_updated_at
      before update on public.credit_subcategories
      for each row execute function public.touch_updated_at();
  end if;
end;
$$;

alter table public.transactions
  add column if not exists credit_subcategory_id uuid,
  add column if not exists credit_subcategory_name varchar(80);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'transactions_credit_subcategory_fk'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint transactions_credit_subcategory_fk
      foreign key (credit_subcategory_id, credit_source_id, user_id)
      references public.credit_subcategories(id, credit_source_id, user_id)
      on delete restrict;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'transactions_credit_subcategory_type_check'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint transactions_credit_subcategory_type_check
      check (type = 'CREDIT' or credit_subcategory_id is null);
  end if;
end;
$$;

create or replace function public.sync_credit_subcategory_label()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.transactions
    set credit_subcategory_name = new.name
    where credit_subcategory_id = new.id;
  return new;
end;
$$;

drop trigger if exists credit_subcategories_sync_labels on public.credit_subcategories;
create trigger credit_subcategories_sync_labels
  after update of name on public.credit_subcategories
  for each row execute function public.sync_credit_subcategory_label();

alter table public.credit_subcategories enable row level security;
drop policy if exists "credit subcategories owner all" on public.credit_subcategories;
create policy "credit subcategories owner all"
  on public.credit_subcategories
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.credit_subcategories to authenticated;

create or replace function public.ensure_active_credit_subcategory()
returns trigger
language plpgsql
set search_path = ''
as $$
declare selected_subcategory public.credit_subcategories;
begin
  if new.credit_subcategory_id is null then
    new.credit_subcategory_name := null;
    return new;
  end if;

  if new.type <> 'CREDIT' then
    raise exception 'Credit subcategories can only be used on credit transactions';
  end if;

  select * into selected_subcategory
    from public.credit_subcategories
    where id = new.credit_subcategory_id
      and credit_source_id = new.credit_source_id
      and user_id = new.user_id
      and active;
  if not found then
    raise exception 'Choose an active subcategory for this credit source';
  end if;

  new.credit_subcategory_name := selected_subcategory.name;
  return new;
end;
$$;

drop trigger if exists transactions_require_active_credit_subcategory on public.transactions;
create trigger transactions_require_active_credit_subcategory
  before insert or update of type, credit_source_id, credit_subcategory_id on public.transactions
  for each row execute function public.ensure_active_credit_subcategory();

drop function if exists public.save_transaction(text, numeric, date, text, uuid, uuid, uuid, uuid, date);

create or replace function public.save_transaction(
  p_type text,
  p_amount numeric,
  p_date date,
  p_description text,
  p_category_id uuid default null,
  p_credit_source_id uuid default null,
  p_subcategory_id uuid default null,
  p_transaction_id uuid default null,
  p_today date default current_date,
  p_credit_subcategory_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  m public.monthly_records;
  c public.categories;
  sc public.subcategories;
  cs public.credit_sources;
  csc public.credit_subcategories;
  t public.transactions;
  stamp time without time zone;
  saved_id uuid;
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
    if p_credit_subcategory_id is not null then raise exception 'Credit subcategories can only be used on credit transactions'; end if;
    select * into c from public.categories where id=p_category_id and user_id=uid and active for update;
    if not found then raise exception 'Choose an active category'; end if;
    if p_subcategory_id is not null then
      select * into sc from public.subcategories where id=p_subcategory_id and category_id=c.id and user_id=uid and active for update;
      if not found then raise exception 'Choose an active subcategory for this category'; end if;
    end if;
    cs := null; csc := null;
  elsif p_type='CREDIT' then
    if p_subcategory_id is not null or p_category_id is not null then raise exception 'Invalid credit target'; end if;
    select * into cs from public.credit_sources where id=p_credit_source_id and user_id=uid and active;
    if not found then raise exception 'Choose an active credit source'; end if;
    if p_credit_subcategory_id is not null then
      select * into csc from public.credit_subcategories
        where id=p_credit_subcategory_id and credit_source_id=cs.id and user_id=uid and active;
      if not found then raise exception 'Choose an active subcategory for this credit source'; end if;
    end if;
    c := null; sc := null;
  else raise exception 'Invalid transaction type'; end if;
  if p_transaction_id is null then stamp := localtime; end if;
  saved_id := coalesce(p_transaction_id,gen_random_uuid());
  insert into public.transactions(id,user_id,monthly_record_id,type,category_id,category_name,subcategory_id,subcategory_name,credit_source_id,credit_source_name,credit_subcategory_id,credit_subcategory_name,amount,occurred_at,description,balance_after_transaction)
    values(saved_id,uid,m.id,p_type,c.id,c.name,sc.id,sc.name,cs.id,cs.name,csc.id,csc.name,p_amount,p_date+stamp,trim(p_description),0)
    on conflict(id) do update set type=excluded.type,category_id=excluded.category_id,category_name=excluded.category_name,subcategory_id=excluded.subcategory_id,subcategory_name=excluded.subcategory_name,credit_source_id=excluded.credit_source_id,credit_source_name=excluded.credit_source_name,credit_subcategory_id=excluded.credit_subcategory_id,credit_subcategory_name=excluded.credit_subcategory_name,amount=excluded.amount,occurred_at=excluded.occurred_at,description=excluded.description;
  perform public.recalculate_month(m.id);
  return saved_id;
end;
$$;

revoke all on function public.save_transaction(text, numeric, date, text, uuid, uuid, uuid, uuid, date, uuid)
  from public, anon;
grant execute on function public.save_transaction(text, numeric, date, text, uuid, uuid, uuid, uuid, date, uuid)
  to authenticated;
