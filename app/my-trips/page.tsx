'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import TripCard from '@/components/trip-card';
import TripDetail from '@/components/trip-detail';
import { useTrips } from '@/hooks/use-trips';
import { useSavedChats } from '@/hooks/use-saved-chats';
import { Trip } from '@/types/trip';

export default function MyTripsPage() {
  const router = useRouter();
  const { trips, isLoaded, deleteTrip } = useTrips();
  const { getChatById } = useSavedChats();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen bg-[#faf8f4]">
        <Sidebar />
        <main className="ml-[260px] flex-1 flex items-center justify-center">
          <div className="animate-pulse text-[#7c9885]">Loading...</div>
        </main>
      </div>
    );
  }

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
              My Trips
            </h1>
            <p className="text-[16px] text-gray-600">
              {trips.length === 0
                ? "You don't have any saved trips yet"
                : `${trips.length} saved trip${trips.length > 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Empty state */}
          {trips.length === 0 && (
            <div className="text-center py-16 animate-fadeInUp">
              <div className="text-[80px] mb-6">🎒</div>
              <h2 className="text-[24px] font-medium text-[#4a4a4a] mb-3">
                Your backpack is empty
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Plan your next trip with Koatrip and save it here to access it
                anytime.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#7c9885] text-white rounded-xl font-medium transition-all hover:bg-[#6a8573] hover:-translate-y-0.5"
              >
                <span>🐨</span>
                Plan a trip
              </Link>
            </div>
          )}

          {/* Trip grid */}
          {trips.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => setSelectedTrip(trip)}
                  onDelete={() => deleteTrip(trip.id)}
                  onViewChat={trip.chatId ? () => router.push(`/?load=${trip.chatId}`) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Trip detail modal */}
        {selectedTrip && (
          <TripDetail
            trip={selectedTrip}
            onClose={() => setSelectedTrip(null)}
            onDelete={() => {
              deleteTrip(selectedTrip.id);
              setSelectedTrip(null);
            }}
            linkedChat={selectedTrip.chatId ? getChatById(selectedTrip.chatId) : undefined}
          />
        )}
      </main>
    </div>
  );
}
