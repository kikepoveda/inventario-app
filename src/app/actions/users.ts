'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function createAdminClient() {
  const cookieStore = await cookies()
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('La variable SUPABASE_SERVICE_ROLE_KEY no está configurada en Vercel')
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function inviteUser(email: string, nombre: string, role: 'admin' | 'centro', centro_id?: string) {
  const supabaseAdmin = await createAdminClient()
  
  // 1. Verificar permisos (Bypass para el dueño)
  const { data: { user } } = await supabaseAdmin.auth.getUser()
  const isAdminEmail = user?.email?.toLowerCase() === 'kike.poveda@gmail.com'
  
  if (!isAdminEmail) {
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('role')
      .eq('id', user?.id)
      .single()
    
    if (perfil?.role !== 'admin') throw new Error('No autorizado')
  }

  // 2. Crear usuario en Auth
  const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'password123', // Contraseña temporal
    email_confirm: true,
    user_metadata: { nombre }
  })

  if (authError) throw new Error(`Error en Auth: ${authError.message}`)

  // 2. Actualizar perfil (el trigger ya crea uno básico, pero lo actualizamos)
  const { error: perfilError } = await supabaseAdmin
    .from('perfiles')
    .update({ 
      role, 
      centro_id, 
      nombre 
    })
    .eq('id', userData.user.id)

  if (perfilError) throw new Error(`Error en Perfil: ${perfilError.message}`)

  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function getUsuarios() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('perfiles')
    .select('*, centros(nombre)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}
