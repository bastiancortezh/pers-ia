import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import OnboardingForm from './OnboardingForm'

describe('OnboardingForm', () => {
  it('renders weight and height inputs', () => {
    render(<OnboardingForm onSubmit={vi.fn()} isLoading={false} />)
    expect(screen.getByLabelText(/peso/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/altura/i)).toBeInTheDocument()
  })

  it('calls onSubmit with weight and height as numbers', async () => {
    const onSubmit = vi.fn()
    render(<OnboardingForm onSubmit={onSubmit} isLoading={false} />)
    fireEvent.change(screen.getByLabelText(/peso/i), { target: { value: '75' } })
    fireEvent.change(screen.getByLabelText(/altura/i), { target: { value: '175' } })
    fireEvent.click(screen.getByRole('button', { name: /comenzar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ weight_kg: 75, height_cm: 175 }))
  })

  it('disables button when isLoading is true', () => {
    render(<OnboardingForm onSubmit={vi.fn()} isLoading={true} />)
    expect(screen.getByRole('button', { name: /generando/i })).toBeDisabled()
  })
})
