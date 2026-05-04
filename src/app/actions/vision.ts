'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function analyzeInventoryImage(base64Image: string) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY no configurada')
    return { success: false, error: 'Configuración de IA incompleta (Falta API KEY)' }
  }

  const prompt = `
    Analiza esta imagen y detecta TODOS los objetos de inventario diferentes que veas.
    Devuelve exclusivamente un array JSON válido de objetos con este formato:
    [
      {
        "nombre": "nombre del producto",
        "marca": "marca si existe",
        "modelo": "modelo si existe",
        "categoria": "Mobiliario|Laboratorio|Informática|Deportes|Otros",
        "cantidad": 1,
        "descripcion": "breve descripción"
      }
    ]
    Importante:
    - Si ves varios objetos iguales (ej: 6 sillas iguales), crea un solo objeto con cantidad: 6.
    - Si ves objetos distintos, crea un objeto para cada tipo.
    - Responde SOLAMENTE el array JSON, sin texto explicativo ni markdown.
  `

  const imageData = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image

  // Modelos actualizados según la disponibilidad de tu API
  const modelsToTry = [
    'gemini-2.0-flash', 
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ]

  for (const modelName of modelsToTry) {
    try {
      console.log(`Intentando análisis multi-objeto con modelo: ${modelName} (API v1)`)
      
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' })
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData,
            mimeType: 'image/jpeg',
          },
        },
      ])

      const response = await result.response
      const text = response.text()
      console.log(`Respuesta exitosa de ${modelName}:`, text)

      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return { success: true, data: JSON.parse(jsonMatch[0]) }
      }
      
      const data = JSON.parse(text)
      return { success: true, data: Array.isArray(data) ? data : [data] }

    } catch (error: any) {
      console.error(`Error con modelo ${modelName}:`, error.message)
      if (modelName === modelsToTry[modelsToTry.length - 1]) {
        return { 
          success: false, 
          error: `No se pudo conectar con la IA. Error final: ${error.message}` 
        }
      }
      continue
    }
  }

  return { success: false, error: 'No se pudo procesar la imagen' }
}
