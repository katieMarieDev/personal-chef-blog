# Chef Site — Claude Code Context

> A personal chef's website with public-facing pages, a blog, a recipe collection, and a single-owner admin login.

---

## What is this?

A personal website for a professional chef. Visitors can browse recipes, read blog posts, and submit a contact/inquiry form. The chef logs in to write blog posts, manage recipes (with public/private visibility), and edit page content.

Built as a spiritual sibling to [Mise](https://github.com/katieMarieDev/mise) — shares the same stack and some data patterns, but is a standalone project.

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Auth:** Auth0 v4 (`@auth0/nextjs-auth0`) — single admin user, uses `proxy.ts` not `middleware.ts`
- **Database:** Supabase (Postgres) with Row Level Security
- **Storage:** Supabase Storage — `recipe-photos` bucket (public)
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`) — recipe import parsing
- **Email:** Resend (contact form delivery)
- **Port:** 3001 (set in `package.json` dev script)

---

## Auth0 Setup Notes (from Mise — same pattern)

- Auth0 env vars use a custom prefix to avoid conflicts with system env vars:
  - `CHEF_AUTH0_DOMAIN`
  - `CHEF_AUTH0_CLIENT_ID`
  - `CHEF_AUTH0_CLIENT_SECRET`
  - `CHEF_AUTH0_SECRET`
- Configured in `lib/auth0.ts`
- Uses `proxy.ts` not `middleware.ts` (Auth0 v4 requirement with Next.js 16)
- Login: `/auth/login`, Logout: `/auth/logout`
- Session: `await auth0.getSession()` in server components/routes
- **Never use `<Link>` for logout** — Next.js prefetches it and triggers logout silently. Use `<a href="/auth/logout">` instead.
- Single admin: only one Auth0 user will ever log in. No multi-tenancy needed.

---

## Project Structure

```
chef-site/
  app/
    api/
      contact/route.ts          # POST — send inquiry email via Resend
      import/route.ts           # POST — AI recipe import (from Mise)
      recipes/route.ts          # GET all public recipes (+ all if admin)
      recipes/[id]/route.ts     # GET/PATCH/DELETE one recipe
      blog/route.ts             # GET all posts / POST new post (admin)
      blog/[slug]/route.ts      # GET one post / PATCH/DELETE (admin)
    blog/
      page.tsx                  # Public blog index
      [slug]/page.tsx           # Public blog post
    recipes/
      page.tsx                  # Public recipe grid
      [id]/page.tsx             # Public recipe detail
    admin/
      page.tsx                  # Admin dashboard (login-gated)
      blog/new/page.tsx         # New blog post editor
      blog/[slug]/edit/page.tsx # Edit existing post
    page.tsx                    # Home (hero, bio, featured recipes/posts)
    contact/page.tsx            # Contact / inquiry form
    layout.tsx                  # Auth0Provider wrapper, fonts, nav
  components/
    Nav.tsx                     # Site nav — public links + admin login/logout
    RecipeGrid.tsx              # Filterable recipe grid (public view)
    RecipeCard.tsx              # Single recipe card
    RecipeDetail.tsx            # Recipe detail — edit controls shown only when admin
    BlogList.tsx                # Blog post list
    BlogPost.tsx                # Rendered blog post
    ContactForm.tsx             # Contact/inquiry form (client component)
    ImportCard.tsx              # Recipe import UI (from Mise)
  lib/
    auth0.ts                    # Auth0 client singleton
    admin.ts                    # Helper: isAdmin(session) — checks session exists
  supabase/
    migrations/
      001_schema.sql            # All table definitions
      002_rls.sql               # RLS policies
  proxy.ts                      # Auth0 v4 middleware
```

---

## Key Conventions (inherited from Mise)

### Auth check pattern
```typescript
const session = await auth0.getSession();
const isAdmin = !!session; // only one user — if logged in, they're admin
```

### Edit controls — public vs. admin
Pass `isAdmin` as a prop to detail/edit components. Edit buttons, delete buttons, and the "private" checkbox only render when `isAdmin` is true. Public visitors see clean read-only views.

```tsx
// In a server component (page.tsx):
const session = await auth0.getSession();
<RecipeDetail recipe={recipe} isAdmin={!!session} />

// In the component:
{isAdmin && <button>Edit</button>}
```

### Never define components inside render
Use JSX variables instead — React throws during render otherwise:
```tsx
// ✅ JSX variable
const editBtn = isAdmin ? <button>Edit</button> : null;
return <div>{editBtn}</div>;
```

### Links
- Internal nav: `next/link` `<Link>`
- Logout: `<a href="/auth/logout">` — never `<Link>` (Next.js prefetch bug)
- External: plain `<a target="_blank" rel="noopener">`

### Images
Always `next/image` `<Image>`, never `<img>`. Config in `next.config.ts`:
```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "**" },
    { protocol: "http", hostname: "**" }
  ]
}
```

### Claude model
Always `claude-sonnet-4-6`. Do not use deprecated model strings.

### Supabase inserts — cast as any
Supabase's untyped client causes TypeScript errors on `.insert()`. Cast with `as any`:
```typescript
await supabase.from("recipes").insert({ ... } as any)
```

### Supabase RLS
Routes use `SUPABASE_SECRET_KEY` (service role) which bypasses RLS. Always filter by visibility/ownership manually:
```typescript
// Public query
.eq("is_public", true)

// Admin query — all recipes
// (no filter needed, but be explicit)
```

### Supabase Storage cache busting
After replacing a hero photo (same filename), append `?t=${Date.now()}` when setting state so the browser fetches fresh.

### params in route handlers
In Next.js 16, `params` is a Promise — must `await params`:
```typescript
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### Tags stored lowercase
`tag.toLowerCase().trim()` on insert and user input.

---

## Database Schema

| Table | Key columns |
|---|---|
| `recipes` | `id`, `title`, `source`, `source_url`, `hero_image_url`, `steps[]`, `cook_time`, `prep_time`, `servings`, `meal_type`, `notes`, `is_public` (bool, default false), `imported_via` |
| `ingredients` | `id`, `recipe_id`, `qty`, `unit`, `name` |
| `recipe_tags` | `recipe_id`, `tag` |
| `recipe_photos` | `id`, `recipe_id`, `url`, `is_hero` |
| `blog_posts` | `id`, `title`, `slug`, `body` (text/markdown), `excerpt`, `hero_image_url`, `published_at`, `created_at` |

No `user_id` needed — single owner. RLS can be permissive for reads, and routes enforce admin-only writes.

---

## Recipe Import Pipeline (from Mise)

```
POST /api/import
  ← url, text, source, fileBase64, fileMediaType
  1. Auth check (admin only)
  2. Build Claude message
  3. Claude extracts: title, source, cook_time, prep_time, servings,
     meal_type, ingredients[], steps[], tags[]
  4. If URL: extract og:image for hero_image_url
  5. Insert recipe row (is_public defaults to false)
  6. If image file: upload to Supabase Storage, set hero_image_url
  7. Insert ingredients + recipe_tags rows
  8. Return { recipeId }
```

---

## Contact Form

- Client-side form in `ContactForm.tsx`
- `POST /api/contact` — validates fields, sends email via Resend
- Env var: `RESEND_API_KEY`
- No database storage needed — email delivery is enough
- Fields: name, email, message, optionally "type of service" (dropdown)

---

## Blog Posts

- Body stored as plain markdown text in Supabase
- Rendered with a lightweight markdown renderer (e.g. `react-markdown`)
- Slug auto-generated from title on create (kebab-case, unique)
- No drafts MVP — published immediately on save
- Hero image optional — upload to Supabase Storage same pattern as recipes

---

## Style

Keep it warm, editorial, food-forward. Suggested palette (adjust to chef's brand):
- Cream background, dark warm text, one accent color
- Serif headings (`font-serif` — load via Google Fonts, e.g. Playfair Display or Cormorant)
- Generous whitespace

Colors TBD with chef — placeholder palette from Mise:
- Background: `#F5F0E8`
- Dark: `#3D2B1F`
- Accent: `#B85C38`
- Muted: `#9C7B5E`
- Border: `#DBC8A8`

---

## What's In Scope (MVP)

- ✅ Home page — hero, short bio, featured recipes, featured blog post
- ✅ Recipe grid (public) with search/filter
- ✅ Recipe detail — read-only public, edit controls for admin
- ✅ `is_public` toggle per recipe (admin only)
- ✅ AI recipe import (admin only)
- ✅ Blog index + post pages (public)
- ✅ Blog post create/edit/delete (admin only)
- ✅ Contact/inquiry form (public)
- ✅ Admin login via Auth0
- ✅ Nav with login/logout

## Out of Scope (for now)

- ⬜ Comments
- ⬜ Newsletter signup
- ⬜ 3 for 3 builder (Mise-specific feature)
- ⬜ Multiple admin users

---

## Git Setup

This repo uses a personal GitHub account with SSH multi-account config.

Remote should be set to:
```
git remote add origin git@github-personal:katieMarieDev/chef-site.git
```

Push with:
```
git push git@github-personal:katieMarieDev/chef-site.git main
```

Git user for commits:
```
git config user.name "katiemariedev"
git config user.email "<your personal email>"
```

---

## Known Gotchas

- Auth0 v4 is very different from v3 — don't follow v3 docs
- `proxy.ts` not `middleware.ts` for Auth0 v4 with Next.js 16
- Never `<Link>` for logout — use `<a>` (Next.js prefetch silently logs user out)
- `params` in route handlers is a Promise in Next.js 16 — must `await params`
- Supabase service role key bypasses RLS — always filter manually



---

*Last updated: May 2026*
