import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExerciseCard from './ExerciseCard'
import type { RoutineExercise } from '@/types'

const repsExercise: RoutineExercise = {
  id: '1', routine_id: 'r1', exercise_id: 'e1',
  day_of_week: 1, sets: 3, reps: 10, duration_sec: null,
  order: 0, ai_adjusted: false, ai_reason: null,
  exercise: { id: 'e1', name: 'Flexiones en tabla', type: 'reps', muscle_group: 'pecho' }
}

const timeExercise: RoutineExercise = {
  id: '2', routine_id: 'r1', exercise_id: 'e2',
  day_of_week: 1, sets: 3, reps: null, duration_sec: 30,
  order: 1, ai_adjusted: false, ai_reason: null,
  exercise: { id: 'e2', name: 'Plancha frontal', type: 'time', muscle_group: 'core' }
}

describe('ExerciseCard', () => {
  it('shows exercise name', () => {
    render(<ExerciseCard exercise={repsExercise} />)
    expect(screen.getByText('Flexiones en tabla')).toBeInTheDocument()
  })

  it('shows sets x reps for reps-based exercise', () => {
    render(<ExerciseCard exercise={repsExercise} />)
    expect(screen.getByText('3 series × 10 reps')).toBeInTheDocument()
  })

  it('shows sets x duration for time-based exercise', () => {
    render(<ExerciseCard exercise={timeExercise} />)
    expect(screen.getByText('3 series × 30 seg')).toBeInTheDocument()
  })

  it('shows AI adjusted badge when ai_adjusted is true', () => {
    const adjusted = { ...repsExercise, ai_adjusted: true, ai_reason: 'Ajustado por bajo rendimiento' }
    render(<ExerciseCard exercise={adjusted} />)
    expect(screen.getByText(/ajustado ia/i)).toBeInTheDocument()
  })

  it('shows ai_reason when present', () => {
    const adjusted = { ...repsExercise, ai_adjusted: true, ai_reason: 'Reducido por fatiga' }
    render(<ExerciseCard exercise={adjusted} />)
    expect(screen.getByText('Reducido por fatiga')).toBeInTheDocument()
  })
})
