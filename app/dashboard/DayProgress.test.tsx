import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import DayProgress from './DayProgress'

describe('DayProgress', () => {
  it('shows 0% when no exercises done', () => {
    render(<DayProgress completed={0} total={5} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('shows 100% when all exercises done', () => {
    render(<DayProgress completed={5} total={5} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('shows correct partial percentage', () => {
    render(<DayProgress completed={2} total={4} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows 0% when total is 0 (no exercises scheduled)', () => {
    render(<DayProgress completed={0} total={0} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})
