'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { revalidatePath } from 'next/cache'

export type InventarioInsert = Database['public']['Tables']['inventario']['Insert']
export type InventarioUpdate = Database['public']['Tables']['inventario']['Update']

export async function getInventario() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('inventario')
      .select('*, aulas(nombre), centros(nombre)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error in getInventario:', error)
      return []
    }
    return data as (Database['public']['Tables']['inventario']['Row'] & { 
      aulas: { nombre: string } | null,
      centros: { nombre: string } | null 
    })[]
  } catch (err) {
    console.error('Unexpected error in getInventario:', err)
    return []
  }
}

export async function createInventarioItem(item: Omit<InventarioInsert, 'centro_id'>) {
  const supabase = await createClient()
  
  // 1. Verificar autenticación de forma segura
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('Auth error in createInventarioItem:', authError)
    throw new Error('No autorizado: Debes iniciar sesión')
  }

  // 2. Obtener centro_id del perfil del usuario
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('centro_id')
    .eq('id', user.id)
    .single()

  if (perfilError || !perfil?.centro_id) {
    console.error('Perfil error in createInventarioItem:', perfilError)
    throw new Error('Error de configuración: No se encontró el centro asociado a tu usuario')
  }

  // 3. Insertar con centro_id explícito
  const { data, error } = await supabase
    .from('inventario')
    .insert({ 
      ...item, 
      centro_id: perfil.centro_id 
    })
    .select()
    .single()

  if (error) {
    console.error('Database error in createInventarioItem:', error)
    throw new Error(`Error al crear item: ${error.message}`)
  }
  
  revalidatePath('/dashboard/inventario')
  return data
}

export async function updateInventarioItem(id: string, item: InventarioUpdate) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('No autorizado')

  const { data, error } = await supabase
    .from('inventario')
    .update(item)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Database error in updateInventarioItem:', error)
    throw new Error(`Error al actualizar item: ${error.message}`)
  }
  
  revalidatePath('/dashboard/inventario')
  return data
}

export async function deleteInventarioItem(id: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('No autorizado')

  const { error } = await supabase
    .from('inventario')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Database error in deleteInventarioItem:', error)
    throw new Error(`Error al eliminar item: ${error.message}`)
  }
  
  revalidatePath('/dashboard/inventario')
}
