'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database'

export async function getCentros() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('centros')
    .select('*')
    .order('nombre')

  if (error) throw new Error(error.message)
  return data as Database['public']['Tables']['centros']['Row'][]
}

export async function createCentro(nombre: string) {
  const supabase = await createClient()
  
  // Verificación de rol admin (opcional aquí si RLS ya lo hace)
  const { data: perfil } = await supabase.from('perfiles').select('role').single()
  if (perfil?.role !== 'admin') throw new Error('No autorizado')

  const { data, error } = await supabase
    .from('centros')
    .insert({ nombre })
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/centros')
  return data
}
