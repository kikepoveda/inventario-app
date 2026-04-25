'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  ArchiveBoxIcon, 
  AcademicCapIcon, 
  BuildingOfficeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Inventario', href: '/dashboard/inventario', icon: ArchiveBoxIcon },
  { name: 'Aulas', href: '/dashboard/aulas', icon: AcademicCapIcon },
]

const adminNavigation = [
  { name: 'Centros', href: '/admin/centros', icon: BuildingOfficeIcon },
  { name: 'Usuarios', href: '/admin/usuarios', icon: Cog6ToothIcon },
]

export default function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname()

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
      <div className="flex h-16 shrink-0 items-center">
        <span className="text-2xl font-bold text-primary-600">EduInv</span>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {(role === 'admin' ? [...navigation, ...adminNavigation] : navigation).map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`
                      group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                      ${pathname === item.href 
                        ? 'bg-gray-50 text-primary-600' 
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'}
                    `}
                  >
                    <item.icon
                      className={`h-6 w-6 shrink-0 ${pathname === item.href ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600'}`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  )
}
