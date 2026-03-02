import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { adjustNextSession } from '@/lib/ai'

interface LogEntry {
  routine_exercise_id: string
  sets_done: number
  reps_done: number | null
  duration_done: number | null
}

// Maps a day_of_week to the next training day (Mon=1, Wed=3, Fri=5 cycle)
function getNextTrainingDay(currentDay: number): number {
  if (currentDay === 1) return 3  // Mon → Wed
  if (currentDay === 3) return 5  // Wed → Fri
  if (currentDay === 5) return 1  // Fri → Mon (next week)
  // For non-standard days, advance by 2
  return currentDay + 2 > 7 ? (currentDay + 2) % 7 : currentDay + 2
}

export async function POST(req: NextRequest) {
  let body: { logs: LogEntry[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { logs } = body
  if (!Array.isArray(logs) || logs.length === 0) {
    return NextResponse.json({ error: 'logs must be a non-empty array' }, { status: 400 })
  }

  const todayStr = new Date().toISOString().split('T')[0]

  // 1. Save workout logs
  const logsToInsert = logs.map((l) => ({ ...l, logged_date: todayStr }))
  const { error: logError } = await supabase.from('workout_logs').insert(logsToInsert)
  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 })

  // 2. Fetch the planned exercises to build comparison context
  const routineExerciseIds = logs.map((l) => l.routine_exercise_id)
  const { data: planned } = await supabase
    .from('routine_exercises')
    .select('id, sets, reps, duration_sec, day_of_week, routine_id, exercise:exercises(name, type)')
    .in('id', routineExerciseIds)

  if (!planned?.length) {
    return NextResponse.json({ ok: true, advice: null })
  }

  // 3. Build comparison for Claude
  const comparison = {
    planned: planned.map((p) => ({
      exercise_name: (p.exercise as any)?.name ?? 'unknown',
      sets: p.sets,
      reps: p.reps,
      duration_sec: p.duration_sec,
    })),
    actual: logs.map((l) => {
      const p = planned.find((pl) => pl.id === l.routine_exercise_id)
      return {
        exercise_name: (p?.exercise as any)?.name ?? 'unknown',
        sets_done: l.sets_done,
        reps_done: l.reps_done,
        duration_done: l.duration_done,
      }
    }),
  }

  // 4. Call Claude for adjustments
  let aiResult: { adjustments: any[]; advice: string }
  try {
    aiResult = await adjustNextSession(comparison) as any
  } catch (err) {
    console.error('Claude adjustment failed:', err)
    // Non-fatal: save succeeded, just skip adjustment
    return NextResponse.json({ ok: true, advice: null })
  }

  // 5. Find next session's routine_exercises and update them
  const firstPlanned = planned[0]
  const nextDay = getNextTrainingDay(firstPlanned.day_of_week)

  const { data: nextExercises } = await supabase
    .from('routine_exercises')
    .select('id, exercise:exercises(name)')
    .eq('routine_id', firstPlanned.routine_id)
    .eq('day_of_week', nextDay)

  if (nextExercises?.length) {
    for (const adj of aiResult.adjustments ?? []) {
      const match = nextExercises.find(
        (ne) => (ne.exercise as any)?.name === adj.exercise_name
      )
      if (match) {
        const { error: updateError } = await supabase
          .from('routine_exercises')
          .update({
            sets: adj.sets,
            reps: adj.reps ?? null,
            duration_sec: adj.duration_sec ?? null,
            ai_adjusted: true,
            ai_reason: adj.reason ?? null,
          })
          .eq('id', match.id)
        if (updateError) {
          console.warn(`Failed to update exercise ${match.id}:`, updateError.message)
        }
      }
    }
  }

  return NextResponse.json({ ok: true, advice: aiResult.advice })
}
