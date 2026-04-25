'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { revalidatePath } from 'next/cache'

export type AulaInsert = Database['public']['Tables']['aulas']['Insert']

export async function getAulas() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('aulas')
    .select('*')
    .order('nombre')

  if (error) throw new Error(error.message)
  return data as Database['public']['Tables']['aulas']['Row'][]
}

export async function createAula(nombre: string) {
  const supabase = await createClient()
  
  const { data: perfil } = await supabase.from('perfiles').select('centro_id').single()
  if (!perfil?.centro_id) throw new Error('No se encontró el centro del usuario')

  const { data, error } = await supabase
    .from('aulas')
    .insert({ nombre, centro_id: perfil.centro_id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/configuracion')
  return data
}

export async function deleteAula(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('aulas')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/configuracion')
}
