import { NextRequest, NextResponse } from 'next/server'
import { supabase, USER_ID } from '@/lib/supabase'
import { generateInitialRoutine } from '@/lib/ai'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { weight_kg, height_cm } = body

  if (typeof weight_kg !== 'number' || typeof height_cm !== 'number') {
    return NextResponse.json(
      { error: 'weight_kg and height_cm must be numbers' },
      { status: 400 }
    )
  }

  // 1. Save profile (upsert — safe to call multiple times)
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: USER_ID, weight_kg, height_cm })

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  // 2. Get exercise catalog
  const { data: exercises, error: exCatalogError } = await supabase
    .from('exercises')
    .select('*')

  if (exCatalogError || !exercises?.length) {
    return NextResponse.json({ error: 'No exercises found in catalog' }, { status: 500 })
  }

  // 3. Generate routine via Gemini
  let generated
  try {
    generated = await generateInitialRoutine({ weight_kg, height_cm })
  } catch (aiError) {
    const msg = aiError instanceof Error ? aiError.message : String(aiError)
    console.error('Gemini error:', msg)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  // 4. Save routine
  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .insert({ week_number: 1, ai_notes: generated.ai_notes })
    .select()
    .single()

  if (routineError || !routine) {
    return NextResponse.json({ error: routineError?.message ?? 'Failed to save routine' }, { status: 500 })
  }

  // 5. Map exercise names to IDs and save routine_exercises
  const exerciseMap = Object.fromEntries(exercises.map((e) => [e.name, e.id]))

  const routineExercises = generated.routine.flatMap((day) =>
    day.exercises
      .map((ex, idx) => ({
        routine_id: routine.id,
        exercise_id: exerciseMap[ex.exercise_name],
        day_of_week: day.day_of_week,
        sets: ex.sets,
        reps: ex.reps,
        duration_sec: ex.duration_sec,
        order: idx,
      }))
      .filter((ex) => ex.exercise_id != null)
  )

  const droppedNames = generated.routine.flatMap((day) =>
    day.exercises
      .filter((ex) => !exerciseMap[ex.exercise_name])
      .map((ex) => ex.exercise_name)
  )
  if (droppedNames.length > 0) {
    console.warn('Onboarding: Claude used unknown exercise names:', droppedNames)
  }

  const { error: routineExError } = await supabase
    .from('routine_exercises')
    .insert(routineExercises)

  if (routineExError) {
    return NextResponse.json({ error: routineExError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, routine_id: routine.id })
}
