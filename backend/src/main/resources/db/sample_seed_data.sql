-- Optional demo data for a database that has already completed first-time setup.
-- Replace :MONTH_ID with the id from monthly_records for your current month.

insert into transactions (
    id, monthly_record_id, type, category_id, credit_source_id, amount, occurred_at,
    description, balance_after_transaction, created_at, updated_at
) values
('10000000-0000-0000-0000-000000000001', :MONTH_ID, 'CREDIT', null, '00000000-0000-0000-0000-000000000201', 12000.00, now() - interval '5 days', 'Monthly allowance', 0, now(), now()),
('10000000-0000-0000-0000-000000000002', :MONTH_ID, 'DEBIT', '00000000-0000-0000-0000-000000000101', null, 240.00, now() - interval '4 days', 'Snacks and coffee', 0, now(), now()),
('10000000-0000-0000-0000-000000000003', :MONTH_ID, 'DEBIT', '00000000-0000-0000-0000-000000000103', null, 680.00, now() - interval '3 days', 'Metro card recharge', 0, now(), now()),
('10000000-0000-0000-0000-000000000004', :MONTH_ID, 'DEBIT', '00000000-0000-0000-0000-000000000105', null, 1599.00, now() - interval '1 day', 'Backpack', 0, now(), now());

-- Restart the backend and add one more transaction from the UI to trigger recalculation,
-- or call the application service from tests. The API path is recommended for normal use.
