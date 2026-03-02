import { describe, it, expectTypeOf } from 'vitest'
import type { RoutineExercise, AIAdjustmentResponse } from './index'

describe('Types', () => {
  it('RoutineExercise allows null reps for time-based', () => {
    const ex: RoutineExercise = {
      id: '1', routine_id: '2', exercise_id: '3',
      day_of_week: 1, sets: 3, reps: null,
      duration_sec: 30, order: 1, ai_adjusted: false, ai_reason: null,
    }
    expectTypeOf(ex.reps).toEqualTypeOf<number | null>()
  })

  it('AIAdjustmentResponse has adjustments array and advice string', () => {
    expectTypeOf<AIAdjustmentResponse>().toHaveProperty('adjustments')
    expectTypeOf<AIAdjustmentResponse>().toHaveProperty('advice')
  })
})
