export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SavedChat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  tripId?: string;
}
