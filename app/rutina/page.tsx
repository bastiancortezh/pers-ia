import { supabase } from '@/lib/supabase'
import ExerciseCard from './ExerciseCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { RoutineExercise } from '@/types'

export default async function RutinaPage() {
  const today = new Date()
  const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay()
  const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  const { data: routine } = await supabase
    .from('routines')
    .select('id, week_number')
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  const exercises: RoutineExercise[] = routine
    ? ((await supabase
        .from('routine_exercises')
        .select('*, exercise:exercises(*)')
        .eq('routine_id', routine.id)
        .eq('day_of_week', dayOfWeek)
        .order('order')).data ?? []) as RoutineExercise[]
    : []

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-3 pt-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">←</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{days[dayOfWeek]}</h1>
          {routine && (
            <p className="text-xs text-muted-foreground">Semana {routine.week_number}</p>
          )}
        </div>
      </div>

      {exercises.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground space-y-2">
          <p className="text-lg">🎉</p>
          <p>No hay ejercicios hoy.</p>
          <p className="text-sm">¡Día de descanso!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      )}

      {exercises.length > 0 && (
        <Button asChild className="w-full">
          <Link href="/registro">Registrar esta sesión →</Link>
        </Button>
      )}
    </main>
  )
}
