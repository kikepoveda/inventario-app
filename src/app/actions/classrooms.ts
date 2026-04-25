'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { revalidatePath } from 'next/cache'

export type AulaInsert = Database['public']['Tables']['aulas']['Insert']

export async function getAulas() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('aulas')
      .select('*')
      .order('nombre')

    if (error) {
      console.error('Database error in getAulas:', error)
      return []
    }
    return data as Database['public']['Tables']['aulas']['Row'][]
  } catch (err) {
    console.error('Unexpected error in getAulas:', err)
    return []
  }
}

export async function createAula(nombre: string) {
  const supabase = await createClient()
  
  // 1. Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('Auth error in createAula:', authError)
    throw new Error('No autorizado')
  }

  // 2. Obtener centro_id
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('centro_id')
    .eq('id', user.id)
    .single()

  if (perfilError || !perfil?.centro_id) {
    console.error('Perfil error in createAula:', perfilError)
    throw new Error('No se encontró el centro del usuario')
  }

  // 3. Insertar
  const { data, error } = await supabase
    .from('aulas')
    .insert({ nombre, centro_id: perfil.centro_id })
    .select()
    .single()

  if (error) {
    console.error('Database error in createAula:', error)
    throw new Error(`Error al crear aula: ${error.message}`)
  }
  
  revalidatePath('/dashboard/aulas')
  revalidatePath('/dashboard/configuracion')
  return data
}

export async function deleteAula(id: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('No autorizado')

  const { error } = await supabase
    .from('aulas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Database error in deleteAula:', error)
    throw new Error(`Error al eliminar aula: ${error.message}`)
  }
  
  revalidatePath('/dashboard/aulas')
  revalidatePath('/dashboard/configuracion')
}
