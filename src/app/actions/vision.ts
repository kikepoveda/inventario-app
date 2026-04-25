'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function analyzeInventoryImage(base64Image: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
      Analiza esta imagen de un objeto de inventario escolar. 
      Devuelve un objeto JSON con los siguientes campos basados en lo que ves:
      - nombre (ej: Silla ergonómica, Microscopio óptico)
      - marca (si es visible)
      - modelo (si es visible)
      - categoria (ej: Mobiliario, Laboratorio, Informática)
      - descripcion_breve
      
      Responde SOLO con el JSON.
    `

    // Limpiar el prefijo base64 si existe
    const imageData = base64Image.split(',')[1] || base64Image

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
    console.log('AI Vision Raw Response:', text)
    
    // Extraer JSON del texto (a veces Gemini añade backticks o explicaciones)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (parseError) {
        console.error('JSON Parse error in vision:', parseError)
        throw new Error('La IA devolvió un formato inválido')
      }
    }
    
    throw new Error('No se pudo identificar información estructurada en la imagen')
    
  } catch (error: unknown) {
    console.error('Error in analyzeInventoryImage:', error)
    if (error instanceof Error && error.message.includes('API_KEY')) {
      throw new Error('Configuración incompleta: GEMINI_API_KEY no válida o ausente')
    }
    throw new Error('Error al analizar la imagen: ' + (error instanceof Error ? error.message : 'Error desconocido'))
  }
}
