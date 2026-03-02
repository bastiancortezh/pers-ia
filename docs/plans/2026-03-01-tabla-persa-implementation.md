# Tabla Persa App — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first web app that generates AI-powered progressive workout routines for a Persian board, records daily sessions, and adjusts the next session in real time using Claude.

**Architecture:** Next.js 15 App Router frontend with Supabase (PostgreSQL) as the database. Claude API is called on two occasions: initial routine generation (onboarding) and post-session adjustment. All data belongs to a single user identified by a fixed UUID stored in an env variable (no auth).

**Tech Stack:** Next.js 15, TypeScript, Supabase JS client, Anthropic SDK (`@anthropic-ai/sdk`), shadcn/ui, Tailwind CSS v4, Nivo charts, Vitest + React Testing Library.

---

## Branch Strategy

Every task group maps to a feature branch off `develop`. Merge to `develop` via PR when each group is complete.

```
develop
  ├── feature/setup-inicial          (Tasks 1–3)
  ├── feature/supabase-schema        (Task 4)
  ├── feature/onboarding             (Tasks 5–6)
  ├── feature/rutinas-base           (Tasks 7–8)
  ├── feature/registro-diario        (Tasks 9–10)
  ├── feature/ai-ajuste              (Task 11)
  └── feature/graficos               (Task 12)
```

---

## Task 1: Scaffold Next.js 15 project

**Branch:** `feature/setup-inicial`

**Files:**
- Create: (entire project root via CLI)

**Step 1: Create branch**

```bash
git checkout develop
git checkout -b feature/setup-inicial
```

**Step 2: Scaffold Next.js app**

Run in `C:\Users\bcort\Desktop\proyectos-claude\my-project`:

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --yes
```

Expected: project files created, `npm run dev` works at `localhost:3000`.

**Step 3: Install dependencies**

```bash
npm install @supabase/supabase-js @anthropic-ai/sdk
npm install @nivo/core @nivo/line @nivo/bar @nivo/radar
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Step 4: Install shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

Then add core components:

```bash
npx shadcn@latest add button card input label progress badge separator skeleton toast
```

**Step 5: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:

```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 6: Create `.env.local` template**

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_USER_ID=a0000000-0000-0000-0000-000000000001
```

Create `.env.local.example` with the same content (this one gets committed).

**Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: `localhost:3000` loads Next.js default page.

**Step 8: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js 15 project with shadcn/ui, Nivo, Supabase, Anthropic"
```

---

## Task 2: TypeScript types

**Branch:** `feature/setup-inicial` (same branch)

**Files:**
- Create: `types/index.ts`

**Step 1: Write types**

Create `types/index.ts`:

```typescript
export type ExerciseType = 'reps' | 'time'

export interface Profile {
  id: string
  weight_kg: number
  height_cm: number
  created_at: string
}

export interface Exercise {
  id: string
  name: string
  type: ExerciseType
  muscle_group: string
}

export interface Routine {
  id: string
  week_number: number
  generated_at: string
  ai_notes: string | null
}

export interface RoutineExercise {
  id: string
  routine_id: string
  exercise_id: string
  day_of_week: number // 1–7
  sets: number
  reps: number | null
  duration_sec: number | null
  order: number
  ai_adjusted: boolean
  ai_reason: string | null
  exercise?: Exercise
}

export interface WorkoutLog {
  id: string
  routine_exercise_id: string
  logged_date: string
  sets_done: number
  reps_done: number | null
  duration_done: number | null
  notes: string | null
}

export interface AIAdjustment {
  routine_exercise_id: string
  sets: number
  reps: number | null
  duration_sec: number | null
  reason: string
}

export interface AIAdjustmentResponse {
  adjustments: AIAdjustment[]
  advice: string
}
```

**Step 2: Write type tests**

Create `types/index.test.ts`:

```typescript
import { describe, it, expectTypeOf } from 'vitest'
import type { RoutineExercise, AIAdjustmentResponse } from './index'

describe('Types', () => {
  it('RoutineExercise allows null reps for time-based', () => {
    const ex: RoutineExercise = {
      id: '1', routine_id: '2', exercise_id: '3',
      day_of_week: 1, sets: 3, reps: null,
      duration_sec: 30, order: 1, ai_adjusted: false, ai_reason: null,
    }
    expectTypeOf(ex.reps).toEqualTypeOf<number | null>()
  })

  it('AIAdjustmentResponse has adjustments array and advice string', () => {
    expectTypeOf<AIAdjustmentResponse>().toHaveProperty('adjustments')
    expectTypeOf<AIAdjustmentResponse>().toHaveProperty('advice')
  })
})
```

**Step 3: Run tests**

```bash
npm run test:run
```

Expected: 2 tests pass.

**Step 4: Commit**

```bash
git add types/
git commit -m "feat: add TypeScript types for all domain entities"
```

---

## Task 3: Supabase client

**Branch:** `feature/setup-inicial` (same branch)

**Files:**
- Create: `lib/supabase.ts`

**Step 1: Write client**

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const USER_ID = process.env.NEXT_PUBLIC_USER_ID!
```

**Step 2: Write smoke test**

Create `lib/supabase.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}))

describe('supabase client', () => {
  it('exports supabase client and USER_ID', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
    process.env.NEXT_PUBLIC_USER_ID = 'test-user-id'

    const { supabase, USER_ID } = await import('./supabase')
    expect(supabase).toBeDefined()
    expect(USER_ID).toBe('test-user-id')
  })
})
```

**Step 3: Run tests**

```bash
npm run test:run
```

Expected: all tests pass.

**Step 4: Commit + open PR to develop**

```bash
git add lib/supabase.ts lib/supabase.test.ts
git commit -m "feat: add Supabase client"
git push -u origin feature/setup-inicial
```

Open PR: `feature/setup-inicial` → `develop` on GitHub. Merge it.

---

## Task 4: Supabase database schema

**Branch:** `feature/supabase-schema`

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/seed.sql`

**Step 1: Create branch**

```bash
git checkout develop && git pull
git checkout -b feature/supabase-schema
```

**Step 2: Write migration**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Profiles
create table profiles (
  id uuid primary key default gen_random_uuid(),
  weight_kg float not null,
  height_cm float not null,
  created_at timestamptz default now()
);

-- Exercises catalog
create type exercise_type as enum ('reps', 'time');

create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type exercise_type not null,
  muscle_group text not null
);

-- Routines
create table routines (
  id uuid primary key default gen_random_uuid(),
  week_number int not null,
  generated_at timestamptz default now(),
  ai_notes text
);

-- Routine exercises (mutable by AI)
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

-- Workout logs
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  routine_exercise_id uuid references routine_exercises(id) on delete cascade,
  logged_date date not null default current_date,
  sets_done int not null,
  reps_done int,
  duration_done int,
  notes text
);
```

**Step 3: Write seed data (exercise catalog)**

Create `supabase/seed.sql`:

```sql
insert into exercises (name, type, muscle_group) values
  ('Flexiones en tabla',         'reps', 'pecho'),
  ('Flexiones diamante',         'reps', 'triceps'),
  ('Flexiones arquero',          'reps', 'pecho'),
  ('Sentadilla en tabla',        'reps', 'piernas'),
  ('Zancada en tabla',           'reps', 'piernas'),
  ('Plancha frontal',            'time', 'core'),
  ('Plancha lateral',            'time', 'core'),
  ('Mountain climbers',          'reps', 'core'),
  ('Remo invertido en tabla',    'reps', 'espalda'),
  ('Superman en tabla',          'reps', 'espalda'),
  ('Dips en tabla',              'reps', 'triceps'),
  ('Curl de biceps en tabla',    'reps', 'biceps'),
  ('Pike push-up en tabla',      'reps', 'hombros'),
  ('Burpee en tabla',            'reps', 'full_body'),
  ('Extensión de cadera',        'reps', 'gluteos');
```

**Step 4: Apply schema and seed in Supabase dashboard**

Go to Supabase project → SQL Editor → run `001_initial_schema.sql`, then `seed.sql`.

Verify in Table Editor that `exercises` has 15 rows.

**Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema and exercise catalog seed"
git push -u origin feature/supabase-schema
```

Open PR: `feature/supabase-schema` → `develop`. Merge it.

---

## Task 5: Onboarding page — UI

**Branch:** `feature/onboarding`

**Files:**
- Create: `app/onboarding/page.tsx`
- Create: `app/onboarding/OnboardingForm.tsx`
- Create: `app/onboarding/OnboardingForm.test.tsx`

**Step 1: Create branch**

```bash
git checkout develop && git pull
git checkout -b feature/onboarding
```

**Step 2: Write failing component test**

Create `app/onboarding/OnboardingForm.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import OnboardingForm from './OnboardingForm'

describe('OnboardingForm', () => {
  it('renders weight and height inputs', () => {
    render(<OnboardingForm onSubmit={vi.fn()} isLoading={false} />)
    expect(screen.getByLabelText(/peso/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/altura/i)).toBeInTheDocument()
  })

  it('calls onSubmit with weight and height as numbers', async () => {
    const onSubmit = vi.fn()
    render(<OnboardingForm onSubmit={onSubmit} isLoading={false} />)
    fireEvent.change(screen.getByLabelText(/peso/i), { target: { value: '75' } })
    fireEvent.change(screen.getByLabelText(/altura/i), { target: { value: '175' } })
    fireEvent.click(screen.getByRole('button', { name: /comenzar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ weight_kg: 75, height_cm: 175 }))
  })

  it('disables button when isLoading is true', () => {
    render(<OnboardingForm onSubmit={vi.fn()} isLoading={true} />)
    expect(screen.getByRole('button', { name: /generando/i })).toBeDisabled()
  })
})
```

**Step 3: Run test — expect FAIL**

```bash
npm run test:run
```

Expected: FAIL — `OnboardingForm` not found.

**Step 4: Implement OnboardingForm**

Create `app/onboarding/OnboardingForm.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface Props {
  onSubmit: (data: { weight_kg: number; height_cm: number }) => void
  isLoading: boolean
}

export default function OnboardingForm({ onSubmit, isLoading }: Props) {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ weight_kg: Number(weight), height_cm: Number(height) })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Bienvenido</CardTitle>
        <CardDescription>Ingresá tus datos para generar tu primera rutina personalizada.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="75"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              min={30}
              max={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Altura (cm)</Label>
            <Input
              id="height"
              type="number"
              placeholder="175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              required
              min={100}
              max={250}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Generando rutina...' : 'Comenzar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

**Step 5: Run tests — expect PASS**

```bash
npm run test:run
```

Expected: 3 tests pass.

**Step 6: Create page**

Create `app/onboarding/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingForm from './OnboardingForm'

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (data: { weight_kg: number; height_cm: number }) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error en onboarding')
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <OnboardingForm onSubmit={handleSubmit} isLoading={isLoading} />
    </main>
  )
}
```

**Step 7: Commit**

```bash
git add app/onboarding/
git commit -m "feat: add onboarding page with weight/height form"
```

---

## Task 6: Claude integration — Routine generation

**Branch:** `feature/onboarding` (same)

**Files:**
- Create: `lib/claude.ts`
- Create: `lib/claude.test.ts`
- Create: `app/api/onboarding/route.ts`

**Step 1: Write failing test for Claude util**

Create `lib/claude.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ text: JSON.stringify({
          routine: [
            {
              day_of_week: 1,
              exercises: [
                { exercise_name: 'Flexiones en tabla', sets: 2, reps: 5, duration_sec: null }
              ]
            }
          ],
          ai_notes: 'Rutina inicial para principiante'
        }) }]
      })
    }
  }
}))

describe('generateInitialRoutine', () => {
  it('returns routine with ai_notes', async () => {
    const { generateInitialRoutine } = await import('./claude')
    const result = await generateInitialRoutine({ weight_kg: 75, height_cm: 175 })
    expect(result.ai_notes).toBe('Rutina inicial para principiante')
    expect(result.routine).toHaveLength(1)
    expect(result.routine[0].day_of_week).toBe(1)
  })
})

describe('adjustNextSession', () => {
  it('returns adjustments and advice', async () => {
    vi.mock('@anthropic-ai/sdk', () => ({
      default: class {
        messages = {
          create: vi.fn().mockResolvedValue({
            content: [{ text: JSON.stringify({
              adjustments: [],
              advice: 'Buen trabajo, mantené el ritmo'
            }) }]
          })
        }
      }
    }))
    const { adjustNextSession } = await import('./claude')
    const result = await adjustNextSession({ planned: [], actual: [] })
    expect(result.advice).toBeDefined()
    expect(Array.isArray(result.adjustments)).toBe(true)
  })
})
```

**Step 2: Run — expect FAIL**

```bash
npm run test:run
```

Expected: FAIL — `generateInitialRoutine` not found.

**Step 3: Implement lib/claude.ts**

Create `lib/claude.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL = 'claude-sonnet-4-6'

export interface GeneratedRoutineDay {
  day_of_week: number
  exercises: {
    exercise_name: string
    sets: number
    reps: number | null
    duration_sec: number | null
  }[]
}

export interface GeneratedRoutine {
  routine: GeneratedRoutineDay[]
  ai_notes: string
}

export interface SessionComparison {
  planned: { exercise_name: string; sets: number; reps: number | null; duration_sec: number | null }[]
  actual: { exercise_name: string; sets_done: number; reps_done: number | null; duration_done: number | null }[]
}

export async function generateInitialRoutine(profile: {
  weight_kg: number
  height_cm: number
}): Promise<GeneratedRoutine> {
  const prompt = `
Eres un entrenador personal experto en tabla persa. El usuario nunca ha hecho ejercicio antes.

Perfil:
- Peso: ${profile.weight_kg} kg
- Altura: ${profile.height_cm} cm

Genera una rutina de 3 días (lunes=1, miércoles=3, viernes=5) para la semana 1, con 3-4 ejercicios por día.
Usa SOLO ejercicios de esta lista: Flexiones en tabla, Flexiones diamante, Sentadilla en tabla,
Plancha frontal, Mountain climbers, Remo invertido en tabla, Superman en tabla, Pike push-up en tabla.

Responde ÚNICAMENTE con JSON válido con esta estructura exacta:
{
  "routine": [
    {
      "day_of_week": 1,
      "exercises": [
        { "exercise_name": "...", "sets": 2, "reps": 8, "duration_sec": null }
      ]
    }
  ],
  "ai_notes": "Breve explicación de la rutina (1-2 oraciones)"
}
`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as { text: string }).text
  return JSON.parse(text) as GeneratedRoutine
}

export async function adjustNextSession(comparison: SessionComparison) {
  const prompt = `
Eres un entrenador personal. Analiza lo que el usuario planificó vs lo que hizo hoy.

PLANIFICADO:
${JSON.stringify(comparison.planned, null, 2)}

REALIZADO:
${JSON.stringify(comparison.actual, null, 2)}

Ajusta la PRÓXIMA sesión basándote en el rendimiento. Si no completó los ejercicios, reduce ligeramente. Si superó el plan, aumenta.

Responde ÚNICAMENTE con JSON válido:
{
  "adjustments": [
    {
      "exercise_name": "...",
      "sets": 3,
      "reps": 8,
      "duration_sec": null,
      "reason": "Explicación breve"
    }
  ],
  "advice": "Consejo motivador personalizado de 1-2 oraciones"
}
`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as { text: string }).text
  return JSON.parse(text)
}
```

**Step 4: Run tests — expect PASS**

```bash
npm run test:run
```

Expected: all tests pass.

**Step 5: Create API route — onboarding**

Create `app/api/onboarding/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase, USER_ID } from '@/lib/supabase'
import { generateInitialRoutine } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const { weight_kg, height_cm } = await req.json()

  // 1. Save profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: USER_ID, weight_kg, height_cm })

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  // 2. Get exercise catalog
  const { data: exercises } = await supabase.from('exercises').select('*')
  if (!exercises) return NextResponse.json({ error: 'No exercises found' }, { status: 500 })

  // 3. Generate routine via Claude
  const generated = await generateInitialRoutine({ weight_kg, height_cm })

  // 4. Save routine
  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .insert({ week_number: 1, ai_notes: generated.ai_notes })
    .select()
    .single()

  if (routineError) return NextResponse.json({ error: routineError.message }, { status: 500 })

  // 5. Save routine_exercises
  const exerciseMap = Object.fromEntries(exercises.map((e) => [e.name, e]))
  const routineExercises = generated.routine.flatMap((day) =>
    day.exercises.map((ex, idx) => ({
      routine_id: routine.id,
      exercise_id: exerciseMap[ex.exercise_name]?.id,
      day_of_week: day.day_of_week,
      sets: ex.sets,
      reps: ex.reps,
      duration_sec: ex.duration_sec,
      order: idx,
    }))
  ).filter((ex) => ex.exercise_id)

  const { error: exError } = await supabase.from('routine_exercises').insert(routineExercises)
  if (exError) return NextResponse.json({ error: exError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
```

**Step 6: Commit**

```bash
git add lib/claude.ts lib/claude.test.ts app/api/onboarding/
git commit -m "feat: add Claude integration for initial routine generation"
git push -u origin feature/onboarding
```

Open PR: `feature/onboarding` → `develop`. Merge it.

---

## Task 7: Dashboard page

**Branch:** `feature/rutinas-base`

**Files:**
- Create: `app/dashboard/page.tsx`
- Create: `app/dashboard/DayProgress.tsx`
- Create: `app/dashboard/DayProgress.test.tsx`
- Modify: `app/page.tsx` (redirect to dashboard or onboarding)

**Step 1: Create branch**

```bash
git checkout develop && git pull
git checkout -b feature/rutinas-base
```

**Step 2: Write failing test for DayProgress**

Create `app/dashboard/DayProgress.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import DayProgress from './DayProgress'

describe('DayProgress', () => {
  it('shows 0% when no exercises done', () => {
    render(<DayProgress completed={0} total={5} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('shows 100% when all exercises done', () => {
    render(<DayProgress completed={5} total={5} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('shows correct partial percentage', () => {
    render(<DayProgress completed={2} total={4} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})
```

**Step 3: Run — expect FAIL**

```bash
npm run test:run
```

**Step 4: Implement DayProgress**

Create `app/dashboard/DayProgress.tsx`:

```typescript
import { Progress } from '@/components/ui/progress'

interface Props {
  completed: number
  total: number
}

export default function DayProgress({ completed, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Progreso del día</span>
        <span className="font-semibold text-foreground">{pct}%</span>
      </div>
      <Progress value={pct} className="h-3" />
      <p className="text-xs text-muted-foreground">{completed} de {total} ejercicios completados</p>
    </div>
  )
}
```

**Step 5: Run — expect PASS**

```bash
npm run test:run
```

**Step 6: Create Dashboard page**

Create `app/dashboard/page.tsx`:

```typescript
import { supabase, USER_ID } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DayProgress from './DayProgress'

async function getTodayData() {
  const today = new Date()
  const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay()
  const todayStr = today.toISOString().split('T')[0]

  const { data: routine } = await supabase
    .from('routines')
    .select('id, week_number, ai_notes')
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  if (!routine) return null

  const { data: planned } = await supabase
    .from('routine_exercises')
    .select('id, sets, reps, duration_sec, exercise:exercises(name, type, muscle_group)')
    .eq('routine_id', routine.id)
    .eq('day_of_week', dayOfWeek)
    .order('order')

  const plannedIds = (planned ?? []).map((p) => p.id)

  const { data: logs } = await supabase
    .from('workout_logs')
    .select('routine_exercise_id')
    .in('routine_exercise_id', plannedIds)
    .eq('logged_date', todayStr)

  return {
    routine,
    dayOfWeek,
    planned: planned ?? [],
    completedIds: (logs ?? []).map((l) => l.routine_exercise_id),
  }
}

export default async function DashboardPage() {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', USER_ID)
    .single()

  if (!profile) redirect('/onboarding')

  const data = await getTodayData()

  const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Hoy — {data ? days[data.dayOfWeek] : '—'}</h1>

      {data && (
        <Card>
          <CardContent className="pt-4">
            <DayProgress
              completed={data.completedIds.length}
              total={data.planned.length}
            />
          </CardContent>
        </Card>
      )}

      {data?.routine.ai_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Nota del entrenador</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{data.routine.ai_notes}</CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button asChild className="flex-1">
          <Link href="/rutina">Ver rutina de hoy</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/registro">Registrar sesión</Link>
        </Button>
      </div>

      <Button asChild variant="ghost" className="w-full">
        <Link href="/historial">Ver historial</Link>
      </Button>
    </main>
  )
}
```

**Step 7: Update root page to redirect**

Edit `app/page.tsx` — replace content with:

```typescript
import { redirect } from 'next/navigation'
export default function Home() {
  redirect('/dashboard')
}
```

**Step 8: Commit**

```bash
git add app/dashboard/ app/page.tsx
git commit -m "feat: add dashboard with daily progress"
```

---

## Task 8: Routine view page

**Branch:** `feature/rutinas-base` (same)

**Files:**
- Create: `app/rutina/page.tsx`
- Create: `app/rutina/ExerciseCard.tsx`
- Create: `app/rutina/ExerciseCard.test.tsx`

**Step 1: Write test for ExerciseCard**

Create `app/rutina/ExerciseCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExerciseCard from './ExerciseCard'

const repsExercise = {
  id: '1', sets: 3, reps: 10, duration_sec: null, order: 0,
  ai_adjusted: false, ai_reason: null,
  exercise: { name: 'Flexiones en tabla', type: 'reps' as const, muscle_group: 'pecho' }
}

const timeExercise = {
  id: '2', sets: 3, reps: null, duration_sec: 30, order: 1,
  ai_adjusted: false, ai_reason: null,
  exercise: { name: 'Plancha frontal', type: 'time' as const, muscle_group: 'core' }
}

describe('ExerciseCard', () => {
  it('shows reps for reps-based exercise', () => {
    render(<ExerciseCard exercise={repsExercise} />)
    expect(screen.getByText('3 series × 10 reps')).toBeInTheDocument()
  })

  it('shows duration for time-based exercise', () => {
    render(<ExerciseCard exercise={timeExercise} />)
    expect(screen.getByText('3 series × 30 seg')).toBeInTheDocument()
  })

  it('shows AI adjusted badge when ai_adjusted is true', () => {
    render(<ExerciseCard exercise={{ ...repsExercise, ai_adjusted: true, ai_reason: 'Ajustado por IA' }} />)
    expect(screen.getByText(/ajustado/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run — expect FAIL**

```bash
npm run test:run
```

**Step 3: Implement ExerciseCard**

Create `app/rutina/ExerciseCard.tsx`:

```typescript
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { RoutineExercise } from '@/types'

interface Props {
  exercise: RoutineExercise
}

export default function ExerciseCard({ exercise }: Props) {
  const target = exercise.exercise?.type === 'time'
    ? `${exercise.sets} series × ${exercise.duration_sec} seg`
    : `${exercise.sets} series × ${exercise.reps} reps`

  return (
    <Card>
      <CardContent className="pt-4 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{exercise.exercise?.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{exercise.exercise?.muscle_group}</p>
          </div>
          {exercise.ai_adjusted && (
            <Badge variant="secondary" className="shrink-0 text-xs">Ajustado IA</Badge>
          )}
        </div>
        <p className="text-sm font-medium">{target}</p>
        {exercise.ai_reason && (
          <p className="text-xs text-muted-foreground italic">{exercise.ai_reason}</p>
        )}
      </CardContent>
    </Card>
  )
}
```

**Step 4: Run — expect PASS**

```bash
npm run test:run
```

**Step 5: Create routine page**

Create `app/rutina/page.tsx`:

```typescript
import { supabase } from '@/lib/supabase'
import ExerciseCard from './ExerciseCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function RutinaPage() {
  const today = new Date()
  const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay()
  const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  const { data: routine } = await supabase
    .from('routines')
    .select('id')
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  const { data: exercises } = routine
    ? await supabase
        .from('routine_exercises')
        .select('*, exercise:exercises(*)')
        .eq('routine_id', routine.id)
        .eq('day_of_week', dayOfWeek)
        .order('order')
    : { data: [] }

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm"><Link href="/dashboard">←</Link></Button>
        <h1 className="text-2xl font-bold">Rutina — {days[dayOfWeek]}</h1>
      </div>

      {!exercises?.length ? (
        <p className="text-muted-foreground text-center py-8">No hay ejercicios para hoy. ¡Día de descanso!</p>
      ) : (
        <div className="space-y-3">
          {exercises.map((ex) => <ExerciseCard key={ex.id} exercise={ex as any} />)}
        </div>
      )}

      <Button asChild className="w-full">
        <Link href="/registro">Registrar sesión</Link>
      </Button>
    </main>
  )
}
```

**Step 6: Commit + PR**

```bash
git add app/rutina/ app/dashboard/
git commit -m "feat: add routine view with exercise cards"
git push -u origin feature/rutinas-base
```

Open PR: `feature/rutinas-base` → `develop`. Merge it.

---

## Task 9: Daily log page — UI

**Branch:** `feature/registro-diario`

**Files:**
- Create: `app/registro/page.tsx`
- Create: `app/registro/LogForm.tsx`
- Create: `app/registro/LogForm.test.tsx`

**Step 1: Create branch**

```bash
git checkout develop && git pull
git checkout -b feature/registro-diario
```

**Step 2: Write failing test**

Create `app/registro/LogForm.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LogForm from './LogForm'
import type { RoutineExercise } from '@/types'

const mockExercise: RoutineExercise = {
  id: 'ex-1',
  routine_id: 'r-1',
  exercise_id: 'e-1',
  day_of_week: 1,
  sets: 3,
  reps: 10,
  duration_sec: null,
  order: 0,
  ai_adjusted: false,
  ai_reason: null,
  exercise: { id: 'e-1', name: 'Flexiones en tabla', type: 'reps', muscle_group: 'pecho' }
}

describe('LogForm', () => {
  it('renders exercise name and target', () => {
    render(<LogForm exercises={[mockExercise]} onSubmit={vi.fn()} isLoading={false} />)
    expect(screen.getByText('Flexiones en tabla')).toBeInTheDocument()
    expect(screen.getByText(/3 × 10/)).toBeInTheDocument()
  })

  it('calls onSubmit with log entries on save', async () => {
    const onSubmit = vi.fn()
    render(<LogForm exercises={[mockExercise]} onSubmit={onSubmit} isLoading={false} />)
    fireEvent.change(screen.getByLabelText(/series realizadas/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/reps realizadas/i), { target: { value: '8' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith([
      expect.objectContaining({ routine_exercise_id: 'ex-1', sets_done: 2, reps_done: 8 })
    ]))
  })
})
```

**Step 3: Run — expect FAIL**

```bash
npm run test:run
```

**Step 4: Implement LogForm**

Create `app/registro/LogForm.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RoutineExercise } from '@/types'

interface LogEntry {
  routine_exercise_id: string
  sets_done: number
  reps_done: number | null
  duration_done: number | null
}

interface Props {
  exercises: RoutineExercise[]
  onSubmit: (logs: LogEntry[]) => void
  isLoading: boolean
}

export default function LogForm({ exercises, onSubmit, isLoading }: Props) {
  const [logs, setLogs] = useState<Record<string, { sets: string; reps: string; duration: string }>>(() =>
    Object.fromEntries(exercises.map((ex) => [ex.id, { sets: String(ex.sets), reps: String(ex.reps ?? ''), duration: String(ex.duration_sec ?? '') }]))
  )

  const update = (id: string, field: string, value: string) =>
    setLogs((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const entries: LogEntry[] = exercises.map((ex) => ({
      routine_exercise_id: ex.id,
      sets_done: Number(logs[ex.id]?.sets) || 0,
      reps_done: ex.exercise?.type === 'reps' ? Number(logs[ex.id]?.reps) || 0 : null,
      duration_done: ex.exercise?.type === 'time' ? Number(logs[ex.id]?.duration) || 0 : null,
    }))
    onSubmit(entries)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {exercises.map((ex) => (
        <Card key={ex.id}>
          <CardHeader>
            <CardTitle className="text-base">{ex.exercise?.name}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Objetivo: {ex.sets} × {ex.exercise?.type === 'time' ? `${ex.duration_sec} seg` : `${ex.reps} reps`}
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`sets-${ex.id}`}>Series realizadas</Label>
              <Input
                id={`sets-${ex.id}`}
                type="number"
                min={0}
                value={logs[ex.id]?.sets ?? ''}
                onChange={(e) => update(ex.id, 'sets', e.target.value)}
              />
            </div>
            {ex.exercise?.type === 'reps' ? (
              <div className="space-y-1">
                <Label htmlFor={`reps-${ex.id}`}>Reps realizadas</Label>
                <Input
                  id={`reps-${ex.id}`}
                  type="number"
                  min={0}
                  value={logs[ex.id]?.reps ?? ''}
                  onChange={(e) => update(ex.id, 'reps', e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor={`dur-${ex.id}`}>Segundos realizados</Label>
                <Input
                  id={`dur-${ex.id}`}
                  type="number"
                  min={0}
                  value={logs[ex.id]?.duration ?? ''}
                  onChange={(e) => update(ex.id, 'duration', e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Guardando y ajustando...' : 'Guardar sesión'}
      </Button>
    </form>
  )
}
```

**Step 5: Run — expect PASS**

```bash
npm run test:run
```

**Step 6: Commit**

```bash
git add app/registro/LogForm.tsx app/registro/LogForm.test.tsx
git commit -m "feat: add daily log form component"
```

---

## Task 10: Daily log — API and page

**Branch:** `feature/registro-diario` (same)

**Files:**
- Create: `app/registro/page.tsx`
- Create: `app/api/registro/route.ts`

**Step 1: Create API route**

Create `app/api/registro/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { adjustNextSession } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const { logs } = await req.json()
  const todayStr = new Date().toISOString().split('T')[0]

  // 1. Save workout logs
  const logsToInsert = logs.map((l: any) => ({ ...l, logged_date: todayStr }))
  const { error: logError } = await supabase.from('workout_logs').insert(logsToInsert)
  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 })

  // 2. Get planned exercises for context
  const routineExerciseIds = logs.map((l: any) => l.routine_exercise_id)
  const { data: planned } = await supabase
    .from('routine_exercises')
    .select('id, sets, reps, duration_sec, exercise:exercises(name, type)')
    .in('id', routineExerciseIds)

  if (!planned) return NextResponse.json({ ok: true, advice: null })

  // 3. Build comparison for Claude
  const comparison = {
    planned: planned.map((p) => ({
      exercise_name: (p.exercise as any)?.name,
      sets: p.sets,
      reps: p.reps,
      duration_sec: p.duration_sec,
    })),
    actual: logs.map((l: any) => {
      const p = planned.find((pl) => pl.id === l.routine_exercise_id)
      return {
        exercise_name: (p?.exercise as any)?.name,
        sets_done: l.sets_done,
        reps_done: l.reps_done,
        duration_done: l.duration_done,
      }
    }),
  }

  // 4. Call Claude for adjustments
  const aiResult = await adjustNextSession(comparison)

  // 5. Find next session's routine_exercises and update them
  const { data: firstPlanned } = await supabase
    .from('routine_exercises')
    .select('routine_id, day_of_week')
    .eq('id', routineExerciseIds[0])
    .single()

  if (firstPlanned) {
    const nextDay = firstPlanned.day_of_week === 5 ? 1
      : firstPlanned.day_of_week === 3 ? 5
      : firstPlanned.day_of_week === 1 ? 3
      : firstPlanned.day_of_week + 2

    const { data: nextExercises } = await supabase
      .from('routine_exercises')
      .select('id, exercise:exercises(name)')
      .eq('routine_id', firstPlanned.routine_id)
      .eq('day_of_week', nextDay)

    if (nextExercises) {
      for (const adj of aiResult.adjustments) {
        const match = nextExercises.find((ne) => (ne.exercise as any)?.name === adj.exercise_name)
        if (match) {
          await supabase
            .from('routine_exercises')
            .update({
              sets: adj.sets,
              reps: adj.reps,
              duration_sec: adj.duration_sec,
              ai_adjusted: true,
              ai_reason: adj.reason,
            })
            .eq('id', match.id)
        }
      }
    }
  }

  return NextResponse.json({ ok: true, advice: aiResult.advice })
}
```

**Step 2: Create registro page**

Create `app/registro/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import LogForm from './LogForm'
import type { RoutineExercise } from '@/types'

export default function RegistroPage() {
  const [exercises, setExercises] = useState<RoutineExercise[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [advice, setAdvice] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/today-exercises').then((r) => r.json()).then(setExercises)
  }, [])

  const handleSubmit = async (logs: any[]) => {
    setIsLoading(true)
    const res = await fetch('/api/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs }),
    })
    const data = await res.json()
    setIsLoading(false)
    if (data.advice) setAdvice(data.advice)
    else router.push('/dashboard')
  }

  if (advice) {
    return (
      <main className="min-h-screen p-4 max-w-md mx-auto space-y-4 flex flex-col items-center justify-center">
        <Card className="w-full">
          <CardContent className="pt-6 space-y-4">
            <p className="text-lg font-semibold text-center">Sesión guardada</p>
            <p className="text-sm text-center text-muted-foreground">{advice}</p>
            <Button asChild className="w-full"><Link href="/dashboard">Volver al inicio</Link></Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm"><Link href="/dashboard">←</Link></Button>
        <h1 className="text-2xl font-bold">Registrar sesión</h1>
      </div>
      <LogForm exercises={exercises} onSubmit={handleSubmit} isLoading={isLoading} />
    </main>
  )
}
```

**Step 3: Create helper API route for today's exercises**

Create `app/api/today-exercises/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const today = new Date()
  const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay()

  const { data: routine } = await supabase
    .from('routines')
    .select('id')
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  if (!routine) return NextResponse.json([])

  const { data: exercises } = await supabase
    .from('routine_exercises')
    .select('*, exercise:exercises(*)')
    .eq('routine_id', routine.id)
    .eq('day_of_week', dayOfWeek)
    .order('order')

  return NextResponse.json(exercises ?? [])
}
```

**Step 4: Commit + PR**

```bash
git add app/registro/ app/api/registro/ app/api/today-exercises/
git commit -m "feat: add daily log page and AI post-session adjustment"
git push -u origin feature/registro-diario
```

Open PR: `feature/registro-diario` → `develop`. Merge it.

---

## Task 11: History & charts

**Branch:** `feature/graficos`

**Files:**
- Create: `app/historial/page.tsx`
- Create: `app/historial/WeeklyVolumeChart.tsx`
- Create: `app/historial/CompletionBarChart.tsx`
- Create: `app/historial/MuscleRadarChart.tsx`
- Create: `app/api/stats/route.ts`

**Step 1: Create branch**

```bash
git checkout develop && git pull
git checkout -b feature/graficos
```

**Step 2: Create stats API**

Create `app/api/stats/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  // Last 8 weeks of workout logs joined with routine_exercises
  const { data: logs } = await supabase
    .from('workout_logs')
    .select('logged_date, sets_done, reps_done, duration_done, routine_exercise:routine_exercises(sets, reps, duration_sec, exercise:exercises(muscle_group))')
    .order('logged_date', { ascending: true })
    .limit(200)

  // Weekly volume (sets * reps per week)
  const volumeByWeek: Record<string, number> = {}
  // Completion by date
  const completionByDate: Record<string, { done: number; total: number }> = {}
  // Volume by muscle group
  const muscleVolume: Record<string, number> = {}

  for (const log of logs ?? []) {
    const week = getWeekLabel(log.logged_date)
    const volume = log.sets_done * (log.reps_done ?? 1)
    volumeByWeek[week] = (volumeByWeek[week] ?? 0) + volume

    if (!completionByDate[log.logged_date]) completionByDate[log.logged_date] = { done: 0, total: 0 }
    completionByDate[log.logged_date].done += 1

    const muscle = (log.routine_exercise as any)?.exercise?.muscle_group ?? 'otro'
    muscleVolume[muscle] = (muscleVolume[muscle] ?? 0) + volume
  }

  return NextResponse.json({ volumeByWeek, completionByDate, muscleVolume })
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const week = Math.ceil((d.getDate() - d.getDay() + 1) / 7)
  return `S${week} ${year}`
}
```

**Step 3: Create chart components**

Create `app/historial/WeeklyVolumeChart.tsx`:

```typescript
'use client'
import { ResponsiveLine } from '@nivo/line'

interface Props {
  data: Record<string, number>
}

export default function WeeklyVolumeChart({ data }: Props) {
  const chartData = [{
    id: 'Volumen',
    data: Object.entries(data).map(([x, y]) => ({ x, y }))
  }]

  return (
    <div style={{ height: 220 }}>
      <ResponsiveLine
        data={chartData}
        margin={{ top: 10, right: 20, bottom: 50, left: 50 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 0 }}
        curve="monotoneX"
        pointSize={8}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        enableArea
        areaOpacity={0.1}
        axisBottom={{ tickRotation: -35 }}
        theme={{ text: { fill: 'hsl(var(--foreground))' } }}
      />
    </div>
  )
}
```

Create `app/historial/CompletionBarChart.tsx`:

```typescript
'use client'
import { ResponsiveBar } from '@nivo/bar'

interface Props {
  data: Record<string, { done: number; total: number }>
}

export default function CompletionBarChart({ data }: Props) {
  const chartData = Object.entries(data).slice(-14).map(([date, v]) => ({
    date: date.slice(5),
    '%': v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
  }))

  return (
    <div style={{ height: 200 }}>
      <ResponsiveBar
        data={chartData}
        keys={['%']}
        indexBy="date"
        margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
        padding={0.3}
        maxValue={100}
        colors={['hsl(var(--primary))']}
        axisBottom={{ tickRotation: -35 }}
        theme={{ text: { fill: 'hsl(var(--foreground))' } }}
      />
    </div>
  )
}
```

Create `app/historial/MuscleRadarChart.tsx`:

```typescript
'use client'
import { ResponsiveRadar } from '@nivo/radar'

interface Props {
  data: Record<string, number>
}

export default function MuscleRadarChart({ data }: Props) {
  const chartData = Object.entries(data).map(([muscle, volume]) => ({
    muscle,
    Volumen: volume,
  }))

  return (
    <div style={{ height: 260 }}>
      <ResponsiveRadar
        data={chartData}
        keys={['Volumen']}
        indexBy="muscle"
        margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
        curve="linearClosed"
        borderWidth={2}
        gridLevels={4}
        gridShape="circular"
        dotSize={8}
        fillOpacity={0.25}
        theme={{ text: { fill: 'hsl(var(--foreground))' } }}
      />
    </div>
  )
}
```

**Step 4: Create historial page**

Create `app/historial/page.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import WeeklyVolumeChart from './WeeklyVolumeChart'
import CompletionBarChart from './CompletionBarChart'
import MuscleRadarChart from './MuscleRadarChart'

async function getStats() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000'}/api/stats`, {
    cache: 'no-store',
  })
  return res.json()
}

export default async function HistorialPage() {
  const stats = await getStats()

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm"><Link href="/dashboard">←</Link></Button>
        <h1 className="text-2xl font-bold">Historial</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Volumen semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyVolumeChart data={stats.volumeByWeek ?? {}} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cumplimiento diario (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <CompletionBarChart data={stats.completionByDate ?? {}} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Balance muscular</CardTitle>
        </CardHeader>
        <CardContent>
          <MuscleRadarChart data={stats.muscleVolume ?? {}} />
        </CardContent>
      </Card>
    </main>
  )
}
```

**Step 5: Commit + PR**

```bash
git add app/historial/ app/api/stats/
git commit -m "feat: add history page with Nivo line, bar, and radar charts"
git push -u origin feature/graficos
```

Open PR: `feature/graficos` → `develop`. Merge it.

---

## Task 12: Production deploy

**Branch:** `develop` → `main`

**Step 1: Set Vercel environment variables**

In Vercel dashboard → Project Settings → Environment Variables, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_USER_ID` (a fixed UUID, e.g. `a0000000-0000-0000-0000-000000000001`)

**Step 2: Connect GitHub repo to Vercel**

Vercel dashboard → Add New Project → Import `bastiancortezh/pers-ia` → Framework: Next.js → Deploy.

Set production branch to `main`, preview branch to `develop`.

**Step 3: Merge develop to main**

```bash
git checkout main
git merge develop
git push origin main
```

Vercel auto-deploys from `main`.

**Step 4: Verify production**

Open production URL → should redirect to `/onboarding` on first visit.

Complete onboarding → should land on `/dashboard`.

---

## Summary — Feature Branches

| Branch | Tasks | Key deliverable |
|--------|-------|-----------------|
| `feature/setup-inicial` | 1–3 | Next.js scaffold, deps, types, Supabase client |
| `feature/supabase-schema` | 4 | DB schema + 15 exercises seeded |
| `feature/onboarding` | 5–6 | Weight/height form + Claude routine generation |
| `feature/rutinas-base` | 7–8 | Dashboard + routine view |
| `feature/registro-diario` | 9–10 | Daily log + AI post-session adjustment |
| `feature/graficos` | 11 | Nivo charts (line, bar, radar) |
| Deploy | 12 | Vercel + env vars |
