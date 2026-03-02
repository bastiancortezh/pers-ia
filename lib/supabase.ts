import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL')
if (!supabaseAnonKey) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const USER_ID = process.env.USER_ID ?? 'a0000000-0000-0000-0000-000000000001'
