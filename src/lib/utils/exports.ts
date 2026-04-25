import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { Database } from '@/types/database'

type ExportItem = Database['public']['Tables']['inventario']['Row'] & {
  aulas: { nombre: string } | null
}

export function exportToPDF(items: ExportItem[], centroNombre: string) {
  const doc = new jsPDF()
  
  doc.setFontSize(18)
  doc.text(`Inventario: ${centroNombre}`, 14, 22)
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Fecha de exportación: ${new Date().toLocaleDateString()}`, 14, 30)

  const tableRows = items.map(item => [
    item.codigo,
    item.nombre,
    item.categoria || '-',
    item.aulas?.nombre || 'Sin aula',
    item.estado,
    item.unidades
  ])

  autoTable(doc, {
    head: [['Código', 'Nombre', 'Categoría', 'Aula', 'Estado', 'Unids']],
    body: tableRows,
    startY: 35,
    theme: 'striped',
    headStyles: { fillColor: [2, 132, 199] } // primary-600
  })

  doc.save(`Inventario-${centroNombre}-${new Date().toISOString().split('T')[0]}.pdf`)
}

export function exportToExcel(items: ExportItem[], centroNombre: string) {
  const data = items.map(item => ({
    'Código': item.codigo,
    'Nombre': item.nombre,
    'Marca': item.marca || '',
    'Modelo': item.modelo || '',
    'Nº Serie': item.numero_serie || '',
    'Categoría': item.categoria || '',
    'Aula': item.aulas?.nombre || '',
    'Unidades': item.unidades,
    'Estado': item.estado,
    'Observaciones': item.observaciones || ''
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario')
  
  XLSX.writeFile(workbook, `Inventario-${centroNombre}.xlsx`)
}
