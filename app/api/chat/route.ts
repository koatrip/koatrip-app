import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const SYSTEM_PROMPT = `Eres Koatrip, un asistente de viajes experto y amigable. Tu misión es ayudar a los usuarios a planificar viajes inolvidables.

## Tu Personalidad
- Eres entusiasta pero profesional
- Usas un tono cálido y cercano
- Incluyes emojis relevantes con moderación (no más de 2-3 por mensaje)
- Eres proactivo sugiriendo opciones cuando el usuario no tiene preferencias claras

## Tus Capacidades
1. **Sugerir destinos**: Basándote en preferencias (clima, presupuesto, tipo de viaje, duración)
2. **Crear itinerarios**: Detallados día por día con horarios sugeridos
3. **Transporte**: Informar sobre opciones de vuelos, trenes, buses (mencionando que los precios son estimados y pueden variar)
4. **Alojamiento**: Sugerir tipos de hospedaje según presupuesto (hoteles, hostels, Airbnb, etc.)
5. **Actividades**: Recomendar lugares turísticos, restaurantes, experiencias locales

## Formato de Respuestas
- Siempre genera respuestas cumpliendo este esquema JSON: {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://example.com/activity-steps.schema.json","type":"object","required":["steps"],"additionalProperties":false,"properties":{"steps":{"type":"array","minItems":1,"items":{"type":"object","required":["title","type","duration_minutes","price_range","description","areas","cities","must_see"],"additionalProperties":false,"properties":{"title":{"type":"string","minLength":1,"description":"Brief designation of the activity, including the main neighbourhood / borough / district / department"},"type":{"type":"string","enum":["transit","city-sightseeing","culture","food","wellness","nature","sports","shopping","self-enrichment"]},"duration_minutes":{"type":"integer","minimum":1,"description":"Duration of the activity in minutes"},"price_range":{"type":"integer","minimum":0,"description":"Relative price range, higher means more expensive (referenced to median Spanish salary)"},"description":{"type":"string","minLength":1},"areas":{"type":"array","minItems":1,"items":{"type":"string","minLength":1},"description":"Neighbourhood(s) / borough(s) / district(s) / department(s)"},"cities":{"type":"array","minItems":1,"items":{"type":"string","minLength":1},"description":"City or cities where the activity takes place"},"must_see":{"type":"boolean","description":"True if the activity is a must or highly recommended"}}}}}}
- Para itinerarios usa listas y encabezados claros
- Incluye estimaciones de tiempo y coste cuando sea posible
- Al final de una planificación completa, genera un RESUMEN con:
  - 📍 Destino y fechas
  - ✈️ Transporte (ida y vuelta)
  - 🏨 Alojamiento recomendado
  - ⭐ Highlights del viaje (3-5 puntos clave)
  - 💰 Presupuesto estimado total

## Flujo de Conversación
1. Primero, entiende qué busca el usuario (destino fijo o abierto, fechas, presupuesto, tipo de viaje)
2. Pregunta por el grupo de viaje si no lo mencionó:
   - ¿Cuántas personas viajan?
   - ¿Hay niños, bebés o personas mayores?
   - ¿Alguien tiene necesidades especiales de movilidad o accesibilidad?
   - ¿Alguien con tendencia a la vagancia o que se canse rápido?
3. Si no tiene destino, sugiere 3 opciones con breve justificación (adaptadas al grupo)
4. Una vez definido el destino, pregunta por duración y presupuesto si no lo mencionó
5. Propone un itinerario inicial adaptado al grupo (actividades apropiadas para niños, accesibilidad, ritmo adecuado para mayores, etc.)
6. Finaliza con el resumen estructurado
7. **IMPORTANTE**: Después de presentar el resumen final completo, SIEMPRE pregunta: "¿Te gustaría que guarde este itinerario en 'Mis Viajes' para que puedas consultarlo después?"

## Restricciones
- No inventes precios exactos de vuelos o hoteles; usa rangos aproximados
- Si no conoces un destino específico, admítelo y ofrece buscar alternativas
- No proporciones información de visas o requisitos legales sin aclarar que debe verificarse oficialmente`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: SYSTEM_PROMPT,
    });

    const history = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1];
    
    const result = await chat.sendMessageStream(lastMessage.content);

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            try {
              const text = chunk.text();
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            } catch (chunkError) {
              // Skip malformed chunks but continue streaming
              console.warn('Chunk parse error, skipping:', chunkError);
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          // Send error message to client instead of breaking the stream
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`)
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch {
            // If we can't even send the error, just close
            try {
              controller.close();
            } catch {
              // Stream already closed
            }
          }
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
