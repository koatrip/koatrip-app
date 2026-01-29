'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import ChatCard from '@/components/chat-card';
import TripDetail from '@/components/trip-detail';
import { useSavedChats } from '@/hooks/use-saved-chats';
import { useTrips } from '@/hooks/use-trips';
import { Trip } from '@/types/trip';

export default function MyChatsPage() {
  const { chats, deleteChat, getChatById } = useSavedChats();
  const { getTripById, deleteTrip } = useTrips();
  const router = useRouter();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const handleChatClick = (chatId: string) => {
    router.push(`/?load=${chatId}`);
  };

  const handleViewTrip = (tripId: string, chatId: string) => {
    const trip = getTripById(tripId);
    if (trip) {
      setSelectedTrip(trip);
      setSelectedChatId(chatId);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#faf8f4]">
      <Sidebar />

      <main className="ml-[260px] flex-1 p-8 relative">
        {/* Decorative elements */}
        <div className="absolute top-[-50px] right-[-50px] text-[240px] opacity-[0.06] pointer-events-none rotate-[25deg] text-[#7c9885] z-0">
          🌿
        </div>

        <div className="max-w-[1000px] mx-auto relative z-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-[family-name:var(--font-family-serif)] text-[36px] font-semibold text-[#4a4a4a] mb-2">
              My Chats
            </h1>
            <p className="text-[16px] text-gray-600">
              {chats.length === 0
                ? "You don't have any saved chats yet"
                : `${chats.length} saved chat${chats.length > 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Empty state */}
          {chats.length === 0 && (
            <div className="text-center py-16 animate-fadeInUp">
              <div className="text-[80px] mb-6">💬</div>
              <h2 className="text-[24px] font-medium text-[#4a4a4a] mb-3">
                No chat history yet
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start planning a trip with Koatrip and your conversations will be saved here automatically.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#7c9885] text-white rounded-xl font-medium transition-all hover:bg-[#6a8573] hover:-translate-y-0.5"
              >
                <span>🐨</span>
                Start a conversation
              </Link>
            </div>
          )}

          {/* Chat grid */}
          {chats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chats.map((chat) => (
                <ChatCard
                  key={chat.id}
                  chat={chat}
                  onClick={() => handleChatClick(chat.id)}
                  onDelete={() => deleteChat(chat.id)}
                  onViewTrip={chat.tripId ? () => handleViewTrip(chat.tripId!, chat.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Trip detail modal */}
        {selectedTrip && (
          <TripDetail
            trip={selectedTrip}
            onClose={() => {
              setSelectedTrip(null);
              setSelectedChatId(null);
            }}
            onDelete={() => {
              deleteTrip(selectedTrip.id);
              setSelectedTrip(null);
              setSelectedChatId(null);
            }}
            linkedChat={selectedChatId ? getChatById(selectedChatId) : undefined}
          />
        )}
      </main>
    </div>
  );
}
