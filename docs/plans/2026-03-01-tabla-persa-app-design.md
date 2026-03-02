# Tabla Persa App — Design Document

**Date:** 2026-03-01
**Status:** Approved

---

## Overview

Mobile-first web app for tracking and progressively improving workouts on a Persian board (tabla persa). The app generates personalized routines based on the user's weight/height, records daily workout results, compares them against the planned routine, and uses Claude AI to adjust the next session in real time.

Single-user app (no auth) backed by Supabase and deployed on Vercel.

---

## Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Framework    | Next.js 15 (App Router)             |
| Database     | Supabase (PostgreSQL)               |
| AI           | Claude API (`claude-sonnet-4-6`)    |
| UI           | shadcn/ui + Tailwind CSS v4         |
| Charts       | Nivo                                |
| Deploy       | Vercel                              |
| Repo         | GitHub (bastiancortezh/pers-ia)     |

---

## Git Workflow

```
main              ← production (Vercel auto-deploy)
  └── develop     ← integration branch, base for all features
        ├── feature/setup-inicial
        ├── feature/onboarding-perfil
        ├── feature/rutinas-base
        ├── feature/registro-diario
        ├── feature/comparativa-ai
        └── feature/graficos
```

- Every feature branch merges into `develop` via Pull Request
- `develop` → `main` only when stable
- Commits in English, descriptive

---

## Data Model

```sql
-- Single user profile
profiles
  id          uuid  PK
  weight_kg   float
  height_cm   float
  created_at  timestamp

-- Exercise catalog (Persian board exercises)
exercises
  id           uuid  PK
  name         text          -- e.g. "Flexiones en tabla"
  type         enum          -- 'reps' | 'time'
  muscle_group text          -- e.g. "pecho", "piernas"

-- Routine container (one per generation cycle)
routines
  id            uuid  PK
  week_number   int
  generated_at  timestamp
  ai_notes      text         -- AI reasoning for this routine

-- Planned exercises within a routine (mutable by AI)
routine_exercises
  id            uuid  PK
  routine_id    uuid  FK → routines
  exercise_id   uuid  FK → exercises
  day_of_week   int          -- 1–7
  sets          int
  reps          int          -- null if type='time'
  duration_sec  int          -- null if type='reps'
  order         int
  ai_adjusted   boolean      -- true if AI modified this entry
  ai_reason     text         -- Claude's explanation for the adjustment

-- What the user actually did each session
workout_logs
  id                   uuid  PK
  routine_exercise_id  uuid  FK → routine_exercises
  logged_date          date
  sets_done            int
  reps_done            int   -- null if time-based
  duration_done        int   -- null if reps-based
  notes                text
```

---

## Screen Flow

```
ONBOARDING (first launch)
  → Enter weight + height
  → Claude generates Week 1 routine

DASHBOARD (home)
  → Today's summary (% complete)
  → "Log workout" button
  → "View full routine" button

DAILY ROUTINE VIEW
  → List of exercises for today
  → Sets / reps / duration targets

DAILY LOG (per session)
  → Check off each exercise
  → Enter actual sets / reps / duration
  → On save → Claude compares plan vs real
              → Adjusts next session immediately

HISTORY / CHARTS
  → Line chart: weekly volume
  → Bar chart: daily completion %
  → Radar chart: muscle group balance
```

---

## AI Integration

### When Claude is called

| Trigger                    | Action                                                   |
|----------------------------|----------------------------------------------------------|
| Onboarding complete        | Generate full Week 1 routine from weight/height/zero XP |
| After each session is saved | Compare plan vs actual → rewrite next session's `routine_exercises` + write `ai_reason` |
| Every 4 weeks              | General progress review, increase difficulty if warranted |

### Claude prompt strategy

- System prompt includes: user profile (weight/height), full routine context, exercise catalog
- User turn includes: today's planned exercises + what was actually done
- Claude responds with: structured JSON (`{ adjustments: [...], advice: string }`)
- The app applies the JSON to update `routine_exercises` for the next session

---

## Folder Structure

```
/app
  /onboarding          ← weight/height setup
  /dashboard           ← home with daily summary
  /rutina              ← view today's routine
  /registro            ← log what you did
  /historial           ← charts and progress
/components            ← shadcn/ui + custom components
/lib
  supabase.ts
  claude.ts
/types
  index.ts
```

---

## Out of Scope (v1)

- Multi-user / authentication
- Push notifications / reminders
- Video demonstrations of exercises
- Native mobile app (iOS/Android)
