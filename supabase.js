import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cnjsjkbzxkuxbtlaihcu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuanNqa2J6eGt1eGJ0bGFpaGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxOTg0MzUsImV4cCI6MjA4Mzc3NDQzNX0.Gimax1ipVF8twLRMMYBcf-LpvNroVzNKOyx3L33iugM'

export const supabase = createClient(supabaseUrl, supabaseKey)
