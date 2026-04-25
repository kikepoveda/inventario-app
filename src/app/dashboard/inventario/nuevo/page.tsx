import InventarioForm from '@/components/inventory/InventarioForm'

export default function NuevoInventarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Añadir al Inventario</h1>
        <p className="mt-1 text-sm text-gray-500">Registra un nuevo bien o equipo en el sistema.</p>
      </div>
      <InventarioForm />
    </div>
  )
}
