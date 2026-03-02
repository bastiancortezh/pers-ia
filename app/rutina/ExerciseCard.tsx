import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { RoutineExercise } from '@/types'

interface Props {
  exercise: RoutineExercise
}

export default function ExerciseCard({ exercise }: Props) {
  const isTime = exercise.exercise?.type === 'time'
  const target = isTime
    ? `${exercise.sets} series × ${exercise.duration_sec} seg`
    : `${exercise.sets} series × ${exercise.reps} reps`

  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p className="font-semibold leading-tight">{exercise.exercise?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {exercise.exercise?.muscle_group}
            </p>
          </div>
          {exercise.ai_adjusted && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Ajustado IA
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium text-foreground">{target}</p>
        {exercise.ai_reason && (
          <p className="text-xs text-muted-foreground italic">{exercise.ai_reason}</p>
        )}
      </CardContent>
    </Card>
  )
}
