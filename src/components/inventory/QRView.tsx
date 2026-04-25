'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useRef } from 'react'
import { ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline'

export default function QRView({ codigo, nombre }: { codigo: string, nombre: string }) {
  const qrRef = useRef<SVGSVGElement>(null)

  const downloadQR = () => {
    const svg = qrRef.current
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `QR-${codigo}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const printQR = () => {
    const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0')
    if (!windowPrint) return
    
    windowPrint.document.write(`
      <html>
        <head>
          <title>Imprimir QR - ${codigo}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
            h2 { margin-top: 20px; }
            .qr-container { border: 1px solid #ccc; padding: 20px; border-radius: 10px; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${qrRef.current?.outerHTML}
          </div>
          <h2>${nombre}</h2>
          <p>Código: ${codigo}</p>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `)
    windowPrint.document.close()
  }

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <QRCodeSVG
        ref={qrRef}
        value={codigo}
        size={128}
        level="H"
        includeMargin={true}
      />
      <div className="mt-4 flex gap-2">
        <button onClick={downloadQR} className="btn border-gray-300 bg-white text-gray-700 text-xs">
          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
          Descargar
        </button>
        <button onClick={printQR} className="btn border-gray-300 bg-white text-gray-700 text-xs">
          <PrinterIcon className="h-4 w-4 mr-1" />
          Imprimir
        </button>
      </div>
    </div>
  )
}
