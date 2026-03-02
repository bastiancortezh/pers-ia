import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}))

describe('supabase client', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.mock('@supabase/supabase-js', () => ({
      createClient: vi.fn(() => ({ from: vi.fn() })),
    }))
  })

  it('exports supabase client and USER_ID', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
    process.env.USER_ID = 'test-user-id'

    const { supabase, USER_ID } = await import('./supabase')
    expect(supabase).toBeDefined()
    expect(supabase.from).toBeDefined()
    expect(USER_ID).toBe('test-user-id')
  })
})
