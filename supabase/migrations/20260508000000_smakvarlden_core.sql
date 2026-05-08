do $$
begin
  if not exists (select 1 from pg_type where typname = 'activity_type') then
    create type activity_type as enum (
      'recipe_created',
      'recipe_updated',
      'price_change',
      'recipe_shared'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('user', 'admin');
  end if;
end $$;

create table if not exists public.users (
  id serial primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role user_role not null default 'user',
  created_at timestamp not null default now()
);

create table if not exists public.ingredients (
  id serial primary key,
  name text not null,
  category text not null,
  unit text not null,
  current_price_sek numeric(10, 2) not null,
  price_change_pct numeric(6, 2) not null default 0,
  supplier text,
  updated_at timestamp not null default now()
);

create table if not exists public.recipes (
  id serial primary key,
  name text not null,
  description text,
  category text not null,
  cuisine text,
  emoji text,
  servings integer not null default 4,
  total_cost_sek numeric(10, 2) not null default 0,
  selling_price_sek numeric(10, 2) not null,
  profit_margin_pct numeric(6, 2) not null default 0,
  is_shared boolean not null default false,
  user_id integer references public.users(id) on delete set null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists public.recipe_ingredients (
  id serial primary key,
  recipe_id integer not null references public.recipes(id) on delete cascade,
  ingredient_id integer not null references public.ingredients(id) on delete cascade,
  quantity numeric(10, 3) not null,
  unit text not null
);

create table if not exists public.activity_log (
  id serial primary key,
  type activity_type not null,
  title text not null,
  subtitle text not null,
  timestamp timestamp not null default now()
);

create table if not exists public.community_posts (
  id serial primary key,
  recipe_name text not null,
  chef_name text not null,
  description text not null,
  category text not null,
  cost_sek numeric(10, 2) not null,
  likes integer not null default 0,
  created_at timestamp not null default now()
);

create index if not exists ingredients_category_idx on public.ingredients(category);
create index if not exists recipes_category_idx on public.recipes(category);
create index if not exists recipes_is_shared_idx on public.recipes(is_shared);
create index if not exists recipe_ingredients_recipe_id_idx on public.recipe_ingredients(recipe_id);
create index if not exists community_posts_category_idx on public.community_posts(category);
