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
    nombre: 'Producto',
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
    // Generar código automático si está vacío
    const randomCode = `PROD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    setFormData(prev => ({ ...prev, codigo: randomCode }))
  }, [])

  // Efecto para análisis automático si se sube una imagen (especialmente desde cámara)
  useEffect(() => {
    if (imageFile) {
      handleAIAnalysis()
    }
  }, [imageFile])

  const handleAIAnalysis = async () => {
    if (!imageFile) return
    setAnalyzing(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(imageFile)
      })

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
    } catch (err: unknown) {
      console.error('AI Analysis Error:', err)
      alert(err instanceof Error ? err.message : 'Error al analizar la imagen')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleUploadImage = async (file: File) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('No autorizado para subir imágenes')

    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('centro_id')
      .eq('id', user.id)
      .single()

    if (perfilError || !perfil?.centro_id) throw new Error('No se encontró el centro asociado')

    const fileExt = file.name.split('.').pop()
    const fileName = `${perfil.centro_id}/${Math.random()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('inventario_imagenes')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Upload Error:', uploadError)
      throw new Error('Error al subir la imagen al servidor')
    }
    
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
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow border border-gray-200">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen / Cámara</label>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  id="image-upload"
                  className="hidden"
                  onChange={e => setImageFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="btn border-gray-300 bg-white text-gray-700 hover:bg-gray-50 flex-1 py-2.5"
                >
                  Subir
                </button>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  id="camera-capture"
                  className="hidden"
                  onChange={e => setImageFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('camera-capture')?.click()}
                  className="btn border-gray-300 bg-white text-gray-700 hover:bg-gray-50 flex-1 py-2.5"
                >
                  Cámara
                </button>
              </div>

              {imageFile && (
                <div className="flex items-center justify-between p-2.5 bg-purple-50 rounded-md border border-purple-100">
                  <span className="text-xs text-purple-700 truncate max-w-[120px]">{imageFile.name}</span>
                  <button
                    type="button"
                    onClick={handleAIAnalysis}
                    disabled={analyzing}
                    className="btn bg-purple-600 hover:bg-purple-700 text-white text-xs py-1.5 px-3 shadow-sm"
                  >
                    <SparklesIcon className="h-3.5 w-3.5 mr-1" />
                    {analyzing ? 'Analizando...' : 'Auto-IA'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input
                required
                className="input w-full"
                value={formData.codigo}
                onChange={e => setFormData({...formData, codigo: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
              <input
                required
                className="input w-full"
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                className="input w-full"
                value={formData.marca || ''}
                onChange={e => setFormData({...formData, marca: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input
                className="input w-full"
                value={formData.modelo || ''}
                onChange={e => setFormData({...formData, modelo: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nº Serie</label>
              <input
                className="input w-full"
                value={formData.numero_serie || ''}
                onChange={e => setFormData({...formData, numero_serie: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <input
                className="input w-full"
                value={formData.categoria || ''}
                onChange={e => setFormData({...formData, categoria: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación (Aula)</label>
            <select
              className="input w-full"
              value={formData.aula_id || ''}
              onChange={e => setFormData({...formData, aula_id: e.target.value || null})}
            >
              <option value="">Seleccionar aula...</option>
              {aulas.map(aula => (
                <option key={aula.id} value={aula.id}>{aula.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidades</label>
              <input
                type="number"
                min="1"
                className="input w-full"
                value={formData.unidades}
                onChange={e => setFormData({...formData, unidades: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                className="input w-full"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
        <textarea
          rows={3}
          className="input w-full"
          value={formData.observaciones || ''}
          onChange={e => setFormData({...formData, observaciones: e.target.value})}
        />
      </div>

      <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
        <button type="button" onClick={() => router.back()} className="btn border-gray-300 bg-white text-gray-700 py-2.5">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="btn btn-primary py-2.5 px-8">
          {loading ? 'Guardando...' : 'Guardar Ítem'}
        </button>
      </div>
    </form>
  )
}
