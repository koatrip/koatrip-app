'use client';

import { useState, useCallback } from 'react';
import { SavedChat, ChatMessage } from '@/types/chat';

const STORAGE_KEY = 'koatrip_saved_chats';

function loadChatsFromStorage(): SavedChat[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Extract a title from the first user message
function generateTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === 'user');
  if (!firstUserMessage) return 'New Chat';

  const content = firstUserMessage.content;
  // Take first 50 chars or first sentence
  const truncated = content.length > 50 ? content.slice(0, 50) + '...' : content;
  return truncated.split('\n')[0];
}

export function useSavedChats() {
  const [chats, setChats] = useState<SavedChat[]>(() => loadChatsFromStorage());

  const saveChat = useCallback((messages: ChatMessage[], existingId?: string) => {
    if (messages.length === 0) return null;

    const now = new Date().toISOString();
    const chatId = existingId || crypto.randomUUID();

    setChats((prev) => {
      let updated: SavedChat[];

      if (existingId) {
        updated = prev.map((chat) =>
          chat.id === existingId
            ? { ...chat, messages, title: generateTitle(messages), updatedAt: now }
            : chat
        );
      } else {
        const newChat: SavedChat = {
          id: chatId,
          title: generateTitle(messages),
          messages,
          createdAt: now,
          updatedAt: now,
        };
        updated = [newChat, ...prev];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    return chatId;
  }, []);

  const deleteChat = useCallback((id: string) => {
    setChats((prev) => {
      const updated = prev.filter((chat) => chat.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getChatById = useCallback(
    (id: string) => chats.find((chat) => chat.id === id),
    [chats]
  );

  const linkTripToChat = useCallback((chatId: string, tripId: string) => {
    setChats((prev) => {
      const updated = prev.map((chat) =>
        chat.id === chatId ? { ...chat, tripId } : chat
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    chats,
    saveChat,
    deleteChat,
    getChatById,
    linkTripToChat,
  };
}
