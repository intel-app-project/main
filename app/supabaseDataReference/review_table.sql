drop table if exists public.review;

create table public.review (
  id bigint generated always as identity primary key,
  member_id bigint not null references public.member("Id"),
  date text not null references public.schedule(date),
  mode text not null,
  message text not null,
  issues jsonb not null default '[]'::jsonb,
  baseline_metrics jsonb not null default '{}'::jsonb,
  recent_metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index review_member_date_uidx
  on public.review (member_id, date);

create index review_date_idx
  on public.review (date);
