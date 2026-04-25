'use client'

import { useState, useEffect } from 'react'
import { createInventarioItem, updateInventarioItem, InventarioInsert } from '@/app/actions/inventory'
import { getAulas } from '@/app/actions/classrooms'
import { analyzeInventoryImage } from '@/app/actions/vision'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SparklesIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { Database } from '@/types/database'

export default function InventarioForm({ 
  initialData, 
  id 
}: { 
  initialData?: Omit<InventarioInsert, 'centro_id'>,
  id?: string 
}) {
  const router = useRouter()
  const supabase = createClient()
  const [aulas, setAulas] = useState<Database['public']['Tables']['aulas']['Row'][]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imagen_url || null)

  const [formData, setFormData] = useState<Omit<InventarioInsert, 'centro_id'>>(initialData || {
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
    if (!id && !formData.codigo) {
      const randomCode = `PROD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      setFormData(prev => ({ ...prev, codigo: randomCode }))
    }
  }, [id])

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 1024
          let width = img.width
          let height = img.height
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleImageProcess = async (file: File) => {
    setAnalyzing(true)
    setPreviewUrl(URL.createObjectURL(file))
    
    try {
      // 1. Iniciar Análisis de IA de inmediato (usando base64 local)
      // Esto asegura que el formulario se rellene incluso si el upload tarda
      console.log('Iniciando análisis con IA (base64)...')
      const resizedBase64 = await resizeImage(file)
      
      // Lanzamos la IA en paralelo o primero
      const aiPromise = analyzeInventoryImage(resizedBase64)

      // 2. Obtener sesión y perfil para el upload
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('centro_id')
        .eq('id', user.id)
        .single()
      
      if (!perfil?.centro_id) throw new Error('No se encontró el centro asociado')

      // 3. Subir imagen a Supabase Storage
      const fileExt = file.name ? file.name.split('.').pop() : 'jpg'
      const fileName = `${perfil.centro_id}/${Date.now()}.${fileExt}`
      
      console.log('Iniciando subida a Supabase (Bucket: inventario_imagenes):', fileName)
      const { error: uploadError } = await supabase.storage
        .from('inventario_imagenes')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Error CRÍTICO en Storage:', uploadError)
        // Si es error de RLS, avisamos específicamente
        if (uploadError.message.includes('row-level security')) {
          alert('Error de Seguridad (RLS): No tienes permiso para subir a esta carpeta. Por favor, ejecuta el script de corrección de políticas en Supabase.')
        }
        throw new Error(`Error en Storage: ${uploadError.message}`)
      }

      // 4. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('inventario_imagenes')
        .getPublicUrl(fileName)
      
      setFormData(prev => ({ ...prev, imagen_url: publicUrl }))
      console.log('Imagen subida correctamente:', publicUrl)

      // 5. Esperar resultado de IA si aún no ha terminado
      const result = await aiPromise
      
      if (result && result.success) {
        const aiData = result.data
        console.log('Datos recibidos de IA:', aiData)
        setFormData(prev => ({
          ...prev,
          nombre: aiData.nombre || prev.nombre,
          marca: aiData.marca || prev.marca,
          modelo: aiData.modelo || prev.modelo,
          categoria: aiData.categoria || prev.categoria,
          observaciones: aiData.descripcion_breve || prev.observaciones
        }))
      } else {
        console.error('La IA no pudo procesar la imagen:', result?.error)
        alert('La IA no pudo analizar la imagen: ' + (result?.error || 'Error desconocido'))
      }
    } catch (err: any) {
      console.error('Error en proceso de imagen:', err)
      // Solo mostramos alert si no es el de RLS (que ya mostramos arriba)
      if (!err.message.includes('row-level security')) {
        alert(err.message || 'Error al procesar la imagen')
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (id) {
        await updateInventarioItem(id, formData)
      } else {
        await createInventarioItem(formData)
      }
      router.push('/dashboard/inventario')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow border border-gray-200">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sección Imagen */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Imagen del Producto</label>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors relative">
            {previewUrl ? (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Vista previa" className="object-cover w-full h-full" />
                {analyzing && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center">
                    <SparklesIcon className="h-10 w-10 animate-bounce mb-2" />
                    <p className="font-bold">Analizando con IA...</p>
                    <p className="text-xs">Rellenando campos automáticamente</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Haz una foto o sube un archivo</p>
              </div>
            )}
            
            <div className="mt-4 flex gap-2 w-full">
              <label className="btn border-gray-300 bg-white text-gray-700 flex-1 py-2.5 text-center cursor-pointer">
                Subir Archivo
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => e.target.files?.[0] && handleImageProcess(e.target.files[0])}
                  disabled={analyzing}
                />
              </label>
              <label className="btn border-gray-300 bg-white text-gray-700 flex-1 py-2.5 text-center cursor-pointer">
                Hacer Foto
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={e => e.target.files?.[0] && handleImageProcess(e.target.files[0])}
                  disabled={analyzing}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Campos del Formulario */}
        <div className="space-y-4">
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
                placeholder="Nombre del bien"
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
                onChange={e => setFormData({...formData, estado: e.target.value as any})}
              >
                <option value="bueno">Bueno</option>
                <option value="regular">Regular</option>
                <option value="malo">Malo</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              rows={3}
              className="input w-full"
              value={formData.observaciones || ''}
              onChange={e => setFormData({...formData, observaciones: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t flex flex-col-reverse sm:flex-row justify-end gap-4">
        <button type="button" onClick={() => router.back()} className="btn border-gray-300 bg-white text-gray-700 py-2.5">
          Cancelar
        </button>
        <button type="submit" disabled={loading || analyzing} className="btn btn-primary py-2.5 px-8 shadow-md">
          {loading ? 'Guardando...' : 'Guardar Ítem'}
        </button>
      </div>
    </form>
  )
}
