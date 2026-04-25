'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function analyzeInventoryImage(base64Image: string) {
  // Verificación básica
  if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY no configurada')
    return { success: false, error: 'Configuración de IA incompleta' }
  }

  try {
    console.log('Iniciando llamada a Gemini Flash...')
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    })

    const prompt = `
      Analiza esta imagen de un objeto de inventario y devuelve un JSON con:
      {
        "nombre": "nombre del producto",
        "marca": "marca si existe",
        "modelo": "modelo si existe",
        "categoria": "Mobiliario|Laboratorio|Informática|Otros",
        "descripcion_breve": "breve descripción"
      }
    `

    // Limpiar base64
    const imageData = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image

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
    console.log('Gemini raw response:', text)
    
    const data = JSON.parse(text)
    return { success: true, data }
    
  } catch (error: any) {
    console.error('Error detallado en analyzeInventoryImage:', error)
    return { 
      success: false, 
      error: error.message || 'Error desconocido al analizar la imagen' 
    }
  }
}
