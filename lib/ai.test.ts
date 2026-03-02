import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.resetModules()
})

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              routine: [
                {
                  day_of_week: 1,
                  exercises: [
                    { exercise_name: 'Flexiones en tabla', sets: 2, reps: 5, duration_sec: null }
                  ]
                }
              ],
              ai_notes: 'Rutina inicial para principiante'
            })
          }
        })
      }
    }
  }
}))

describe('generateInitialRoutine', () => {
  it('returns routine with ai_notes and at least 1 day', async () => {
    const { generateInitialRoutine } = await import('./ai')
    const result = await generateInitialRoutine({ weight_kg: 75, height_cm: 175 })
    expect(result.ai_notes).toBe('Rutina inicial para principiante')
    expect(result.routine).toHaveLength(1)
    expect(result.routine[0].day_of_week).toBe(1)
    expect(result.routine[0].exercises[0].exercise_name).toBe('Flexiones en tabla')
  })
})

describe('adjustNextSession', () => {
  it('returns adjustments array and advice string', async () => {
    vi.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: class {
        getGenerativeModel() {
          return {
            generateContent: vi.fn().mockResolvedValue({
              response: {
                text: () => JSON.stringify({
                  adjustments: [{ exercise_name: 'Flexiones en tabla', sets: 2, reps: 4, duration_sec: null, reason: 'Reducido' }],
                  advice: 'Buen trabajo'
                })
              }
            })
          }
        }
      }
    }))
    const { adjustNextSession } = await import('./ai')
    const result = await adjustNextSession({
      planned: [{ exercise_name: 'Flexiones en tabla', sets: 3, reps: 5, duration_sec: null }],
      actual: [{ exercise_name: 'Flexiones en tabla', sets_done: 2, reps_done: 3, duration_done: null }]
    })
    expect(result.advice).toBeDefined()
    expect(Array.isArray(result.adjustments)).toBe(true)
  })
})
