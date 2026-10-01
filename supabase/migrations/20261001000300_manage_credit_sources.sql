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

create or replace function public.ensure_active_credit_source()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.type = 'CREDIT'
     and (tg_op = 'INSERT' or new.credit_source_id is distinct from old.credit_source_id) then
    perform 1
      from public.credit_sources
      where id = new.credit_source_id
        and user_id = new.user_id
        and active;
    if not found then
      raise exception 'Choose an active credit source';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists transactions_require_active_credit_source on public.transactions;
create trigger transactions_require_active_credit_source
  before insert or update of type, credit_source_id on public.transactions
  for each row execute function public.ensure_active_credit_source();
