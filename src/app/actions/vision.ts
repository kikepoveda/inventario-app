'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function analyzeInventoryImage(base64Image: string) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY no configurada')
    return { success: false, error: 'Configuración de IA incompleta' }
  }

  const prompt = `
    Analiza esta imagen de un objeto de inventario y devuelve exclusivamente un objeto JSON válido con este formato:
    {
      "nombre": "nombre del producto",
      "marca": "marca",
      "modelo": "modelo",
      "categoria": "Mobiliario|Laboratorio|Informática|Otros",
      "descripcion_breve": "breve descripción"
    }
  `

  const imageData = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image

  // Lista de modelos a intentar en orden de preferencia
  const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro-vision']

  for (const modelName of modelsToTry) {
    try {
      console.log(`Intentando análisis con modelo: ${modelName}`)
      const model = genAI.getGenerativeModel({ model: modelName })
      
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
      console.log(`Respuesta de ${modelName}:`, text)

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return { success: true, data: JSON.parse(jsonMatch[0]) }
      }
      
      const data = JSON.parse(text)
      return { success: true, data }

    } catch (error: any) {
      console.error(`Error con modelo ${modelName}:`, error.message)
      // Si es el último modelo, lanzamos el error o devolvemos fallo
      if (modelName === modelsToTry[modelsToTry.length - 1]) {
        return { success: false, error: `No se pudo analizar con ningún modelo. Último error: ${error.message}` }
      }
      // Si no, continuamos al siguiente modelo
      continue
    }
  }

  return { success: false, error: 'No se pudo procesar la imagen' }
}
