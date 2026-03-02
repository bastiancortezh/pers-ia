import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const today = new Date()
  const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay()

  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .select('id')
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  if (routineError || !routine) return NextResponse.json([])

  const { data: exercises } = await supabase
    .from('routine_exercises')
    .select('*, exercise:exercises(*)')
    .eq('routine_id', routine.id)
    .eq('day_of_week', dayOfWeek)
    .order('order')

  return NextResponse.json(exercises ?? [])
}
