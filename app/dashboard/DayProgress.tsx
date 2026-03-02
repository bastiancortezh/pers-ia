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
      <p className="text-xs text-muted-foreground">
        {completed} de {total} ejercicios completados
      </p>
    </div>
  )
}
