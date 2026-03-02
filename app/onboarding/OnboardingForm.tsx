'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface Props {
  onSubmit: (data: { weight_kg: number; height_cm: number }) => void
  isLoading: boolean
}

export default function OnboardingForm({ onSubmit, isLoading }: Props) {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ weight_kg: Number(weight), height_cm: Number(height) })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Bienvenido</CardTitle>
        <CardDescription>Ingresá tus datos para generar tu primera rutina personalizada.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="75"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              min={30}
              max={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Altura (cm)</Label>
            <Input
              id="height"
              type="number"
              placeholder="175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              required
              min={100}
              max={250}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Generando rutina...' : 'Comenzar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
