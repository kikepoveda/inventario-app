import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

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

  // 3. Obtener perfil con manejo de errores
  let perfil = null
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*, centros(nombre)')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('Error fetching profile in layout:', error)
    } else {
      perfil = data
    }
  } catch (err) {
    console.error('Unexpected error in layout profile fetch:', err)
  }

  // 4. Manejo de perfil faltante o incompleto
  if (!perfil) {
    // Si no hay perfil pero el usuario está en Auth, puede ser un Admin recién creado
    // o un error de sincronización. Intentamos ver si es admin por email.
    if (user.email === 'kike.poveda@gmail.com') {
      // Forzar visualización como admin provisional si es el correo del dueño
      perfil = { role: 'admin', nombre: 'Kike (Admin)', centro_id: null }
    } else {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900">Acceso Restringido</h2>
          <p className="mt-2 text-gray-600">Tu usuario no tiene un perfil configurado en el sistema.</p>
          <div className="mt-6">
            <a href="/login" className="btn btn-primary">Volver al Login</a>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar role={perfil.role} />
      </div>

      <div className="lg:pl-72">
        <Header 
          userEmail={user.email} 
          centroNombre={perfil.centros?.nombre || 'Sin centro asignado'} 
        />
        <main className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
