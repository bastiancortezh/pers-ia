'use client'

import dynamic from 'next/dynamic'

const ResponsiveLine = dynamic(
  () => import('@nivo/line').then((m) => m.ResponsiveLine),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Cargando...</div> }
)

interface Props {
  data: Record<string, number>
}

export default function WeeklyVolumeChart({ data }: Props) {
  const entries = Object.entries(data)
  if (entries.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Sin datos aún
      </div>
    )
  }

  const chartData = [
    {
      id: 'Volumen',
      data: entries.map(([x, y]) => ({ x, y })),
    },
  ]

  return (
    <ResponsiveLine
      data={chartData}
      margin={{ top: 10, right: 20, bottom: 60, left: 50 }}
      xScale={{ type: 'point' }}
      yScale={{ type: 'linear', min: 0 }}
      curve="monotoneX"
      pointSize={8}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={2}
      pointBorderColor={{ from: 'serieColor' }}
      enableArea
      areaOpacity={0.15}
      axisBottom={{
        tickRotation: -40,
        legend: 'Semana',
        legendOffset: 50,
        legendPosition: 'middle',
      }}
      axisLeft={{
        legend: 'Volumen',
        legendOffset: -40,
        legendPosition: 'middle',
      }}
      colors={['hsl(var(--primary))']}
      theme={{
        text: { fill: 'hsl(var(--foreground))' },
        grid: { line: { stroke: 'hsl(var(--border))' } },
        axis: { ticks: { text: { fill: 'hsl(var(--muted-foreground))' } } },
      }}
    />
  )
}
