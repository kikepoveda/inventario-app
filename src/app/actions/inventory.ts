'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { revalidatePath } from 'next/cache'

export type InventarioInsert = Database['public']['Tables']['inventario']['Insert']
export type InventarioUpdate = Database['public']['Tables']['inventario']['Update']

export async function getInventario() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventario')
    .select('*, aulas(nombre)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as (Database['public']['Tables']['inventario']['Row'] & { aulas: { nombre: string } | null })[]
}

export async function createInventarioItem(item: Omit<InventarioInsert, 'centro_id'>) {
  const supabase = await createClient()
  
  // Obtenemos el centro_id del usuario actual (seguridad extra, aunque RLS lo maneja)
  const { data: perfil } = await supabase.from('perfiles').select('centro_id').single()
  if (!perfil?.centro_id) throw new Error('No se encontró el centro del usuario')

  const { data, error } = await supabase
    .from('inventario')
    .insert({ ...item, centro_id: perfil.centro_id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/inventario')
  return data
}

export async function updateInventarioItem(id: string, item: InventarioUpdate) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventario')
    .update(item)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/inventario')
  return data
}

export async function deleteInventarioItem(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('inventario')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/inventario')
}
