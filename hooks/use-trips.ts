'use client';

import { useState, useCallback } from 'react';
import { Trip } from '@/types/trip';

const STORAGE_KEY = 'koatrip_saved_trips';

function loadTripsFromStorage(): Trip[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useTrips() {
  // Lazy initialization from localStorage
  const [trips, setTrips] = useState<Trip[]>(() => loadTripsFromStorage());

  const saveTrip = useCallback((tripData: Omit<Trip, 'id' | 'createdAt'>) => {
    const existing = tripData.chatId
      ? trips.find((t) => t.chatId === tripData.chatId)
      : null;

    const trip: Trip = existing
      ? { ...existing, ...tripData }
      : { ...tripData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };

    const updated = existing
      ? trips.map((t) => (t.id === existing.id ? trip : t))
      : [trip, ...trips];

    setTrips(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return trip;
  }, [trips]);

  const deleteTrip = useCallback((id: string) => {
    setTrips((prev) => {
      const updated = prev.filter((trip) => trip.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getTripById = useCallback(
    (id: string) => trips.find((trip) => trip.id === id),
    [trips]
  );

  const getTripByChatId = useCallback(
    (chatId: string) => trips.find((trip) => trip.chatId === chatId),
    [trips]
  );

  return {
    trips,
    isLoaded: true,
    saveTrip,
    deleteTrip,
    getTripById,
    getTripByChatId,
  };
}
