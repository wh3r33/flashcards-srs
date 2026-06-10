create extension if not exists "pgcrypto";

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) <= 160),
  description text default '',
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  front text not null,
  back text not null,
  card_type text not null default 'basic' check (card_type in ('basic', 'reverse', 'multiple_choice', 'cloze')),
  options jsonb not null default '[]'::jsonb,
  correct_answer text,
  category text,
  tags text[] not null default '{}',
  interval_days integer not null default 1 check (interval_days >= 1),
  next_review_at timestamptz not null default now(),
  ease_factor numeric(4,2) not null default 2.5 check (ease_factor >= 1.3),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  rating text not null check (rating in ('again', 'hard', 'normal', 'easy')),
  reviewed_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create index if not exists decks_user_id_idx on public.decks(user_id);
create index if not exists decks_public_idx on public.decks(is_public) where is_public = true;
create index if not exists cards_deck_id_idx on public.cards(deck_id);
create index if not exists cards_next_review_idx on public.cards(next_review_at);
create index if not exists cards_tags_idx on public.cards using gin(tags);
create index if not exists reviews_card_id_idx on public.reviews(card_id);
create index if not exists reviews_reviewed_at_idx on public.reviews(reviewed_at);

alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.reviews enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "read own or public decks" on public.decks;
create policy "read own or public decks"
on public.decks for select
using (is_public = true or auth.uid() = user_id);

drop policy if exists "create own decks" on public.decks;
create policy "create own decks"
on public.decks for insert
with check (auth.uid() = user_id);

drop policy if exists "update own decks" on public.decks;
create policy "update own decks"
on public.decks for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "delete own decks" on public.decks;
create policy "delete own decks"
on public.decks for delete
using (auth.uid() = user_id);

drop policy if exists "read cards from own or public decks" on public.cards;
create policy "read cards from own or public decks"
on public.cards for select
using (
  exists (
    select 1 from public.decks
    where decks.id = cards.deck_id
    and (decks.is_public = true or decks.user_id = auth.uid())
  )
);

drop policy if exists "create cards inside own decks" on public.cards;
create policy "create cards inside own decks"
on public.cards for insert
with check (
  exists (
    select 1 from public.decks
    where decks.id = cards.deck_id
    and decks.user_id = auth.uid()
  )
);

drop policy if exists "update cards inside own decks" on public.cards;
create policy "update cards inside own decks"
on public.cards for update
using (
  exists (
    select 1 from public.decks
    where decks.id = cards.deck_id
    and decks.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.decks
    where decks.id = cards.deck_id
    and decks.user_id = auth.uid()
  )
);

drop policy if exists "delete cards inside own decks" on public.cards;
create policy "delete cards inside own decks"
on public.cards for delete
using (
  exists (
    select 1 from public.decks
    where decks.id = cards.deck_id
    and decks.user_id = auth.uid()
  )
);

drop policy if exists "read reviews for own cards" on public.reviews;
create policy "read reviews for own cards"
on public.reviews for select
using (
  exists (
    select 1
    from public.cards
    join public.decks on decks.id = cards.deck_id
    where cards.id = reviews.card_id
    and decks.user_id = auth.uid()
  )
);

drop policy if exists "create reviews for own cards" on public.reviews;
create policy "create reviews for own cards"
on public.reviews for insert
with check (
  exists (
    select 1
    from public.cards
    join public.decks on decks.id = cards.deck_id
    where cards.id = reviews.card_id
    and decks.user_id = auth.uid()
  )
);

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
on public.profiles for select
using (auth.uid() = user_id);

drop policy if exists "upsert own profile" on public.profiles;
create policy "upsert own profile"
on public.profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
