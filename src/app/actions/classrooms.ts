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
    throw new Error('No autorizado: Debes iniciar sesión')
  }

  // 2. Obtener centro_id del perfil del usuario (CRÍTICO para RLS)
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('centro_id')
    .eq('id', user.id)
    .single()

  if (perfilError || !perfil?.centro_id) {
    console.error('Perfil error in createAula:', perfilError)
    throw new Error('Error de configuración: No se encontró un centro asociado a tu usuario. Contacta con el administrador.')
  }

  // 3. Validación de datos
  if (!nombre || nombre.trim().length < 2) {
    throw new Error('El nombre del aula debe tener al menos 2 caracteres')
  }

  // 4. Insertar con centro_id explícito
  console.log('Creating aula:', nombre, 'for centro:', perfil.centro_id)
  const { data, error } = await supabase
    .from('aulas')
    .insert({ 
      nombre: nombre.trim(), 
      centro_id: perfil.centro_id 
    })
    .select()
    .single()

  if (error) {
    console.error('Database error in createAula:', error)
    throw new Error(`Error al crear aula: ${error.message}`)
  }
  
  console.log('Aula created successfully:', data.id)
  revalidatePath('/dashboard/aulas')
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
}
