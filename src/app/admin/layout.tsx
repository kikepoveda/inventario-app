import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Crear cliente
  let supabase
  try {
    supabase = await createClient()
  } catch (err) {
    console.error('Supabase Config Error in Admin:', err)
    return (
      <div className="p-10 text-center">
        <h1 className="text-red-600 font-bold">Error de Configuración</h1>
        <p>Configura las variables de entorno en Vercel.</p>
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
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('Error fetching admin profile:', error)
    } else {
      perfil = data
    }
  } catch (err) {
    console.error('Unexpected error in admin layout:', err)
  }

  // 4. Protección y Bypass de Admin
  const isAdminEmail = user.email?.toLowerCase() === 'kike.poveda@gmail.com'

  if (!isAdminEmail && (!perfil || perfil.role !== 'admin')) {
    redirect('/dashboard')
  }

  return (
    <DashboardShell
      userEmail={user.email}
      centroNombre="Panel de Administración"
      role="admin"
    >
      {children}
    </DashboardShell>
  )
}
