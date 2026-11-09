require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

// Obtener la configuración desde el archivo .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

// Comprobar que las variables estén configuradas
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Falta configurar Supabase en el archivo .env");
}

// Crear la conexión con Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

module.exports = supabase;
