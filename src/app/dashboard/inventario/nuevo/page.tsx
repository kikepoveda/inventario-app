import BatchInventarioForm from '@/components/inventory/BatchInventarioForm'

export const dynamic = 'force-dynamic'

export default function NuevoInventarioPage() {
  return (
    <div className="space-y-6">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Alta Inteligente</h1>
        <p className="mt-1 text-sm text-gray-500">Detecta y registra múltiples bienes con una sola foto.</p>
      </div>
      <BatchInventarioForm />
    </div>
  )
}
