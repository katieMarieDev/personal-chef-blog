-- RLS policies

-- RLS strategy: public can read public recipes and blog posts.
-- All writes require authentication (handled in API routes using service role key).
-- Since the service role key bypasses RLS, these policies govern direct/anon access only.

-- Recipes: public can read public ones; authenticated users can read all and write
alter table recipes enable row level security;

create policy "Public can view public recipes"
  on recipes for select
  using (is_public = true);

create policy "Authenticated users can manage all recipes"
  on recipes for all
  using (auth.role() = 'authenticated');

-- Ingredients: public can read if recipe is public
alter table ingredients enable row level security;

create policy "Public can view ingredients of public recipes"
  on ingredients for select
  using (recipe_id in (
    select id from recipes where is_public = true
  ));

create policy "Authenticated users can manage all ingredients"
  on ingredients for all
  using (auth.role() = 'authenticated');

-- Tags: same pattern
alter table recipe_tags enable row level security;

create policy "Public can view tags of public recipes"
  on recipe_tags for select
  using (recipe_id in (
    select id from recipes where is_public = true
  ));

create policy "Authenticated users can manage all tags"
  on recipe_tags for all
  using (auth.role() = 'authenticated');

-- Photos: same pattern
alter table recipe_photos enable row level security;

create policy "Public can view photos of public recipes"
  on recipe_photos for select
  using (recipe_id in (
    select id from recipes where is_public = true
  ));

create policy "Authenticated users can manage all photos"
  on recipe_photos for all
  using (auth.role() = 'authenticated');

-- Blog posts: public can read all; authenticated users can write
alter table blog_posts enable row level security;

create policy "Public can read blog posts"
  on blog_posts for select
  using (true);

create policy "Authenticated users can manage blog posts"
  on blog_posts for all
  using (auth.role() = 'authenticated');
