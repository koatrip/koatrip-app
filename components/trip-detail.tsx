'use client';

import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';
import { Trip } from '@/types/trip';
import { SavedChat } from '@/types/chat';

interface TripDetailProps {
  trip: Trip;
  onClose: () => void;
  onDelete: () => void;
  linkedChat?: SavedChat;
}

export default function TripDetail({
  trip,
  onClose,
  onDelete,
  linkedChat,
}: TripDetailProps) {
  const router = useRouter();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleViewChat = () => {
    if (linkedChat) {
      router.push(`/?load=${linkedChat.id}`);
      onClose();
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this trip?')) {
      onDelete();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e8e4dc] px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="font-[family-name:var(--font-family-serif)] text-[24px] font-semibold text-[#4a4a4a]">
              {trip.destination}
            </h2>
            {trip.duration && (
              <p className="text-[14px] text-gray-500">{trip.duration}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Quick info grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#faf8f4] rounded-xl p-4">
              <div className="text-[13px] text-gray-500 mb-1">Dates</div>
              <div className="text-[15px] text-[#4a4a4a]">
                📅 {trip.dates.start}
                {trip.dates.end && ` - ${trip.dates.end}`}
              </div>
            </div>
            <div className="bg-[#faf8f4] rounded-xl p-4">
              <div className="text-[13px] text-gray-500 mb-1">Budget</div>
              <div className="text-[15px] text-[#4a4a4a]">
                💰 {trip.budget || 'Not specified'}
              </div>
            </div>
            <div className="bg-[#faf8f4] rounded-xl p-4">
              <div className="text-[13px] text-gray-500 mb-1">Transport</div>
              <div className="text-[15px] text-[#4a4a4a]">
                ✈️ {trip.transport || 'Not specified'}
              </div>
            </div>
            <div className="bg-[#faf8f4] rounded-xl p-4">
              <div className="text-[13px] text-gray-500 mb-1">Accommodation</div>
              <div className="text-[15px] text-[#4a4a4a]">
                🏨 {trip.accommodation || 'Not specified'}
              </div>
            </div>
          </div>

          {/* Highlights */}
          {trip.highlights.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[16px] font-medium text-[#4a4a4a] mb-3">
                ⭐ Highlights
              </h3>
              <ul className="space-y-2">
                {trip.highlights.map((highlight, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-[15px] text-gray-600"
                  >
                    <span className="text-[#7c9885]">•</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full itinerary */}
          <div>
            <h3 className="text-[16px] font-medium text-[#4a4a4a] mb-3">
              📋 Full Itinerary
            </h3>
            <div className="prose prose-sm max-w-none bg-[#faf8f4] rounded-xl p-6 prose-headings:text-[#4a4a4a] prose-strong:text-[#4a4a4a]">
              <ReactMarkdown>{trip.fullItinerary}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#e8e4dc] px-6 py-4 flex justify-between items-center">
          {linkedChat ? (
            <button
              onClick={handleViewChat}
              className="px-5 py-2.5 border border-[#7c9885] text-[#7c9885] rounded-xl text-[14px] font-medium transition-all hover:bg-[#7c9885] hover:text-white cursor-pointer flex items-center gap-2"
            >
              💬 View chat
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleDelete}
            className="px-5 py-2.5 text-red-600 border border-red-200 rounded-xl text-[14px] font-medium transition-all hover:bg-red-50 cursor-pointer"
          >
            Delete trip
          </button>
        </div>
      </div>
    </div>
  );
}
