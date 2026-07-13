create table categories (
    id uuid primary key,
    name varchar(120) not null unique,
    display_order integer not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table credit_sources (
    id uuid primary key,
    name varchar(120) not null unique,
    display_order integer not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table monthly_records (
    id uuid primary key,
    year integer not null,
    month integer not null,
    start_date date not null,
    end_date date not null,
    opening_balance numeric(14, 2) not null,
    total_credits numeric(14, 2) not null,
    total_debits numeric(14, 2) not null,
    closing_balance numeric(14, 2) not null,
    transaction_count integer not null,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint uk_monthly_records_year_month unique (year, month)
);

create table settings (
    id uuid primary key,
    setup_complete boolean not null,
    initial_balance numeric(14, 2) not null,
    current_month_id uuid references monthly_records(id),
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table transactions (
    id uuid primary key,
    monthly_record_id uuid not null references monthly_records(id) on delete cascade,
    type varchar(20) not null,
    category_id uuid references categories(id),
    credit_source_id uuid references credit_sources(id),
    amount numeric(14, 2) not null check (amount > 0),
    occurred_at timestamp not null,
    description varchar(180) not null,
    balance_after_transaction numeric(14, 2) not null,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint chk_transaction_target check (
        (type = 'DEBIT' and category_id is not null and credit_source_id is null)
        or
        (type = 'CREDIT' and credit_source_id is not null and category_id is null)
    )
);

create table monthly_notes (
    id uuid primary key,
    monthly_record_id uuid not null unique references monthly_records(id) on delete cascade,
    content text not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create index idx_transactions_month on transactions(monthly_record_id);
create index idx_transactions_occurred_at on transactions(occurred_at);
create index idx_transactions_type on transactions(type);
