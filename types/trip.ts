export interface Trip {
  id: string;
  destination: string;
  dates: {
    start: string;
    end: string;
  };
  duration?: string;
  transport: string;
  accommodation: string;
  highlights: string[];
  budget: string;
  fullItinerary: string;
  createdAt: string;
}

export interface ParsedItinerary {
  destination: string;
  dates?: {
    start: string;
    end: string;
  };
  dateRange?: string;
  transport: string;
  accommodation: string;
  highlights: string[];
  budget: string;
}
