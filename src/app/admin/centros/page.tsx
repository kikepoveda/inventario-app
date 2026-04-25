'use client'

import { useState, useEffect } from 'react'
import { getCentros, createCentro } from '@/app/actions/admin'
import { PlusIcon } from '@heroicons/react/24/outline'

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
    const fetchData = async () => {
      await loadCentros()
    }
    fetchData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre) return
    try {
      await createCentro(nombre)
      setNombre('')
      loadCentros()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Centros</h1>
        <p className="mt-1 text-sm text-gray-500">Administración global de instituciones en la plataforma.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 max-w-md">
        <h3 className="text-lg font-medium mb-4">Registrar Nuevo Centro</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre del Centro"
            className="input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <button type="submit" className="btn btn-primary w-full">
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear Centro
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Alta</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center">Cargando...</td></tr>
            ) : centros.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-400">No hay centros registrados</td></tr>
            ) : centros.map((centro) => (
              <tr key={centro.id}>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">{centro.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{centro.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(centro.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
