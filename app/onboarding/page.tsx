'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingForm from './OnboardingForm'

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (data: { weight_kg: number; height_cm: number }) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        const msg = json?.error ?? `Error ${res.status}`
        console.error('Onboarding error:', msg)
        setError(msg)
        setIsLoading(false)
        return
      }
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      setError('Error de conexión')
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-3">
        <OnboardingForm onSubmit={handleSubmit} isLoading={isLoading} />
        {error && (
          <p className="text-sm text-destructive text-center px-2">{error}</p>
        )}
      </div>
    </main>
  )
}
