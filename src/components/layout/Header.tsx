import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Bars3Icon } from '@heroicons/react/24/outline'

export default function Header({ 
  userEmail, 
  centroNombre,
  onMenuClick
}: { 
  userEmail?: string, 
  centroNombre?: string,
  onMenuClick?: () => void
}) {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Abrir menú</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
          <div className="flex flex-col items-end">
            <span className="hidden sm:block text-sm font-semibold leading-6 text-gray-900">
              {userEmail}
            </span>
            <span className="text-xs text-gray-500">{centroNombre}</span>
          </div>
          <div className="h-6 w-px bg-gray-200" aria-hidden="true" />
          <button
            onClick={handleLogout}
            className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600"
          >
            {/* Solo icono en móvil pequeño si hace falta, o texto corto */}
            <span className="hidden sm:inline">Cerrar sesión</span>
            <span className="sm:hidden text-xs">Salir</span>
          </button>
        </div>
      </div>
    </header>
  )
}
