import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LogForm from './LogForm'
import type { RoutineExercise } from '@/types'

const repsExercise: RoutineExercise = {
  id: 'ex-1',
  routine_id: 'r-1',
  exercise_id: 'e-1',
  day_of_week: 1,
  sets: 3,
  reps: 10,
  duration_sec: null,
  order: 0,
  ai_adjusted: false,
  ai_reason: null,
  exercise: { id: 'e-1', name: 'Flexiones en tabla', type: 'reps', muscle_group: 'pecho' }
}

const timeExercise: RoutineExercise = {
  id: 'ex-2',
  routine_id: 'r-1',
  exercise_id: 'e-2',
  day_of_week: 1,
  sets: 3,
  reps: null,
  duration_sec: 30,
  order: 1,
  ai_adjusted: false,
  ai_reason: null,
  exercise: { id: 'e-2', name: 'Plancha frontal', type: 'time', muscle_group: 'core' }
}

describe('LogForm', () => {
  it('renders exercise name', () => {
    render(<LogForm exercises={[repsExercise]} onSubmit={vi.fn()} isLoading={false} />)
    expect(screen.getByText('Flexiones en tabla')).toBeInTheDocument()
  })

  it('shows target (3 × 10 reps) as context', () => {
    render(<LogForm exercises={[repsExercise]} onSubmit={vi.fn()} isLoading={false} />)
    expect(screen.getByText(/objetivo.*3.*10/i)).toBeInTheDocument()
  })

  it('calls onSubmit with log entries including sets and reps', async () => {
    const onSubmit = vi.fn()
    render(<LogForm exercises={[repsExercise]} onSubmit={onSubmit} isLoading={false} />)
    fireEvent.change(screen.getByLabelText(/series realizadas/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/reps realizadas/i), { target: { value: '8' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith([
        expect.objectContaining({ routine_exercise_id: 'ex-1', sets_done: 2, reps_done: 8, duration_done: null })
      ])
    )
  })

  it('shows duration field for time-based exercise', () => {
    render(<LogForm exercises={[timeExercise]} onSubmit={vi.fn()} isLoading={false} />)
    expect(screen.getByLabelText(/segundos realizados/i)).toBeInTheDocument()
  })

  it('disables button when isLoading', () => {
    render(<LogForm exercises={[repsExercise]} onSubmit={vi.fn()} isLoading={true} />)
    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled()
  })
})
