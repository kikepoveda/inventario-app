'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function importAulasCSV(formData: FormData) {
  const file = formData.get('csv') as File
  if (!file) throw new Error('No se subió ningún archivo')

  const text = await file.text()
  const rows = text.split('\n').filter(row => row.trim() !== '')
  
  // Asumimos formato simple: nombre
  const names = rows.map(row => row.trim())

  const supabase = await createClient()
  const { data: perfil } = await supabase.from('perfiles').select('centro_id').single()
  
  if (!perfil?.centro_id) throw new Error('Centro no encontrado')

  const { error } = await supabase
    .from('aulas')
    .insert(names.map(nombre => ({ nombre, centro_id: perfil.centro_id })))

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/aulas')
}
