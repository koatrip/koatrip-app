'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import Chat from '@/components/chat';
import UserInput from '@/components/user-input';
import { useChat } from '@/hooks/use-chat';
import { useTrips } from '@/hooks/use-trips';
import { useSavedChats } from '@/hooks/use-saved-chats';
import {
  parseItinerary,
  detectSavePrompt,
  detectSaveConfirmation,
  findItineraryMessage,
  parseDateRange,
  calculateDuration,
} from '@/lib/parse-itinerary';

function HomeContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const { messages, isLoading, error, sendMessage, retryMessage, clearMessages, loadMessages } = useChat();
  const { saveTrip, getTripByChatId } = useTrips();
  const { saveChat, getChatById, linkTripToChat } = useSavedChats();
  const [itineraryToSave, setItineraryToSave] = useState<string | null>(null);
  const [tripSaved, setTripSaved] = useState(false);
  const [lastProcessedLength, setLastProcessedLength] = useState(0);
  const [awaitingSaveConfirmation, setAwaitingSaveConfirmation] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset chat when navigating with ?new param
  useEffect(() => {
    const newParam = searchParams.get('new');
    if (newParam) {
      clearMessages();
      // Use setTimeout to avoid setState cascade in effect
      setTimeout(() => {
        setMessage('');
        setItineraryToSave(null);
        setTripSaved(false);
        setLastProcessedLength(0);
        setCurrentChatId(null);
        setAwaitingSaveConfirmation(false);
      }, 0);
      // Clean up the URL without the param
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams, clearMessages]);

  // Load chat when navigating with ?load param
  useEffect(() => {
    const loadParam = searchParams.get('load');
    if (loadParam) {
      const chat = getChatById(loadParam);
      if (chat) {
        loadMessages(chat.messages);
        // Use setTimeout to avoid setState cascade in effect
        setTimeout(() => {
          setCurrentChatId(loadParam);
          setLastProcessedLength(chat.messages.length);
        }, 0);
      }
      // Clean up the URL without the param
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams, getChatById, loadMessages]);

  // Auto-save chat when messages change (debounced)
  useEffect(() => {
    if (messages.length === 0 || isLoading) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 2 seconds after last message
    saveTimeoutRef.current = setTimeout(() => {
      const newId = saveChat(messages, currentChatId || undefined);
      if (newId && !currentChatId) {
        setCurrentChatId(newId);
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages, isLoading, currentChatId, saveChat]);

  // Detect when the assistant asks about saving
  useEffect(() => {
    // Only process new messages
    if (
      messages.length > lastProcessedLength &&
      !isLoading &&
      !tripSaved &&
      !awaitingSaveConfirmation
    ) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.role === 'assistant' &&
        detectSavePrompt(lastMessage.content)
      ) {
        const itineraryMsg = findItineraryMessage(messages);
        if (itineraryMsg) {
          // Use setTimeout to avoid synchronous setState in effect
          setTimeout(() => {
            setItineraryToSave(itineraryMsg);
            setAwaitingSaveConfirmation(true);
            setLastProcessedLength(messages.length);
          }, 0);
        }
      }
    }
  }, [messages, isLoading, tripSaved, awaitingSaveConfirmation, lastProcessedLength]);

  const handleSend = async () => {
    if (message.trim() && !isLoading) {
      const currentMessage = message;
      setMessage('');

      // Check if user is confirming save
      if (awaitingSaveConfirmation && itineraryToSave && detectSaveConfirmation(currentMessage)) {
        handleSaveTrip();
      }
      setAwaitingSaveConfirmation(false);

      await sendMessage(currentMessage);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setMessage(question);
  };

  const handleSaveTrip = () => {
    if (itineraryToSave) {
      const parsed = parseItinerary(itineraryToSave);
      if (parsed) {
        const dates = parseDateRange(parsed.dateRange);
        const duration = calculateDuration(parsed.dateRange);

        // Check if this is a new trip (for linking purposes)
        const isNewTrip = currentChatId ? !getTripByChatId(currentChatId) : true;

        // Upsert trip (creates or updates based on chatId)
        const trip = saveTrip({
          destination: parsed.destination,
          dates,
          duration: duration || parsed.dateRange,
          transport: parsed.transport,
          accommodation: parsed.accommodation,
          highlights: parsed.highlights,
          budget: parsed.budget,
          fullItinerary: itineraryToSave,
          chatId: currentChatId || undefined,
        });

        // Link the chat to the trip (only for new trips)
        if (isNewTrip && currentChatId && trip) {
          linkTripToChat(currentChatId, trip.id);
        }

        setTripSaved(true);
        setItineraryToSave(null);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#faf8f4]">
      <Sidebar />

      <main className="ml-[260px] h-screen flex flex-col relative flex-1">
        <div className="absolute top-[-50px] right-[-50px] text-[240px] opacity-[0.06] pointer-events-none rotate-[25deg] text-[#7c9885] z-0">
          🌿
        </div>
        <div className="absolute bottom-[-80px] left-[-60px] text-[320px] opacity-[0.06] pointer-events-none rotate-[-15deg] text-[#7c9885] z-0">
          🌿
        </div>

        <div className="flex-1 overflow-y-auto px-8 relative z-10">
          <div className="max-w-[800px] mx-auto pb-12">
            <Chat
              messages={messages}
              onQuickQuestion={handleQuickQuestion}
              isLoading={isLoading}
              onRetry={retryMessage}
            />

            {/* Saved confirmation */}
            {tripSaved && (
              <div className="flex justify-start mb-4 animate-fadeInUp">
                <div className="bg-[#e8f5e9] rounded-2xl px-5 py-4 rounded-bl-sm border border-[#a5d6a7]">
                  <p className="text-[15px] text-[#2e7d32] flex items-center gap-2">
                    <span>✅</span>
                    Trip saved to My Trips!
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                Error: {error}
              </div>
            )}
          </div>
        </div>

        <UserInput
          value={message}
          onChange={setMessage}
          onSend={handleSend}
          disabled={isLoading}
        />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-[#faf8f4]">
        <Sidebar />
        <main className="ml-[260px] flex-1 flex items-center justify-center">
          <div className="animate-pulse text-[#7c9885] text-lg">Loading...</div>
        </main>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
