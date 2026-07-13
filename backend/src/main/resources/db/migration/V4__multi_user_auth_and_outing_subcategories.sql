create table if not exists users (
    id uuid primary key,
    name varchar(120) not null,
    email varchar(180) not null unique,
    password_hash varchar(255) not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

insert into users (id, name, email, password_hash, created_at, updated_at)
values (
    '00000000-0000-0000-0000-000000000001',
    'Local User',
    'local@example.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiUca7yxuI1w68z5pb09AObCLWkyS6G',
    now(),
    now()
)
on conflict (email) do nothing;

alter table monthly_records add column if not exists user_id uuid;
alter table settings add column if not exists user_id uuid;
alter table transactions add column if not exists user_id uuid;
alter table monthly_notes add column if not exists user_id uuid;
alter table transactions add column if not exists sub_category varchar(80);

update monthly_records set user_id = '00000000-0000-0000-0000-000000000001' where user_id is null;
update settings set user_id = '00000000-0000-0000-0000-000000000001' where user_id is null;
update transactions set user_id = '00000000-0000-0000-0000-000000000001' where user_id is null;
update monthly_notes set user_id = '00000000-0000-0000-0000-000000000001' where user_id is null;

alter table monthly_records alter column user_id set not null;
alter table settings alter column user_id set not null;
alter table transactions alter column user_id set not null;
alter table monthly_notes alter column user_id set not null;

alter table monthly_records
    add constraint fk_monthly_records_user foreign key (user_id) references users(id) on delete cascade;

alter table settings
    add constraint fk_settings_user foreign key (user_id) references users(id) on delete cascade;

alter table transactions
    add constraint fk_transactions_user foreign key (user_id) references users(id) on delete cascade;

alter table monthly_notes
    add constraint fk_monthly_notes_user foreign key (user_id) references users(id) on delete cascade;

alter table monthly_records drop constraint if exists uk_monthly_records_year_month;
alter table monthly_records
    add constraint uk_monthly_records_user_year_month unique (user_id, year, month);

alter table settings
    add constraint uk_settings_user unique (user_id);

create index if not exists idx_monthly_records_user on monthly_records(user_id);
create index if not exists idx_transactions_user on transactions(user_id);
create index if not exists idx_monthly_notes_user on monthly_notes(user_id);
