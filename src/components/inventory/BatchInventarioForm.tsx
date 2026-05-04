'use client'

import { useState, useEffect } from 'react'
import { createInventarioItemsBulk, InventarioInsert } from '@/app/actions/inventory'
import { getAulas } from '@/app/actions/classrooms'
import { analyzeInventoryImage } from '@/app/actions/vision'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  SparklesIcon, 
  PhotoIcon, 
  TrashIcon, 
  PlusIcon, 
  CheckIcon,
  ChevronRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Database } from '@/types/database'

type Step = 'upload' | 'analyzing' | 'review'

interface DetectedItem {
  id: string // Temp ID for React keys
  nombre: string
  marca: string
  modelo: string
  categoria: string
  unidades: number
  observaciones: string
  codigo: string
}

export default function BatchInventarioForm() {
  const router = useRouter()
  const supabase = createClient()
  const [aulas, setAulas] = useState<Database['public']['Tables']['aulas']['Row'][]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([])
  const [selectedAula, setSelectedAula] = useState<string>('')

  useEffect(() => {
    getAulas().then(setAulas)
  }, [])

  const generateCode = () => `PROD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

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
    setStep('analyzing')
    setPreviewUrl(URL.createObjectURL(file))
    
    try {
      // 1. Iniciar Análisis de IA (base64)
      const resizedBase64 = await resizeImage(file)
      const aiPromise = analyzeInventoryImage(resizedBase64)

      // 2. Obtener sesión y perfil
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('centro_id')
        .eq('id', user.id)
        .single()
      
      if (!perfil?.centro_id) throw new Error('No se encontró el centro asociado')

      // 3. Subir imagen a Storage
      const fileExt = file.name ? file.name.split('.').pop() : 'jpg'
      const fileName = `${perfil.centro_id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('inventario_imagenes')
        .upload(fileName, file)

      if (uploadError) throw new Error(`Error en Storage: ${uploadError.message}`)

      const { data: { publicUrl } } = supabase.storage
        .from('inventario_imagenes')
        .getPublicUrl(fileName)
      
      setImageUrl(publicUrl)

      // 4. Esperar a la IA
      const result = await aiPromise
      
      if (result && result.success && Array.isArray(result.data)) {
        const mappedItems = result.data.map((item: any) => ({
          id: Math.random().toString(36).substring(7),
          nombre: item.nombre || '',
          marca: item.marca || '',
          modelo: item.modelo || '',
          categoria: item.categoria || '',
          unidades: item.cantidad || 1,
          observaciones: item.descripcion || '',
          codigo: generateCode()
        }))
        setDetectedItems(mappedItems)
        setStep('review')
      } else {
        // Si la IA falla o no devuelve array, permitimos añadir manual
        setStep('review')
        if (result && !result.success) {
          console.error('AI Error:', result.error)
        }
      }
    } catch (err: any) {
      console.error('Error:', err)
      alert(err.message || 'Error al procesar la imagen')
      setStep('upload')
    }
  }

  const addItemManual = () => {
    setDetectedItems(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      nombre: '',
      marca: '',
      modelo: '',
      categoria: '',
      unidades: 1,
      observaciones: '',
      codigo: generateCode()
    }])
  }

  const updateItem = (id: string, field: keyof DetectedItem, value: any) => {
    setDetectedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const removeItem = (id: string) => {
    setDetectedItems(prev => prev.filter(item => item.id !== id))
  }

  const handleSaveAll = async () => {
    if (!selectedAula) {
      alert('Por favor, selecciona una ubicación (aula) para todos los ítems.')
      return
    }

    if (detectedItems.length === 0) {
      alert('Añade al menos un ítem.')
      return
    }

    setLoading(true)
    try {
      const itemsToSave: Omit<InventarioInsert, 'centro_id'>[] = detectedItems.map(item => ({
        codigo: item.codigo,
        nombre: item.nombre,
        marca: item.marca,
        modelo: item.modelo,
        categoria: item.categoria,
        unidades: item.unidades,
        observaciones: item.observaciones,
        aula_id: selectedAula,
        imagen_url: imageUrl,
        estado: 'bueno'
      }))

      await createInventarioItemsBulk(itemsToSave)
      router.push('/dashboard/inventario')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8 px-4">
        <div className="flex items-center justify-between max-w-xs mx-auto">
          <div className={`flex flex-col items-center ${step === 'upload' ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step === 'upload' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>
              <PhotoIcon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Foto</span>
          </div>
          <div className="h-px bg-gray-300 flex-1 mx-2 mt-[-16px]"></div>
          <div className={`flex flex-col items-center ${step === 'analyzing' ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step === 'analyzing' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>
              <SparklesIcon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">IA</span>
          </div>
          <div className="h-px bg-gray-300 flex-1 mx-2 mt-[-16px]"></div>
          <div className={`flex flex-col items-center ${step === 'review' ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step === 'review' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>
              <CheckIcon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Revisión</span>
          </div>
        </div>
      </div>

      {step === 'upload' && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center space-y-6">
          <div className="flex flex-col items-center justify-center border-4 border-dashed border-gray-100 rounded-3xl p-12 bg-gray-50/50 hover:bg-gray-50 transition-all group">
            <div className="h-20 w-20 bg-primary-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PhotoIcon className="h-10 w-10 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Captura el Inventario</h2>
            <p className="text-gray-500 max-w-sm mx-auto mt-2 text-sm">
              Haz una foto panorámica o de un conjunto de objetos. La IA detectará todo automáticamente.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <label className="btn btn-primary flex-1 py-4 text-lg cursor-pointer shadow-lg shadow-primary-200">
                <PhotoIcon className="h-6 w-6 mr-2" />
                Hacer Foto
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={e => e.target.files?.[0] && handleImageProcess(e.target.files[0])}
                />
              </label>
              <label className="btn border-gray-300 bg-white text-gray-700 flex-1 py-4 text-lg cursor-pointer">
                Subir Archivo
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => e.target.files?.[0] && handleImageProcess(e.target.files[0])}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {step === 'analyzing' && (
        <div className="bg-white p-12 rounded-2xl shadow-xl border border-gray-100 text-center space-y-8">
          <div className="relative inline-block">
            {previewUrl && (
              <img src={previewUrl} className="w-48 h-48 object-cover rounded-3xl opacity-50 blur-[2px]" alt="Preview" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <ArrowPathIcon className="h-16 w-16 text-primary-600 animate-spin" />
                <SparklesIcon className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Analizando con IA...</h2>
            <p className="text-gray-500 mt-2">Estamos detectando y contando los objetos en la imagen.</p>
          </div>
          <div className="max-w-xs mx-auto bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-primary-600 h-full w-2/3 animate-pulse"></div>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-6 pb-24">
          {/* Ubicación Global */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider min-w-fit">Ubicación Actual:</label>
            <select
              className="input flex-1 font-medium text-primary-700 border-primary-200 bg-primary-50/30"
              value={selectedAula}
              onChange={e => setSelectedAula(e.target.value)}
              required
            >
              <option value="">Selecciona el Aula/Ubicación donde irá todo...</option>
              {aulas.map(aula => (
                <option key={aula.id} value={aula.id}>{aula.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center px-2">
            <h3 className="font-bold text-gray-900">Objetos Detectados ({detectedItems.length})</h3>
            <button 
              onClick={addItemManual}
              className="text-primary-600 text-sm font-bold flex items-center hover:underline"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Añadir manual
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {detectedItems.map((item, index) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 relative group animate-in fade-in slide-in-from-bottom-4 duration-300">
                <button 
                  onClick={() => removeItem(item.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-1"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-1 flex items-center justify-center">
                    <span className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                      {index + 1}
                    </span>
                  </div>
                  
                  <div className="md:col-span-5 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre del Bien</label>
                      <input 
                        className="input-minimal w-full font-bold text-gray-900 border-b border-gray-100 focus:border-primary-500 transition-colors"
                        value={item.nombre}
                        onChange={e => updateItem(item.id, 'nombre', e.target.value)}
                        placeholder="Ej: Balón de Baloncesto"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Marca</label>
                        <input 
                          className="input-minimal w-full text-sm text-gray-600"
                          value={item.marca}
                          onChange={e => updateItem(item.id, 'marca', e.target.value)}
                          placeholder="Marca"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Modelo</label>
                        <input 
                          className="input-minimal w-full text-sm text-gray-600"
                          value={item.modelo}
                          onChange={e => updateItem(item.id, 'modelo', e.target.value)}
                          placeholder="Modelo"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Categoría</label>
                      <select 
                        className="input-minimal w-full text-sm text-gray-600"
                        value={item.categoria}
                        onChange={e => updateItem(item.id, 'categoria', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Mobiliario">Mobiliario</option>
                        <option value="Laboratorio">Laboratorio</option>
                        <option value="Informática">Informática</option>
                        <option value="Deportes">Deportes</option>
                        <option value="Otros">Otros</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Unidades</label>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateItem(item.id, 'unidades', Math.max(1, item.unidades - 1))}
                          className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                        >
                          -
                        </button>
                        <input 
                          type="number"
                          className="input-minimal w-12 text-center font-bold text-primary-600"
                          value={item.unidades}
                          onChange={e => updateItem(item.id, 'unidades', parseInt(e.target.value) || 1)}
                        />
                        <button 
                          onClick={() => updateItem(item.id, 'unidades', item.unidades + 1)}
                          className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-end">
                     <button 
                      onClick={() => {
                        const code = generateCode()
                        updateItem(item.id, 'codigo', code)
                        alert(`Nuevo código generado: ${code}`)
                      }}
                      className="text-[10px] text-gray-400 hover:text-primary-600 flex items-center"
                    >
                      <ArrowPathIcon className="h-3 w-3 mr-1" />
                      REGEN. CÓDIGO
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Bar (Fixed at bottom on mobile) */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 sm:relative sm:bg-transparent sm:border-0 sm:p-0">
            <div className="max-w-4xl mx-auto flex gap-4">
              <button 
                onClick={() => setStep('upload')} 
                className="btn border-gray-300 bg-white text-gray-700 flex-1 py-4"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveAll} 
                disabled={loading}
                className="btn btn-primary flex-[2] py-4 shadow-xl shadow-primary-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Guardando lote...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Guardar {detectedItems.length} ítems
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
