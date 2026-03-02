export const dynamic = 'force-dynamic'

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

  const { data: logs } = plannedIds.length
    ? await supabase
        .from('workout_logs')
        .select('routine_exercise_id')
        .in('routine_exercise_id', plannedIds)
        .eq('logged_date', todayStr)
    : { data: [] }

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
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-bold">
          Hoy — {data ? days[data.dayOfWeek] : '—'}
        </h1>
        <span className="text-sm text-muted-foreground">
          {data ? `Semana ${data.routine.week_number}` : ''}
        </span>
      </div>

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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nota del entrenador IA
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed">
            {data.routine.ai_notes}
          </CardContent>
        </Card>
      )}

      {data?.planned.length === 0 && (
        <Card>
          <CardContent className="pt-4 text-center text-muted-foreground">
            <p className="text-sm">No hay ejercicios programados para hoy.</p>
            <p className="text-xs mt-1">¡Día de descanso! 💪</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 pt-2">
        <Button asChild className="flex-1">
          <Link href="/rutina">Ver rutina</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/registro">Registrar sesión</Link>
        </Button>
      </div>

      <Button asChild variant="ghost" className="w-full">
        <Link href="/historial">Ver historial →</Link>
      </Button>
    </main>
  )
}
