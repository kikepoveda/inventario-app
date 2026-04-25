'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Header({ userEmail, centroNombre }: { userEmail?: string, centroNombre?: string }) {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
              {userEmail}
            </span>
            <span className="text-xs text-gray-500">{centroNombre}</span>
          </div>
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />
          <button
            onClick={handleLogout}
            className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  )
}
