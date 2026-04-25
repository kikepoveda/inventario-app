import { createClient } from '@/lib/supabase/server'
import { ArchiveBoxIcon, AcademicCapIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Stats con manejo de errores
  let totalItems = 0
  let totalAulas = 0
  let lowStock = 0

  try {
    const [itemsRes, aulasRes, lowStockRes] = await Promise.all([
      supabase.from('inventario').select('*', { count: 'exact', head: true }),
      supabase.from('aulas').select('*', { count: 'exact', head: true }),
      supabase.from('inventario').select('*', { count: 'exact', head: true }).eq('estado', 'malo')
    ])

    totalItems = itemsRes.count || 0
    totalAulas = aulasRes.count || 0
    lowStock = lowStockRes.count || 0
  } catch (err) {
    console.error('Error fetching dashboard stats:', err)
  }

  const stats = [
    { name: 'Total Ítems', value: totalItems, icon: ArchiveBoxIcon },
    { name: 'Aulas Configuradas', value: totalAulas, icon: AcademicCapIcon },
    { name: 'Estado Crítico', value: lowStock, icon: ExclamationTriangleIcon },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Resumen del Centro</h1>
      
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((item) => (
          <div key={item.name} className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 border border-gray-100">
            <dt>
              <div className="absolute rounded-md bg-primary-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 bg-white p-8 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-medium">Próximas Tareas</h3>
        <ul className="mt-4 space-y-4">
          <li className="flex items-center gap-3 text-sm text-gray-600">
            <div className="h-2 w-2 rounded-full bg-primary-500" />
            Revisar inventario del Aula de Informática
          </li>
          <li className="flex items-center gap-3 text-sm text-gray-600">
            <div className="h-2 w-2 rounded-full bg-primary-500" />
            Actualizar estado de portátiles averiados
          </li>
        </ul>
      </div>
    </div>
  )
}
