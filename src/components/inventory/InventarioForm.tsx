'use client'

import { useState, useEffect } from 'react'
import { createInventarioItem, InventarioInsert } from '@/app/actions/inventory'
import { getAulas } from '@/app/actions/classrooms'
import { analyzeInventoryImage } from '@/app/actions/vision'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { Database } from '@/types/database'

export default function InventarioForm() {
  const router = useRouter()
  const supabase = createClient()
  const [aulas, setAulas] = useState<Database['public']['Tables']['aulas']['Row'][]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState<Omit<InventarioInsert, 'centro_id'>>({
    codigo: '',
    nombre: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    categoria: '',
    aula_id: null,
    estado: 'bueno',
    unidades: 1,
    observaciones: '',
    imagen_url: ''
  })

  useEffect(() => {
    getAulas().then(setAulas)
  }, [])

  const handleAIAnalysis = async () => {
    if (!imageFile) return
    setAnalyzing(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        const result = await analyzeInventoryImage(base64)
        if (result) {
          setFormData(prev => ({
            ...prev,
            nombre: result.nombre || prev.nombre,
            marca: result.marca || prev.marca,
            modelo: result.modelo || prev.modelo,
            categoria: result.categoria || prev.categoria,
            observaciones: result.descripcion_breve || prev.observaciones
          }))
        }
      }
      reader.readAsDataURL(imageFile)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleUploadImage = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: perfil } = await supabase.from('perfiles').select('centro_id').eq('id', user.id).single()
    if (!perfil?.centro_id) return null

    const fileExt = file.name.split('.').pop()
    const fileName = `${perfil.centro_id}/${Math.random()}.${fileExt}`

    const { error } = await supabase.storage
      .from('inventario_imagenes')
      .upload(fileName, file)

    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('inventario_imagenes')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let finalImageUrl = formData.imagen_url
      if (imageFile) {
        finalImageUrl = await handleUploadImage(imageFile) || ''
      }

      await createInventarioItem({ ...formData, imagen_url: finalImageUrl })
      router.push('/dashboard/inventario')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Imagen</label>
            <div className="mt-1 flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                onChange={e => setImageFile(e.target.files?.[0] || null)}
              />
              {imageFile && (
                <button
                  type="button"
                  onClick={handleAIAnalysis}
                  disabled={analyzing}
                  className="btn bg-purple-600 hover:bg-purple-700 text-white shadow-sm whitespace-nowrap"
                >
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  {analyzing ? 'Analizando...' : 'Autocompletar con IA'}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Código *</label>
            <input
              required
              className="input mt-1"
              value={formData.codigo}
              onChange={e => setFormData({...formData, codigo: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Bien *</label>
            <input
              required
              className="input mt-1"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Marca</label>
              <input
                className="input mt-1"
                value={formData.marca || ''}
                onChange={e => setFormData({...formData, marca: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Modelo</label>
              <input
                className="input mt-1"
                value={formData.modelo || ''}
                onChange={e => setFormData({...formData, modelo: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de Serie</label>
            <input
              className="input mt-1"
              value={formData.numero_serie || ''}
              onChange={e => setFormData({...formData, numero_serie: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Categoría</label>
            <input
              className="input mt-1"
              value={formData.categoria || ''}
              onChange={e => setFormData({...formData, categoria: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ubicación (Aula)</label>
            <select
              className="input mt-1"
              value={formData.aula_id || ''}
              onChange={e => setFormData({...formData, aula_id: e.target.value || null})}
            >
              <option value="">Seleccionar aula...</option>
              {aulas.map(aula => (
                <option key={aula.id} value={aula.id}>{aula.nombre}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Unidades</label>
              <input
                type="number"
                min="1"
                className="input mt-1"
                value={formData.unidades}
                onChange={e => setFormData({...formData, unidades: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                className="input mt-1"
                value={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.value as Database['public']['Enums']['inventory_status']})}
              >
                <option value="bueno">Bueno</option>
                <option value="regular">Regular</option>
                <option value="malo">Malo</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700">Observaciones</label>
        <textarea
          rows={3}
          className="input mt-1"
          value={formData.observaciones || ''}
          onChange={e => setFormData({...formData, observaciones: e.target.value})}
        />
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <button type="button" onClick={() => router.back()} className="btn border-gray-300 bg-white text-gray-700">Cancelar</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Guardando...' : 'Guardar Ítem'}
        </button>
      </div>
    </form>
  )
}
