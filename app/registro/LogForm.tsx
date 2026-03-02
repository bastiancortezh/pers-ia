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
  const [logs, setLogs] = useState<Record<string, { sets: string; reps: string; duration: string }>>(
    () =>
      Object.fromEntries(
        exercises.map((ex) => [
          ex.id,
          {
            sets: String(ex.sets),
            reps: ex.reps != null ? String(ex.reps) : '',
            duration: ex.duration_sec != null ? String(ex.duration_sec) : '',
          },
        ])
      )
  )

  const update = (id: string, field: 'sets' | 'reps' | 'duration', value: string) =>
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
      {exercises.map((ex) => {
        const isTime = ex.exercise?.type === 'time'
        const targetLabel = isTime
          ? `Objetivo: ${ex.sets} × ${ex.duration_sec} seg`
          : `Objetivo: ${ex.sets} × ${ex.reps} reps`
        return (
          <Card key={ex.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{ex.exercise?.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{targetLabel}</p>
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
              {isTime ? (
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
              ) : (
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
              )}
            </CardContent>
          </Card>
        )
      })}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Guardando y ajustando...' : 'Guardar sesión'}
      </Button>
    </form>
  )
}
