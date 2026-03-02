'use client'

import dynamic from 'next/dynamic'

const ResponsiveBar = dynamic(
  () => import('@nivo/bar').then((m) => m.ResponsiveBar),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Cargando...</div> }
)

interface Props {
  data: Record<string, { done: number; total: number }>
}

export default function CompletionBarChart({ data }: Props) {
  const entries = Object.entries(data).slice(-14)
  if (entries.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Sin datos aún
      </div>
    )
  }

  const chartData = entries.map(([date, v]) => ({
    date: date.slice(5), // MM-DD
    '%': v.total > 0 ? Math.round((v.done / v.total) * 100) : 100,
  }))

  return (
    <ResponsiveBar
      data={chartData}
      keys={['%']}
      indexBy="date"
      margin={{ top: 10, right: 10, bottom: 50, left: 45 }}
      padding={0.3}
      valueScale={{ type: 'linear', max: 100 }}
      colors={['hsl(var(--primary))']}
      borderRadius={4}
      axisBottom={{
        tickRotation: -40,
        legend: 'Fecha',
        legendOffset: 44,
        legendPosition: 'middle',
      }}
      axisLeft={{
        legend: '%',
        legendOffset: -35,
        legendPosition: 'middle',
      }}
      label={(d) => `${d.value}%`}
      labelSkipHeight={12}
      theme={{
        text: { fill: 'hsl(var(--foreground))' },
        grid: { line: { stroke: 'hsl(var(--border))' } },
        axis: { ticks: { text: { fill: 'hsl(var(--muted-foreground))' } } },
        labels: { text: { fill: 'hsl(var(--primary-foreground))' } },
      }}
    />
  )
}
