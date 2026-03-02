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
