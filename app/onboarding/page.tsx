'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingForm from './OnboardingForm'

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (data: { weight_kg: number; height_cm: number }) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error en onboarding')
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <OnboardingForm onSubmit={handleSubmit} isLoading={isLoading} />
    </main>
  )
}
