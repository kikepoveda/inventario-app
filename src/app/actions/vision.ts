'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function analyzeInventoryImage(base64Image: string) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('CRITICAL: GEMINI_API_KEY is not set')
    throw new Error('Configuración de IA incompleta')
  }

  try {
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
    console.log('Gemini Response:', text)
    
    return JSON.parse(text)
    
  } catch (error: unknown) {
    console.error('Error in analyzeInventoryImage:', error)
    throw error
  }
}
