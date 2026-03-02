'use client'

import dynamic from 'next/dynamic'

const ResponsiveRadar = dynamic(
  () => import('@nivo/radar').then((m) => m.ResponsiveRadar),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Cargando...</div> }
)

interface Props {
  data: Record<string, number>
}

export default function MuscleRadarChart({ data }: Props) {
  const entries = Object.entries(data)
  if (entries.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Sin datos aún
      </div>
    )
  }

  const chartData = entries.map(([muscle, volume]) => ({
    muscle,
    Volumen: volume,
  }))

  return (
    <ResponsiveRadar
      data={chartData}
      keys={['Volumen']}
      indexBy="muscle"
      margin={{ top: 50, right: 70, bottom: 50, left: 70 }}
      curve="linearClosed"
      borderWidth={2}
      gridLevels={4}
      gridShape="circular"
      dotSize={8}
      dotBorderWidth={2}
      fillOpacity={0.25}
      colors={['hsl(var(--primary))']}
      theme={{
        text: { fill: 'hsl(var(--foreground))' },
        grid: { line: { stroke: 'hsl(var(--border))' } },
      }}
    />
  )
}
