import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL = 'claude-sonnet-4-6'

export interface GeneratedRoutineDay {
  day_of_week: number
  exercises: {
    exercise_name: string
    sets: number
    reps: number | null
    duration_sec: number | null
  }[]
}

export interface GeneratedRoutine {
  routine: GeneratedRoutineDay[]
  ai_notes: string
}

export interface SessionComparison {
  planned: { exercise_name: string; sets: number; reps: number | null; duration_sec: number | null }[]
  actual: { exercise_name: string; sets_done: number; reps_done: number | null; duration_done: number | null }[]
}

export async function generateInitialRoutine(profile: {
  weight_kg: number
  height_cm: number
}): Promise<GeneratedRoutine> {
  const prompt = `
Eres un entrenador personal experto en tabla persa. El usuario nunca ha hecho ejercicio antes.

Perfil:
- Peso: ${profile.weight_kg} kg
- Altura: ${profile.height_cm} cm

Genera una rutina de 3 días (lunes=1, miércoles=3, viernes=5) para la semana 1, con 3-4 ejercicios por día.
Usa SOLO ejercicios de esta lista: Flexiones en tabla, Flexiones diamante, Sentadilla en tabla,
Plancha frontal, Mountain climbers, Remo invertido en tabla, Superman en tabla, Pike push-up en tabla.

Responde ÚNICAMENTE con JSON válido con esta estructura exacta:
{
  "routine": [
    {
      "day_of_week": 1,
      "exercises": [
        { "exercise_name": "...", "sets": 2, "reps": 8, "duration_sec": null }
      ]
    }
  ],
  "ai_notes": "Breve explicación de la rutina (1-2 oraciones)"
}
`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as { text: string }).text
  // Strip markdown code blocks if Claude wraps the JSON
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(cleaned) as GeneratedRoutine
}

export async function adjustNextSession(comparison: SessionComparison) {
  const prompt = `
Eres un entrenador personal. Analiza lo que el usuario planificó vs lo que hizo hoy.

PLANIFICADO:
${JSON.stringify(comparison.planned, null, 2)}

REALIZADO:
${JSON.stringify(comparison.actual, null, 2)}

Ajusta la PRÓXIMA sesión basándote en el rendimiento. Si no completó los ejercicios, reduce ligeramente. Si superó el plan, aumenta moderadamente.

Responde ÚNICAMENTE con JSON válido:
{
  "adjustments": [
    {
      "exercise_name": "...",
      "sets": 3,
      "reps": 8,
      "duration_sec": null,
      "reason": "Explicación breve"
    }
  ],
  "advice": "Consejo motivador personalizado de 1-2 oraciones"
}
`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as { text: string }).text
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(cleaned)
}
