'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function inviteUser(email: string, nombre: string, role: 'admin' | 'centro', password?: string, centro_id?: string) {
  const supabase = await createClient()
  const supabaseAdmin = await createAdminClient()
  
  // 1. Verificar permisos del solicitante (debe ser admin)
  const { data: { user } } = await supabase.auth.getUser()
  const isAdminEmail = user?.email?.toLowerCase() === 'kike.poveda@gmail.com'
  
  if (!isAdminEmail) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', user?.id)
      .single()
    
    if (perfil?.role !== 'admin') {
      console.error('Unauthorized user creation attempt by:', user?.email)
      throw new Error('No autorizado')
    }
  }

  // Validaciones
  if (!email || !email.includes('@')) throw new Error('Email inválido')
  if (!nombre) throw new Error('Nombre obligatorio')
  if (!password || password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')

  // 2. Crear usuario en Auth (Solo Admin Client puede hacer esto)
  console.log('Creating user in auth:', email, 'with role:', role)
  const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre }
  })

  if (authError) {
    console.error('Auth admin error:', authError)
    throw new Error(`Error en Auth: ${authError.message}`)
  }

  // 3. Actualizar perfil (El trigger inicial lo crea como 'centro', lo corregimos si es 'admin' o asignamos centro)
  const { error: perfilError } = await supabaseAdmin
    .from('perfiles')
    .update({ 
      role, 
      centro_id: centro_id || null, 
      nombre 
    })
    .eq('id', userData.user.id)

  if (perfilError) {
    console.error('Profile update error:', perfilError)
    // Intentamos limpiar el usuario de Auth si falla el perfil para mantener sincronización
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id)
    throw new Error(`Error al configurar perfil: ${perfilError.message}`)
  }

  console.log('User created successfully:', userData.user.id)
  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()
  const supabaseAdmin = await createAdminClient()

  // 1. Verificar permisos
  const { data: { user } } = await supabase.auth.getUser()
  const isAdminEmail = user?.email?.toLowerCase() === 'kike.poveda@gmail.com'
  
  if (!isAdminEmail) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', user?.id)
      .single()
    
    if (perfil?.role !== 'admin') throw new Error('No autorizado para borrar usuarios')
  }

  // No permitirse borrar a sí mismo si es el único admin
  if (userId === user?.id) throw new Error('No puedes eliminar tu propia cuenta')

  // 2. Borrar de Auth (esto debería disparar el borrado en cascada del perfil si está bien configurada la FK)
  // Pero lo hacemos manual para asegurar sincronización
  console.log('Deleting user:', userId)
  
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (authError) {
    console.error('Error deleting user from auth:', authError)
    throw new Error(`Error al borrar de Auth: ${authError.message}`)
  }

  // El perfil se borrará por la FK "ON DELETE CASCADE" que definimos en la migración
  
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
