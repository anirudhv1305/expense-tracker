create or replace function public.recalculate_month(p_month_id uuid) returns public.monthly_records
language plpgsql security definer set search_path = '' as $$
declare
  m public.monthly_records;
  next_month public.monthly_records;
  running numeric(14,2);
  credits numeric(14,2) := 0;
  debits numeric(14,2) := 0;
  tx record;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into m
    from public.monthly_records
    where id = p_month_id and user_id = auth.uid()
    for update;
  if not found then raise exception 'Month not found'; end if;

  running := m.opening_balance;
  for tx in
    select id, type, amount
      from public.transactions
      where monthly_record_id = m.id and user_id = auth.uid()
      order by occurred_at, created_at, id
      for update
  loop
    if tx.type = 'CREDIT' then
      running := running + tx.amount;
      credits := credits + tx.amount;
    else
      running := running - tx.amount;
      debits := debits + tx.amount;
    end if;
    update public.transactions set balance_after_transaction = running where id = tx.id;
  end loop;

  update public.monthly_records
    set total_credits = credits,
        total_debits = debits,
        closing_balance = running,
        transaction_count = (
          select count(*) from public.transactions
          where monthly_record_id = m.id and user_id = auth.uid()
        )
    where id = m.id
    returning * into m;

  select * into next_month
    from public.monthly_records
    where user_id = auth.uid()
      and (year, month) > (m.year, m.month)
    order by year, month
    limit 1
    for update;

  if found then
    update public.monthly_records
      set opening_balance = m.closing_balance
      where id = next_month.id and user_id = auth.uid();
    perform public.recalculate_month(next_month.id);
  end if;

  return m;
end $$;
