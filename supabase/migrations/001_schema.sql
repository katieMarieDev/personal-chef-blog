-- All table definitions

-- Recipes (no user_id — single site, all owned by the chef)
create table recipes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  source text,
  source_url text,
  cook_time text,
  prep_time text,
  servings integer,
  meal_type text,
  steps text[],
  notes text,
  is_public boolean default false,
  imported_via text,
  hero_image_url text,
  created_at timestamp with time zone default now()
);

create table ingredients (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references recipes(id) on delete cascade,
  qty text,
  unit text,
  name text not null
);

create table recipe_tags (
  recipe_id uuid references recipes(id) on delete cascade,
  tag text not null,
  primary key (recipe_id, tag)
);

create table recipe_photos (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references recipes(id) on delete cascade,
  url text not null,
  is_hero boolean default false,
  caption text,
  created_at timestamp with time zone default now()
);

-- Blog posts
create table blog_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  body text,
  excerpt text,
  hero_image_url text,
  published_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);
