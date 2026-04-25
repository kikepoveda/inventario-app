'use client'

import { useState, useEffect } from 'react'
import { getAulas, createAula, deleteAula } from '@/app/actions/classrooms'
import { TrashIcon } from '@heroicons/react/24/outline'
import { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

export default function ConfiguracionPage() {
  const [aulas, setAulas] = useState<Database['public']['Tables']['aulas']['Row'][]>([])
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(true)

  const loadAulas = async () => {
    try {
      const data = await getAulas()
      setAulas(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAulas()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre) return
    try {
      await createAula(nombre)
      setNombre('')
      loadAulas()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al crear aula')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Centro</h1>
        <p className="mt-1 text-sm text-gray-500">Gestiona las aulas y ajustes de tu centro educativo.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-medium mb-4">Gestión de Aulas</h3>
        <form onSubmit={handleCreate} className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Nombre de la nueva aula..."
            className="input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Añadir Aula</button>
        </form>

        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={2} className="px-6 py-4 text-center">Cargando...</td></tr>
              ) : aulas.length === 0 ? (
                <tr><td colSpan={2} className="px-6 py-4 text-center text-gray-400">Sin aulas configuradas</td></tr>
              ) : aulas.map((aula) => (
                <tr key={aula.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{aula.nombre}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => deleteAula(aula.id).then(loadAulas)} className="text-red-600 hover:text-red-900">
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
