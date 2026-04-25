'use client'

import { useState, useEffect } from 'react'
import { getAulas, createAula, deleteAula } from '@/app/actions/classrooms'
import { importAulasCSV } from '@/app/actions/classrooms-import'
import { TrashIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'

import { Database } from '@/types/database'

export default function AulasPage() {
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
    const fetchData = async () => {
      await loadAulas()
    }
    fetchData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre) return
    try {
      await createAula(nombre)
      alert('Aula creada correctamente')
      setNombre('')
      loadAulas()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al crear aula')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta aula? Se borrarán los datos asociados.')) return
    try {
      await deleteAula(id)
      alert('Aula eliminada')
      loadAulas()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('csv', file)
    
    try {
      await importAulasCSV(formData)
      alert('Aulas importadas correctamente')
      loadAulas()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Aula 101\nAula 102\nLaboratorio Informatica\nBiblioteca"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "plantilla_aulas.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Aulas</h1>
        <p className="mt-1 text-sm text-gray-500">Configura los espacios físicos de tu centro.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulario Crear */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Nueva Aula</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Ej: Aula 102, Laboratorio..."
              className="input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <button type="submit" className="btn btn-primary w-full">Crear Aula</button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Importar CSV</h3>
              <button 
                onClick={downloadTemplate}
                className="text-xs text-primary-600 hover:underline"
              >
                Descargar Plantilla
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Sube un archivo .csv con un nombre de aula por línea.</p>
            <label className="btn border-gray-300 bg-white text-gray-700 hover:bg-gray-50 w-full cursor-pointer">
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              Seleccionar Archivo
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>

        {/* Listado */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={2} className="px-6 py-4 text-center">Cargando...</td></tr>
              ) : aulas.length === 0 ? (
                <tr><td colSpan={2} className="px-6 py-4 text-center text-gray-400">Sin aulas configuradas</td></tr>
              ) : aulas.map((aula) => (
                <tr key={aula.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{aula.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(aula.id)} className="text-red-600 hover:text-red-900">
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
