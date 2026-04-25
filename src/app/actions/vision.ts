'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function analyzeInventoryImage(base64Image: string) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY no configurada')
    return { success: false, error: 'Configuración de IA incompleta (Falta API KEY)' }
  }

  try {
    console.log('--- Iniciando Análisis con Gemini ---')
    // Intentamos con flash-latest que suele ser más estable en versionado
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })
    } catch (e) {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
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
      No añadidas texto explicativo ni markdown. Solo el objeto JSON.
    `

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
    console.log('Gemini Raw Text:', text)
    
    // Extracción robusta de JSON usando Regex
    let jsonData = null
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0])
      } else {
        jsonData = JSON.parse(text)
      }
    } catch (parseError) {
      console.error('Error al parsear JSON de Gemini:', parseError)
      return { success: false, error: 'Error de formato en la respuesta de la IA' }
    }

    console.log('JSON Extraído Correctamente:', jsonData)
    return { success: true, data: jsonData }
    
  } catch (error: any) {
    console.error('Error Crítico en analyzeInventoryImage:', error)
    return { 
      success: false, 
      error: error.message || 'Error desconocido al analizar la imagen' 
    }
  }
}
