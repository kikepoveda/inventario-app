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
  
  // 1. Verificar autenticación y rol admin
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('No autorizado')

  const isAdminEmail = user.email?.toLowerCase() === 'kike.poveda@gmail.com'

  if (!isAdminEmail) {
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (perfilError || perfil?.role !== 'admin') {
      throw new Error('No tienes permisos de administrador global')
    }
  }

  // 2. Insertar
  const { data, error } = await supabase
    .from('centros')
    .insert({ nombre })
    .select()
    .single()

  if (error) {
    console.error('Database error in createCentro:', error)
    throw new Error(`Error al crear centro: ${error.message}`)
  }
  
  revalidatePath('/admin/centros')
  return data
}
