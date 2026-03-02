'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import LogForm from './LogForm'
import type { RoutineExercise } from '@/types'

export default function RegistroPage() {
  const [exercises, setExercises] = useState<RoutineExercise[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [advice, setAdvice] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/today-exercises')
      .then((r) => r.json())
      .then(setExercises)
      .catch(() => setFetchError('No se pudieron cargar los ejercicios'))
  }, [])

  const handleSubmit = async (logs: any[]) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs }),
      })
      const data = await res.json()
      if (data.advice) {
        setAdvice(data.advice)
      } else {
        router.push('/dashboard')
      }
    } catch {
      setIsLoading(false)
    }
  }

  // Success state: show AI advice
  if (advice) {
    return (
      <main className="min-h-screen p-4 max-w-md mx-auto flex flex-col items-center justify-center space-y-4">
        <Card className="w-full">
          <CardContent className="pt-6 space-y-4 text-center">
            <div className="text-4xl">🎯</div>
            <p className="text-lg font-semibold">¡Sesión guardada!</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{advice}</p>
            <p className="text-xs text-muted-foreground">La próxima sesión ya fue ajustada.</p>
            <Button asChild className="w-full">
              <Link href="/dashboard">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-3 pt-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/rutina">←</Link>
        </Button>
        <h1 className="text-2xl font-bold">Registrar sesión</h1>
      </div>

      {fetchError && (
        <p className="text-sm text-destructive">{fetchError}</p>
      )}

      {exercises.length === 0 && !fetchError ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Cargando ejercicios...</p>
        </div>
      ) : (
        <LogForm exercises={exercises} onSubmit={handleSubmit} isLoading={isLoading} />
      )}
    </main>
  )
}
