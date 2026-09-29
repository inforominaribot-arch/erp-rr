// Script para crear el usuario administrador inicial en Supabase Auth
// Ejecutar con: node scripts/seed-admin.mjs

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://vbzznttbkbvglcrypirl.supabase.co"
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZienpudHRia2J2Z2xjcnlwaXJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYzOTIyMSwiZXhwIjoyMTA2MjE1MjIxfQ.fsbC0YK2HeIlwA-qoyVHmp4OMtoCB0xZjLFLThsZcOg"

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const usuarios = [
  {
    email: "admin@erp-rr.com",
    password: "Admin1976%",
    nombre: "Administrador General",
    rol: "ADMIN_GENERAL"
  },
  {
    email: "administracion@erp-rr.com",
    password: "Admin1976%",
    nombre: "Administración",
    rol: "ADMINISTRACION"
  },
  {
    email: "taller@erp-rr.com",
    password: "Admin1976%",
    nombre: "Taller",
    rol: "TALLER"
  },
  {
    email: "instalacion@erp-rr.com",
    password: "Admin1976%",
    nombre: "Instalación",
    rol: "INSTALACION"
  }
]

console.log("🌱 Creando usuarios iniciales...\n")

for (const usuario of usuarios) {
  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: usuario.email,
    password: usuario.password,
    email_confirm: true // confirmar email automáticamente
  })

  if (authError) {
    console.error(`❌ Error creando ${usuario.email}:`, authError.message)
    continue
  }

  // 2. Crear registro en tabla usuarios
  const { error: dbError } = await supabase
    .from("usuarios")
    .insert({
      id: crypto.randomUUID(),
      supabase_id: authData.user.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      activo: true,
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString()
    })

  if (dbError) {
    console.error(`❌ Error insertando en BD ${usuario.email}:`, dbError.message)
    continue
  }

  console.log(`✅ Usuario creado: ${usuario.email} (${usuario.rol})`)
}

console.log("\n🎉 Seed completado!")
console.log("\nCredenciales de acceso:")
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
for (const u of usuarios) {
  console.log(`${u.rol.padEnd(20)} → ${u.email}  /  ${u.password}`)
}
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
