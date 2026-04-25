'use client'

import { useState, useEffect } from 'react'
import { getInventario, deleteInventarioItem } from '@/app/actions/inventory'
import { getAulas } from '@/app/actions/classrooms'
import { getCentros } from '@/app/actions/admin'
import { PlusIcon, MagnifyingGlassIcon, DocumentArrowDownIcon, TableCellsIcon, QrCodeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { exportToPDF, exportToExcel } from '@/lib/utils/exports'
import QRView from '@/components/inventory/QRView'
import { Database } from '@/types/database'

type InventarioItem = Database['public']['Tables']['inventario']['Row'] & {
  aulas: { nombre: string } | null
  centros: { nombre: string } | null
}

export const dynamic = 'force-dynamic'

export default function InventarioPage() {
  const [items, setItems] = useState<InventarioItem[]>([])
  const [aulas, setAulas] = useState<Database['public']['Tables']['aulas']['Row'][]>([])
  const [centros, setCentros] = useState<Database['public']['Tables']['centros']['Row'][]>([])
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterAula, setFilterAula] = useState('')
  const [filterCentro, setFilterCentro] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedQR, setSelectedQR] = useState<{codigo: string, nombre: string} | null>(null)

  const loadInventario = async () => {
    try {
      const data = await getInventario()
      setItems(data)
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadAulas = async () => {
    try {
      const data = await getAulas()
      setAulas(data)
    } catch (err: unknown) {
      console.error('Error loading classrooms:', err)
    }
  }

  const loadCentros = async () => {
    try {
      const data = await getCentros()
      setCentros(data)
    } catch (err: unknown) {
      console.error('Error loading centers:', err)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([loadInventario(), loadAulas(), loadCentros()])
    }
    fetchData()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este ítem?')) return
    try {
      await deleteInventarioItem(id)
      alert('Ítem eliminado correctamente')
      loadInventario()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(search.toLowerCase()) ||
      item.codigo.toLowerCase().includes(search.toLowerCase()) ||
      item.marca?.toLowerCase().includes(search.toLowerCase())
    
    const matchesEstado = filterEstado === '' || item.estado === filterEstado
    const matchesAula = filterAula === '' || item.aula_id === filterAula
    const matchesCentro = filterCentro === '' || item.centro_id === filterCentro

    return matchesSearch && matchesEstado && matchesAula && matchesCentro
  })

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventario</h1>
          <p className="mt-2 text-sm text-gray-700">Gestión avanzada de bienes y equipos.</p>
        </div>
        <div className="mt-4 flex gap-3 sm:ml-16 sm:mt-0">
          <button 
            onClick={() => exportToExcel(filteredItems, 'Centro')}
            className="btn border-gray-300 bg-white text-gray-700"
          >
            <TableCellsIcon className="h-5 w-5 mr-1" />
            Excel
          </button>
          <button 
            onClick={() => exportToPDF(filteredItems, 'Centro')}
            className="btn border-gray-300 bg-white text-gray-700"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-1" />
            PDF
          </button>
          <Link href="/dashboard/inventario/nuevo" className="btn btn-primary">
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Añadir Ítem
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="input"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="bueno">Bueno</option>
          <option value="regular">Regular</option>
          <option value="malo">Malo</option>
          <option value="baja">Baja</option>
        </select>
        <select 
          className="input"
          value={filterAula}
          onChange={(e) => setFilterAula(e.target.value)}
        >
          <option value="">Todas las aulas</option>
          {aulas.map(aula => (
            <option key={aula.id} value={aula.id}>{aula.nombre}</option>
          ))}
        </select>
        {centros.length > 0 && (
          <select 
            className="input"
            value={filterCentro}
            onChange={(e) => setFilterCentro(e.target.value)}
          >
            <option value="">Todos los centros</option>
            {centros.map(centro => (
              <option key={centro.id} value={centro.id}>{centro.nombre}</option>
            ))}
          </select>
        )}
      </div>

      {/* Mobile Cards (Visible only on mobile) */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {loading ? (
          <div className="text-center py-4">Cargando...</div>
        ) : filteredItems.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-900">{item.nombre}</h3>
                <p className="text-xs text-gray-500">{item.codigo} • {item.marca || 'S/M'}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                item.estado === 'bueno' ? 'bg-green-100 text-green-800' :
                item.estado === 'regular' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {item.estado}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <p><span className="font-medium">Aula:</span> {item.aulas?.nombre || 'Sin aula'}</p>
              <p><span className="font-medium">Centro:</span> {item.centros?.nombre || '-'}</p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <button onClick={() => setSelectedQR({codigo: item.codigo, nombre: item.nombre})} className="p-2 text-gray-400">
                <QrCodeIcon className="h-6 w-6" />
              </button>
              <div className="flex gap-4">
                <Link href={`/dashboard/inventario/editar/${item.id}`} className="text-primary-600 font-medium">
                  Editar
                </Link>
                <button onClick={() => handleDelete(item.id)} className="text-red-600 font-medium">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table (Visible only from sm up) */}
      <div className="hidden sm:block overflow-hidden bg-white shadow rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">QR</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Código</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nombre</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Centro</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Aula</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Cargando...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4">No se encontraron ítems.</td></tr>
              ) : filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 text-sm">
                    <button onClick={() => setSelectedQR({codigo: item.codigo, nombre: item.nombre})} className="text-gray-400 hover:text-primary-600">
                      <QrCodeIcon className="h-6 w-6" />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{item.codigo}</td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <div className="font-medium text-gray-900">{item.nombre}</div>
                    <div className="text-xs text-gray-400">{item.marca} {item.modelo}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.centros?.nombre || '-'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.aulas?.nombre || 'Sin aula'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.estado === 'bueno' ? 'bg-green-100 text-green-800' :
                      item.estado === 'regular' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Link href={`/dashboard/inventario/editar/${item.id}`} className="text-primary-600 hover:text-primary-900 mr-4">
                      Editar
                    </Link>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal QR */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Código QR de {selectedQR.nombre}</h3>
            <QRView codigo={selectedQR.codigo} nombre={selectedQR.nombre} />
            <button 
              onClick={() => setSelectedQR(null)}
              className="mt-6 w-full btn border-gray-300 text-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
