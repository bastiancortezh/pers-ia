import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import WeeklyVolumeChart from './WeeklyVolumeChart'
import CompletionBarChart from './CompletionBarChart'
import MuscleRadarChart from './MuscleRadarChart'
import { supabase } from '@/lib/supabase'

async function getStats() {
  // Fetch logs joined with routine exercise + exercise info
  const { data: logs } = await supabase
    .from('workout_logs')
    .select(`
      logged_date,
      sets_done,
      reps_done,
      routine_exercise:routine_exercises(
        id,
        routine_id,
        day_of_week,
        exercise:exercises(muscle_group)
      )
    `)
    .order('logged_date', { ascending: true })
    .limit(300)

  // Get planned exercise counts per (routine_id, day_of_week)
  const { data: plannedCounts } = await supabase
    .from('routine_exercises')
    .select('routine_id, day_of_week')

  // Build a map: "routineId-dayOfWeek" → count
  const plannedMap: Record<string, number> = {}
  for (const row of plannedCounts ?? []) {
    const key = `${row.routine_id}-${row.day_of_week}`
    plannedMap[key] = (plannedMap[key] ?? 0) + 1
  }

  const volumeByWeek: Record<string, number> = {}
  const completionByDate: Record<string, { done: number; total: number }> = {}
  const muscleVolume: Record<string, number> = {}

  for (const log of logs ?? []) {
    const routineExercise = log.routine_exercise as any
    const volume = log.sets_done * (log.reps_done ?? 1)
    const week = getWeekLabel(log.logged_date)
    volumeByWeek[week] = (volumeByWeek[week] ?? 0) + volume

    // Completion: use planned count from the routine for that day
    if (!completionByDate[log.logged_date]) {
      const key = `${routineExercise?.routine_id}-${routineExercise?.day_of_week}`
      const total = plannedMap[key] ?? 0
      completionByDate[log.logged_date] = { done: 0, total }
    }
    completionByDate[log.logged_date].done += 1

    const muscle = routineExercise?.exercise?.muscle_group ?? 'otro'
    muscleVolume[muscle] = (muscleVolume[muscle] ?? 0) + volume
  }

  return { volumeByWeek, completionByDate, muscleVolume }
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const year = d.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const diff = d.getTime() - startOfYear.getTime()
  const weekNum = Math.ceil((diff / (1000 * 60 * 60 * 24) + startOfYear.getDay() + 1) / 7)
  return `S${weekNum} ${year}`
}

export default async function HistorialPage() {
  const stats = await getStats()

  const totalSessions = Object.keys(stats.completionByDate).length
  const avgCompletion = totalSessions > 0
    ? Math.round(
        Object.values(stats.completionByDate).reduce((sum, v) => sum + (v.done / (v.total || 1)) * 100, 0) / totalSessions
      )
    : 0

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto space-y-4 pb-8">
      <div className="flex items-center gap-3 pt-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">←</Link>
        </Button>
        <h1 className="text-2xl font-bold">Historial</h1>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold">{totalSessions}</p>
            <p className="text-xs text-muted-foreground mt-1">Sesiones totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold">{avgCompletion}%</p>
            <p className="text-xs text-muted-foreground mt-1">Cumplimiento promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly volume line chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Volumen semanal</CardTitle>
          <p className="text-xs text-muted-foreground">Series × reps acumuladas por semana</p>
        </CardHeader>
        <CardContent>
          <div style={{ height: 220 }}>
            <WeeklyVolumeChart data={stats.volumeByWeek} />
          </div>
        </CardContent>
      </Card>

      {/* Daily completion bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cumplimiento diario</CardTitle>
          <p className="text-xs text-muted-foreground">Últimas 14 sesiones</p>
        </CardHeader>
        <CardContent>
          <div style={{ height: 200 }}>
            <CompletionBarChart data={stats.completionByDate} />
          </div>
        </CardContent>
      </Card>

      {/* Muscle group radar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Balance muscular</CardTitle>
          <p className="text-xs text-muted-foreground">Volumen por grupo muscular</p>
        </CardHeader>
        <CardContent>
          <div style={{ height: 280 }}>
            <MuscleRadarChart data={stats.muscleVolume} />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
