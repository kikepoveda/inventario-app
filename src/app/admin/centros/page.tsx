'use client'

import { useState, useEffect } from 'react'
import { getCentros, createCentro, deleteCentro } from '@/app/actions/admin'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

import { Database } from '@/types/database'

export default function CentrosPage() {
  const [centros, setCentros] = useState<Database['public']['Tables']['centros']['Row'][]>([])
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(true)

  const loadCentros = async () => {
    try {
      const data = await getCentros()
      setCentros(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCentros()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre) return
    try {
      await createCentro(nombre)
      alert('Centro creado correctamente')
      setNombre('')
      loadCentros()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este centro? Se borrarán todos los datos asociados.')) return
    try {
      await deleteCentro(id)
      alert('Centro eliminado')
      loadCentros()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Centros</h1>
        <p className="mt-1 text-sm text-gray-500">Administración global de instituciones en la plataforma.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 max-w-2xl">
        <h3 className="text-lg font-medium mb-4">Registrar Nuevo Centro</h3>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Nombre del Centro"
            className="input flex-1"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <button type="submit" className="btn btn-primary px-8 py-2.5">
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium sm:hidden px-1">Centros Registrados</h3>
        
        {/* Mobile Cards */}
        <div className="grid grid-cols-1 gap-2 sm:hidden">
          {loading ? (
            <div className="text-center py-4">Cargando...</div>
          ) : centros.length === 0 ? (
            <div className="text-center py-4 text-gray-400">No hay centros registrados</div>
          ) : centros.map((centro) => (
            <div key={centro.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">{centro.nombre}</p>
                <p className="text-xs text-gray-500">{new Date(centro.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleDelete(centro.id)} className="p-2 text-red-600">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Alta</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-4 text-center">Cargando...</td></tr>
              ) : centros.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-400">No hay centros registrados</td></tr>
              ) : centros.map((centro) => (
                <tr key={centro.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{centro.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(centro.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleDelete(centro.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
