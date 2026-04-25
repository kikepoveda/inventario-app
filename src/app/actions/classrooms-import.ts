'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
export async function importAulasCSV(formData: FormData) {
  try {
    const file = formData.get('csv') as File
    if (!file) throw new Error('No se subió ningún archivo')

    const text = await file.text()
    
    // Parsing simple: un nombre por línea
    const names = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('data:text/csv')) // Limpiar posibles restos de URI
    
    if (names.length === 0) throw new Error('El archivo está vacío o no tiene el formato correcto')

  const supabase = await createClient()

  // 1. Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('No autorizado')

  // 2. Obtener centro_id
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('centro_id')
    .eq('id', user.id)
    .single()
  
  if (perfilError || !perfil?.centro_id) {
    console.error('Perfil error in importAulasCSV:', perfilError)
    throw new Error('Centro no encontrado')
  }

  // 3. Inserción masiva optimizada
  const { error } = await supabase
    .from('aulas')
    .insert(names.map(nombre => ({ 
      nombre, 
      centro_id: perfil.centro_id 
    })))

  if (error) {
    console.error('Database error in importAulasCSV:', error)
    throw new Error(`Error al importar aulas: ${error.message}`)
  }

  revalidatePath('/dashboard/aulas')
  } catch (err: any) {
    console.error('Import Error:', err)
    throw new Error(err.message || 'Error desconocido al importar')
  }
}
