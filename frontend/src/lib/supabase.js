import { createClient } from '@supabase/supabase-js'

// Leer la configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Comprobar que tenemos los datos necesarios
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Falta configurar Supabase en el frontend')
}

// Crear el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true
  }
})
