'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database'

export async function getCentros() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('centros')
      .select('*')
      .order('nombre')

    if (error) {
      console.error('Database error in getCentros:', error)
      return []
    }
    return data as Database['public']['Tables']['centros']['Row'][]
  } catch (err) {
    console.error('Unexpected error in getCentros:', err)
    return []
  }
}

export async function createCentro(nombre: string) {
  const supabase = await createClient()
  
  // 1. Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('Auth error in createCentro:', authError)
    throw new Error('No autorizado: Debes iniciar sesión')
  }

  // 2. Validar que el usuario sea admin
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const isAdminEmail = user.email?.toLowerCase() === 'kike.poveda@gmail.com'
  
  if (!isAdminEmail && (perfilError || perfil?.role !== 'admin')) {
    console.error('Unauthorized attempt to create center:', user.email)
    throw new Error('No tienes permisos de administrador global')
  }

  // 3. Validación de datos
  if (!nombre || nombre.trim().length < 3) {
    throw new Error('El nombre del centro debe tener al menos 3 caracteres')
  }

  // 4. Insertar
  console.log('Creating center:', nombre)
  const { data, error } = await supabase
    .from('centros')
    .insert({ nombre: nombre.trim() })
    .select()
    .single()

  if (error) {
    console.error('Database error in createCentro:', error)
    throw new Error(`Error al crear centro: ${error.message}`)
  }
  
  console.log('Center created successfully:', data.id)
  revalidatePath('/admin/centros')
  return data
}
export async function deleteCentro(id: string) {
  const supabase = await createClient()
  
  // 1. Verificar autenticación y rol admin
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('No autorizado')

  const isAdminEmail = user.email?.toLowerCase() === 'kike.poveda@gmail.com'
  
  if (!isAdminEmail) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (perfil?.role !== 'admin') throw new Error('No tienes permisos de administrador global')
  }

  // 2. Borrar
  const { error } = await supabase
    .from('centros')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Database error in deleteCentro:', error)
    throw new Error(`Error al eliminar centro: ${error.message}. Asegúrate de que no tenga usuarios ni datos asociados.`)
  }
  
  revalidatePath('/admin/centros')
}
