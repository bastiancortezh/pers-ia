-- Profiles (one row per user)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  weight_kg float not null,
  height_cm float not null,
  created_at timestamptz default now()
);

-- Exercise type enum
create type exercise_type as enum ('reps', 'time');

-- Exercise catalog (Persian board exercises)
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type exercise_type not null,
  muscle_group text not null
);

-- Routine containers
create table routines (
  id uuid primary key default gen_random_uuid(),
  week_number int not null,
  generated_at timestamptz default now(),
  ai_notes text
);

-- Planned exercises within a routine (mutable by AI)
create table routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references routines(id) on delete cascade,
  exercise_id uuid references exercises(id),
  day_of_week int not null check (day_of_week between 1 and 7),
  sets int not null,
  reps int,
  duration_sec int,
  "order" int not null default 0,
  ai_adjusted boolean not null default false,
  ai_reason text
);

-- What the user actually did each session
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  routine_exercise_id uuid references routine_exercises(id) on delete cascade,
  logged_date date not null default current_date,
  sets_done int not null,
  reps_done int,
  duration_done int,
  notes text
);
