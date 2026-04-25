import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Crear cliente con manejo de errores de configuración
  let supabase
  try {
    supabase = await createClient()
  } catch (err) {
    console.error('Supabase Config Error:', err)
    return (
      <div className="p-10 text-center">
        <h1 className="text-red-600 font-bold">Error de Configuración</h1>
        <p>Las variables de entorno de Supabase no están configuradas correctamente en Vercel.</p>
      </div>
    )
  }

  // 2. Verificar usuario
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // 3. Obtener perfil
  let perfil = null
  let centro = null
  
  try {
    const { data: perfilData, error: perfilError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    
    if (perfilError) {
      console.error('Error fetching profile:', perfilError)
    } else if (perfilData) {
      perfil = perfilData
      
      if (perfil.centro_id) {
        const { data: centroData } = await supabase
          .from('centros')
          .select('nombre')
          .eq('id', perfil.centro_id)
          .maybeSingle()
        centro = centroData
      }
    }
  } catch (err) {
    console.error('Unexpected error in layout profile fetch:', err)
  }

  // 4. Manejo de perfil faltante o incompleto
  if (!perfil) {
    const isAdminEmail = user.email?.toLowerCase() === 'kike.poveda@gmail.com'
    
    if (isAdminEmail) {
      perfil = { role: 'admin', nombre: 'Kike (Admin)', centro_id: null }
    } else {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900">Perfil Incompleto</h2>
          <p className="mt-2 text-gray-600">
            Tu usuario (<span className="font-semibold">{user.email}</span>) no tiene un perfil configurado.
          </p>
          <div className="mt-6 flex gap-4">
            <a href="/dashboard" className="btn btn-primary">Reintentar</a>
            <a href="/login" className="btn border-gray-300 bg-white">Cerrar Sesión</a>
          </div>
        </div>
      )
    }
  }

  return (
    <DashboardShell 
      userEmail={user.email} 
      centroNombre={centro?.nombre || 'Sin centro asignado'} 
      role={perfil.role}
    >
      {children}
    </DashboardShell>
  )
}
