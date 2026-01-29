'use client';

import { Trip } from '@/types/trip';

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
  onDelete: () => void;
  onViewChat?: () => void;
}

export default function TripCard({ trip, onClick, onDelete, onViewChat }: TripCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this trip?')) {
      onDelete();
    }
  };

  const handleViewChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewChat?.();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-6 shadow-sm border border-[#e8e4dc] cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-[#7c9885] animate-fadeInUp"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-[family-name:var(--font-family-serif)] text-[20px] font-semibold text-[#4a4a4a] mb-1">
            {trip.destination}
          </h3>
          {trip.duration && (
            <p className="text-[13px] text-gray-500">{trip.duration}</p>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          title="Delete trip"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Info rows */}
      <div className="space-y-2 mb-4">
        {trip.dates.start && (
          <div className="flex items-center gap-2 text-[14px] text-gray-600">
            <span>📅</span>
            <span>
              {trip.dates.start}
              {trip.dates.end && ` - ${trip.dates.end}`}
            </span>
          </div>
        )}
        {trip.transport && (
          <div className="flex items-center gap-2 text-[14px] text-gray-600">
            <span>✈️</span>
            <span className="truncate">{trip.transport}</span>
          </div>
        )}
        {trip.budget && (
          <div className="flex items-center gap-2 text-[14px] text-gray-600">
            <span>💰</span>
            <span className="truncate">{trip.budget}</span>
          </div>
        )}
      </div>

      {/* Highlights preview */}
      {trip.highlights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {trip.highlights.slice(0, 2).map((highlight, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-[#faf8f4] text-[12px] text-[#7c9885] rounded-full"
            >
              {highlight.length > 30 ? highlight.slice(0, 30) + '...' : highlight}
            </span>
          ))}
          {trip.highlights.length > 2 && (
            <span className="px-3 py-1 text-[12px] text-gray-400">
              +{trip.highlights.length - 2} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-[#e8e4dc] flex justify-between items-center">
        <span className="text-[12px] text-gray-400">
          {formatDate(trip.createdAt)}
        </span>
        {trip.chatId && onViewChat && (
          <button
            onClick={handleViewChat}
            className="px-2 py-0.5 bg-[#e8f5e9] text-[#2e7d32] text-[11px] rounded-full flex items-center gap-1 hover:bg-[#c8e6c9] transition-colors cursor-pointer"
          >
            💬 View chat
          </button>
        )}
      </div>
    </div>
  );
}
