'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Papa from 'papaparse'

export async function importAulasCSV(formData: FormData) {
  const file = formData.get('csv') as File
  if (!file) throw new Error('No se subió ningún archivo')

  const text = await file.text()
  
  // Parsing robusto con Papaparse
  const parsed = Papa.parse(text, {
    header: false,
    skipEmptyLines: true,
  })

  if (parsed.errors.length > 0) {
    console.error('CSV Parsing errors:', parsed.errors)
    throw new Error('Error al leer el archivo CSV')
  }

  const names = (parsed.data as string[][]).map(row => row[0]?.trim()).filter(Boolean)
  if (names.length === 0) throw new Error('El archivo CSV está vacío o no tiene el formato correcto')

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
  revalidatePath('/dashboard/configuracion')
}
