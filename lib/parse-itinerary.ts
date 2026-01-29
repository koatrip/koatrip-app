import { ParsedItinerary } from '@/types/trip';

function sortStepsByEta(a: any, b: any): any {
  return new Date(a.eta).getTime() < new Date(b.eta).getTime() ? -1 : 1;
}

function asItinerary(itinerary: any): ParsedItinerary | null {
  // FIXME What if the trip spans many cities and/or vast distances?
  let transport = '';
  let accommodation = '';
  const highlights = [];
  const steps = (itinerary.steps || []).filter((step) => !!step).sort(sortStepsByEta);
  for (const step of steps) {
     switch (step.type || '') {
       case 'transit':
         if (!transport) {
           transport = step.title;
         }
         break;
       case 'accommodation':
         if (!accommodation) {
           accommodation = step.title;
         }
         break;
       default:
         highlights.push(step.title);
         break;
     }
  }
  return {
    destination: itinerary.destination,
    dates: itinerary.dates,
    transport: transport,
    accommodation: accommodation,
    highlights: highlights,
    budget: itinerary.budget
  } as any as ParsedItinerary;
}

/**
 * Parse an itinerary message from the assistant to extract structured data.
 */
export function parseItinerary(content: string): ParsedItinerary | null {
  try {
    const parsed = JSON.parse(content);
    return asItinerary(parsed);
  } catch (error) {
    console.error('Error parsing itinerary as JSON: ', error);
  }

  try {
    const destination = extractDestination(content);
    if (!destination) return null;

    const dates = parsed.dates;
    const dateRange = extractDates(content);
    const transport = extractSection(content, ['Transporte', 'Transport', 'Vuelos', 'Flights']);
    const accommodation = extractSection(content, ['Alojamiento', 'Accommodation', 'Hotel']);
    const highlights = extractHighlights(content);
    const budget = parsed.budget || extractBudget(content);

    return {
      destination,
      dateRange,
      transport,
      accommodation,
      highlights,
      budget,
    };
  } catch (error) {
    console.error('Error parsing itinerary:', error);
    return null;
  }
}

function extractDestination(content: string): string {
  // Pattern 1: RESUMEN DE TU VIAJE A DESTINO
  const pattern1 = content.match(/VIAJE\s+A\s+([^(\n]+)/i);
  if (pattern1) return pattern1[1].trim();

  // Pattern 2: Destino: Ciudad, País
  const pattern2 = content.match(/Destino[^:]*:\s*([^|\n]+)/i);
  if (pattern2) return pattern2[1].trim();

  return '';
}

function extractDates(content: string): string {
  const datePatterns = [
    /(\d{1,2}[-\/]\d{1,2}\s+\w+)/i,
    /(\w+\s+\d{1,2}\s+de\s+\w+\s+a\s+\w+\s+\d{1,2}(?:\s+de\s+\w+)?)/i,
    /fechas[^:]*:\s*([^|\n]+)/i,
    /(\d{1,2}\s+de\s+\w+\s+a\s+\d{1,2}\s+de\s+\w+)/i,
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) return match[1].trim();
  }

  return '';
}

function extractSection(content: string, keywords: string[]): string {
  for (const keyword of keywords) {
    const pattern = new RegExp(`${keyword}[^:]*:\\s*([^\\n]+)`, 'i');
    const match = content.match(pattern);
    if (match) return match[1].trim().split('.')[0];
  }
  return '';
}

function extractHighlights(content: string): string[] {
  const highlights: string[] = [];

  // Look for highlights section
  const highlightSection = content.match(
    /Highlights?[^:]*:([\s\S]*?)(?=\n[A-Z💰]|\n\*\*|\n##|Presupuesto|$)/i
  );

  if (highlightSection) {
    const lines = highlightSection[1].split('\n');
    for (const line of lines) {
      const cleaned = line.replace(/^[-*•]\s*/, '').trim();
      if (cleaned && cleaned.length > 3 && !cleaned.startsWith('**')) {
        highlights.push(cleaned);
      }
    }
  }

  return highlights.slice(0, 5);
}

function extractBudget(content: string): string {
  const budgetPatterns = [
    /Presupuesto\s*(?:total|estimado)?[^:]*:\s*([^\n]+)/i,
    /(\~?\s*\d+[€$]\s*[-–]\s*\d+[€$][^\n]*)/,
    /Total[^:]*:\s*([^\n]*\d+[€$][^\n]*)/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = content.match(pattern);
    if (match) return match[1].trim();
  }

  return '';
}

/**
 * Detect if the assistant is asking about saving the itinerary
 * Only matches questions, not statements like "Ya he guardado".
 */
export function detectSavePrompt(message: string): boolean {
  // Must be a question about saving (contains ? or questioning words)
  const isQuestion = message.includes('?') ||
    /\b(quieres|deseas|te\s+gustar[ií]a|would\s+you\s+like)\b/i.test(message);

  if (!isQuestion) return false;

  // Patterns that indicate asking to save
  const savePromptPatterns = [
    /guardar\s*(este\s+)?itinerario/i,
    /guardar\s*(este\s+)?viaje/i,
    /quieres\s+que\s+(lo\s+)?guarde/i,
    /deseas\s+guardar/i,
    /te\s+gustar[ií]a\s+guardar/i,
    /te\s+gustar[ií]a\s+que\s+(lo\s+)?guarde/i,
    /save\s*(this\s+)?itinerary/i,
    /would\s+you\s+like.*save/i,
    /guardar.*["']?Mis\s+Viajes["']?/i,
    /save.*["']?My\s+Trips["']?/i,
  ];

  return savePromptPatterns.some((pattern) => pattern.test(message));
}

/**
 * Detect if the user confirms saving.
 */
export function detectSaveConfirmation(message: string): boolean {
  const positivePatterns = [
    /^s[ií]$/i,
    /^s[ií],?\s/i,
    /^guardar?$/i,
    /^gu[aá]rdalo$/i,
    /^claro$/i,
    /^por supuesto$/i,
    /^dale$/i,
    /^ok$/i,
    /^vale$/i,
    /^yes$/i,
    /^save$/i,
  ];

  const normalizedMessage = message.toLowerCase().trim();
  return positivePatterns.some((pattern) => pattern.test(normalizedMessage));
}

/**
 * Find the message containing the itinerary summary.
 */
export function findItineraryMessage(
  messages: Array<{ role: string; content: string }>
): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (
      messages[i].role === 'assistant' &&
      messages[i].content.includes('RESUMEN')
    ) {
      return messages[i].content;
    }
  }
  return null;
}

/**
 * Parse date range string to start/end dates.
 */
export function parseDateRange(dateRange: string): { start: string; end: string } {
  // Try to extract start and end from patterns like "8 al 11 de Enero"
  const match = dateRange.match(/(\d{1,2})\s*(?:al|a|-)\s*(\d{1,2})\s*(?:de\s+)?(\w+)/i);
  if (match) {
    const [, startDay, endDay, month] = match;
    return {
      start: `${startDay} ${month}`,
      end: `${endDay} ${month}`,
    };
  }

  return { start: dateRange, end: '' };
}

/**
 * Calculate duration from date range.
 */
export function calculateDuration(dateRange: any): string {
  if (dateRange.start && dateRange.end) {
    const days = Math.ceil((new Date(dateRange.end) - new Date(dateRange.start)) / 86400000);
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
  if (typeof dateRange === 'string') {
    const match = dateRange.match(/(\d{1,2})\s*(?:al|a|-)\s*(\d{1,2})/);
    if (match) {
      const days = parseInt(match[2]) - parseInt(match[1]) + 1;
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    }
  }
  return '';
}
