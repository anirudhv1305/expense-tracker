alter table categories add column user_id uuid;
alter table categories add column active boolean not null default true;
alter table categories drop constraint if exists categories_name_key;

create temporary table category_user_map (
    old_id uuid not null,
    user_id uuid not null,
    new_id uuid not null,
    primary key (old_id, user_id)
) on commit drop;

insert into category_user_map(old_id, user_id, new_id)
select c.id, u.id, gen_random_uuid()
from categories c cross join users u;

create table category_templates (
    category_name varchar(120) primary key,
    display_order integer not null
);
insert into category_templates(category_name, display_order)
select name, display_order from categories;
create table sub_category_templates (
    category_name varchar(120) not null references category_templates(category_name) on delete cascade,
    name varchar(80) not null,
    primary key(category_name, name)
);
insert into sub_category_templates(category_name, name)
select distinct c.name, trim(t.sub_category)
from transactions t join category_user_map m on m.old_id = t.category_id and m.user_id = t.user_id
join categories c on c.id = m.old_id
where t.sub_category is not null and trim(t.sub_category) <> ''
on conflict do nothing;
insert into sub_category_templates(category_name, name)
select 'Outings', defaults.name from (values ('Friend'), ('Girlfriend')) as defaults(name)
where exists (select 1 from category_templates where category_name = 'Outings')
on conflict do nothing;

insert into categories(id, user_id, name, display_order, active, created_at, updated_at)
select m.new_id, m.user_id, c.name, c.display_order, true, now(), now()
from category_user_map m join categories c on c.id = m.old_id;

update transactions t
set category_id = m.new_id
from category_user_map m
where t.category_id = m.old_id and t.user_id = m.user_id;

delete from categories where user_id is null;
alter table categories alter column user_id set not null;
alter table categories add constraint fk_categories_user foreign key (user_id) references users(id) on delete cascade;
alter table categories add constraint uk_categories_user_name unique(user_id, name);
create index idx_categories_user on categories(user_id);

create table sub_categories (
    id uuid primary key,
    category_id uuid not null references categories(id) on delete cascade,
    name varchar(80) not null,
    active boolean not null default true,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint uk_sub_categories_category_name unique(category_id, name)
);

insert into sub_categories(id, category_id, name, active, created_at, updated_at)
select gen_random_uuid(), c.id, defaults.name, true, now(), now()
from categories c
cross join (values ('Friend'), ('Girlfriend')) as defaults(name)
where lower(c.name) = 'outings';

insert into sub_categories(id, category_id, name, active, created_at, updated_at)
select distinct gen_random_uuid(), t.category_id, t.sub_category, true, now(), now()
from transactions t
where t.category_id is not null and t.sub_category is not null and trim(t.sub_category) <> ''
on conflict (category_id, name) do nothing;

alter table transactions add column sub_category_id uuid;
update transactions t set sub_category_id = s.id
from sub_categories s
where s.category_id = t.category_id and lower(s.name) = lower(t.sub_category);
alter table transactions add constraint fk_transactions_sub_category foreign key (sub_category_id) references sub_categories(id) on delete set null;
create index idx_sub_categories_category on sub_categories(category_id);
