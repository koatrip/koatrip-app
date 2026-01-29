import { GoogleGenerativeAI } from '@google/generative-ai';
import { itinerarySchema } from './itinerary-schema';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const minifiedSchema = JSON.stringify(itinerarySchema);

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
- Siempre genera respuestas JSON que cumplan con este JSON schema: ${minifiedSchema}. Asigna "type" en función de la tipología de la actividad que más se ajuste, y asegúrate de que "title" y "description" son human-readable y atractivos. Ajusta la cantidad, el tipo y el precio de las actividades "transit" en función del coste agregado, las características de los viajeros, las condiciones meteorológicas y su estilo de viaje.
- Para itinerarios usa listas y encabezados claros
- Incluye estimaciones de tiempo y coste cuando sea posible
- Asegúrate de que cada día incluye una parada para desayunar, otra para almorzar y otra para cenar, AL MENOS
- Recuerda que en un viaje medio, una pareja tiene entre 6 y 8 horas realistas para todo lo que no sea alimentarse y descansar. Los viajeros tienen que poder volver al hotel cada día, así que divide de manera apropiada las actividades, idas y vueltas al alojamiento. Bajo ningún concepto son admisibles agregados de más de 16 horas entre salida del alojamiento y vuelta al mismo, pero tampoco te quedes corto, que el viaje hay que aprovecharlo. Escala la cantidad de horas disponibles de manera apropiada para grupos grandes y/o con niños menores de 12 años o personas con menor movilidad.
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
8. **IMPORTANTE**: NO SEAS PESADO, no te excedas en preguntar ni te extiendas más de la cuenta con texto ceremonioso, si ya ha habido un par de intercambios en el mismo chat o el usuario ya te ha aportado suficiente información, haz el mayor esfuerzo en no seguir preguntando si hay datos que puedes inferir o que intuyes que el usuario no considera críticos.

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
