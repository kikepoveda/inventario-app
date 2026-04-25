import InventarioForm from '@/components/inventory/InventarioForm'
import { getInventarioItem } from '@/app/actions/inventory'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarInventarioPage({ params }: Props) {
  const { id } = await params
  const item = await getInventarioItem(id)

  if (!item) {
    notFound()
  }

  // Preparamos los datos eliminando campos que no queremos pasar al form de edición
  const initialData = {
    codigo: item.codigo,
    nombre: item.nombre,
    marca: item.marca,
    modelo: item.modelo,
    numero_serie: item.numero_serie,
    categoria: item.categoria,
    aula_id: item.aula_id,
    estado: item.estado,
    unidades: item.unidades,
    observaciones: item.observaciones,
    imagen_url: item.imagen_url
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Ítem</h1>
        <p className="mt-1 text-sm text-gray-500">Actualiza la información del bien seleccionado.</p>
      </div>
      <InventarioForm initialData={initialData} id={id} />
    </div>
  )
}
