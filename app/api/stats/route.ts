import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface StatsResult {
  volumeByWeek: Record<string, number>
  completionByDate: Record<string, { done: number; total: number }>
  muscleVolume: Record<string, number>
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const year = d.getFullYear()
  // ISO week number approximation
  const startOfYear = new Date(year, 0, 1)
  const diff = d.getTime() - startOfYear.getTime()
  const weekNum = Math.ceil((diff / (1000 * 60 * 60 * 24) + startOfYear.getDay() + 1) / 7)
  return `S${weekNum} ${year}`
}

export async function GET() {
  const { data: logs } = await supabase
    .from('workout_logs')
    .select(`
      logged_date,
      sets_done,
      reps_done,
      duration_done,
      routine_exercise:routine_exercises(
        sets,
        reps,
        duration_sec,
        exercise:exercises(muscle_group)
      )
    `)
    .order('logged_date', { ascending: true })
    .limit(300)

  const result: StatsResult = {
    volumeByWeek: {},
    completionByDate: {},
    muscleVolume: {},
  }

  for (const log of logs ?? []) {
    // Volume = sets_done × reps_done (or 1 for time-based, since we track sets × duration elsewhere)
    const volume = log.sets_done * (log.reps_done ?? 1)
    const week = getWeekLabel(log.logged_date)
    result.volumeByWeek[week] = (result.volumeByWeek[week] ?? 0) + volume

    // Completion: count how many logs exist per date
    if (!result.completionByDate[log.logged_date]) {
      result.completionByDate[log.logged_date] = { done: 0, total: 0 }
    }
    result.completionByDate[log.logged_date].done += 1

    // Muscle volume
    const muscle = (log.routine_exercise as any)?.exercise?.muscle_group ?? 'otro'
    result.muscleVolume[muscle] = (result.muscleVolume[muscle] ?? 0) + volume
  }

  return NextResponse.json(result)
}
