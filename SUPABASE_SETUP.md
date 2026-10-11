# Dyson Game Hub — Supabase Setup Guide

This file contains **every SQL statement** you need to run to get Dyson Game Hub's
database working. You do not need to write any SQL yourself — just copy,
paste, and run.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (free tier is enough).
2. Click **New Project**.
3. Choose a name (e.g. `gamehub`), set a database password (save it somewhere
   safe), pick a region close to your players, and click **Create new project**.
4. Wait 1–2 minutes for the project to finish provisioning.

## 2. Turn on Anonymous Sign-Ins

Dyson Game Hub lets anyone create or play a game instantly, without typing an email
or password. To do this safely (so a creator's games stay theirs), Dyson Game Hub
uses Supabase's built-in **anonymous authentication**.

1. In your Supabase project, go to **Authentication → Providers**.
2. Find **Anonymous Sign-Ins** and toggle it **ON**.
3. Save.

That's it — no extra configuration needed. If you skip this step, Dyson Game Hub
will still work, but it will fall back to a locally-generated ID stored in
the browser instead of a real Supabase auth session, which is slightly less
secure (see the Security Notes at the bottom).

## 3. Run the database SQL

Go to **SQL Editor** in the Supabase dashboard → **New query** → paste
**everything below** → click **Run**.

```sql
-- =========================================================
-- Dyson Game Hub database schema
-- =========================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------- users (lightweight profile, optional) ----------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- ---------- games ----------
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null,
  creator_name text not null,
  title text not null,
  game_type text not null check (game_type in
    ('who-knows-me','would-you-rather','truth-or-dare','general-knowledge')),
  share_code text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- questions (used by "Who Knows Me Better?") ----------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  option_a_image text,  -- optional image URL shown on this answer option
  option_b_image text,
  option_c_image text,
  option_d_image text,
  correct_answer smallint not null check (correct_answer between 0 and 3),
  question_order smallint not null default 1
);

-- ---------- players ----------
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  player_name text not null,
  created_at timestamptz not null default now()
);

-- ---------- results ----------
create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  player_id uuid references public.players (id) on delete set null,
  player_name text not null,
  score int not null,
  total_questions int not null,
  percentage int not null,
  time_taken int,
  created_at timestamptz not null default now()
);

-- ---------- game_sessions (Would You Rather / Truth or Dare analytics) ----------
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_type text not null,
  category text,
  question_key text not null,
  choice text not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Indexes
-- =========================================================
create index if not exists idx_games_creator_id   on public.games (creator_id);
create index if not exists idx_games_created_at    on public.games (created_at);
create unique index if not exists idx_games_share_code on public.games (share_code);
create index if not exists idx_questions_game_id   on public.questions (game_id);
create index if not exists idx_players_game_id     on public.players (game_id);
create index if not exists idx_results_game_id     on public.results (game_id);
create index if not exists idx_results_created_at  on public.results (created_at);
create index if not exists idx_sessions_qkey       on public.game_sessions (question_key);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.users          enable row level security;
alter table public.games          enable row level security;
alter table public.questions      enable row level security;
alter table public.players        enable row level security;
alter table public.results        enable row level security;
alter table public.game_sessions  enable row level security;

-- ---------- users ----------
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can upsert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- ---------- games ----------
-- Games are readable by anyone so a shared link/code can be opened by a
-- friend who isn't signed in as the creator. No sensitive data is stored
-- on this table.
create policy "Anyone can view games"
  on public.games for select
  using (true);

create policy "Signed-in users can create their own games"
  on public.games for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update their own games"
  on public.games for update
  using (auth.uid() = creator_id);

create policy "Creators can delete their own games"
  on public.games for delete
  using (auth.uid() = creator_id);

-- ---------- questions ----------
create policy "Anyone can view questions"
  on public.questions for select
  using (true);

create policy "Creators can add questions to their own games"
  on public.questions for insert
  with check (
    exists (
      select 1 from public.games g
      where g.id = questions.game_id and g.creator_id = auth.uid()
    )
  );

create policy "Creators can update questions on their own games"
  on public.questions for update
  using (
    exists (
      select 1 from public.games g
      where g.id = questions.game_id and g.creator_id = auth.uid()
    )
  );

create policy "Creators can delete questions on their own games"
  on public.questions for delete
  using (
    exists (
      select 1 from public.games g
      where g.id = questions.game_id and g.creator_id = auth.uid()
    )
  );

-- ---------- players ----------
create policy "Anyone can view players"
  on public.players for select
  using (true);

create policy "Anyone can join a game as a player"
  on public.players for insert
  with check (true);

-- ---------- results ----------
create policy "Anyone can view results (needed for leaderboards)"
  on public.results for select
  using (true);

create policy "Anyone can submit a result"
  on public.results for insert
  with check (true);

-- ---------- game_sessions ----------
create policy "Anyone can view session stats"
  on public.game_sessions for select
  using (true);

create policy "Anyone can log a session choice"
  on public.game_sessions for insert
  with check (true);
```

That's the whole schema. You can re-run this script safely — every
statement uses `if not exists` or will simply no-op if already applied
(policies will error if they already exist; drop them first with
`drop policy "name" on table_name;` if you ever need to re-create one).

### Already have an older version of this database?

If you ran an earlier version of this schema before answer-option images
were added, just run this small migration once instead of the whole
script above:

```sql
alter table public.questions add column if not exists option_a_image text;
alter table public.questions add column if not exists option_b_image text;
alter table public.questions add column if not exists option_c_image text;
alter table public.questions add column if not exists option_d_image text;
```

## 4. Get your API keys

1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL**.
3. Copy the **anon / public** key (do **not** copy the `service_role` key).

## 5. Paste them into Dyson Game Hub

Open `js/config.js` in the Dyson Game Hub folder and replace the two placeholder
values:

```js
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

Save the file — that's the only code change needed to connect Dyson Game Hub to
your own database.

## 6. Test it

Open `index.html` in a local server (see the main `README.md` for how) and
try creating a "Who Knows Me Better?" game. If everything is wired up
correctly, you'll see a real game code, and the homepage stats will start
counting up as people play.

---

## Notes on the schema design

- **UUID primary keys** are used everywhere (`gen_random_uuid()`), matching
  the "Recommended fields" from the project brief.
- **`share_code`** has a `unique` constraint (which Postgres backs with an
  index automatically) so two games can never collide.
- **`creator_id`** stores the anonymous (or signed-in) Supabase
  `auth.uid()` for the browser that created the game. Row Level Security
  policies use this to make sure only the creator can edit or delete their
  own games and questions.
- **General Knowledge, Would You Rather, and Truth or Dare** don't need a
  creator — their questions live directly in the front-end
  (`js/would-you-rather.js`, `js/truth-or-dare.js`, `js/general-knowledge.js`)
  so they work instantly with zero setup. Only `game_sessions` and
  `results` are written to Supabase for these games, to power the
  live statistics and leaderboards.
