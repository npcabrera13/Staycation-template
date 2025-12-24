import React, { useState } from 'react';
import { X, Search, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Booking, Room } from '../types';

interface BookingLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  rooms: Room[];
}

const BookingLookupModal: React.FC<BookingLookupModalProps> = ({ isOpen, onClose, bookings, rooms }) => {
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState(false);
  const [foundBookings, setFoundBookings] = useState<Booking[]>([]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const results = bookings.filter(b => b.email.toLowerCase() === email.toLowerCase().trim());
    setFoundBookings(results);
    setSearched(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle size={16} className="mr-1" />;
      case 'cancelled': return <XCircle size={16} className="mr-1" />;
      default: return <Clock size={16} className="mr-1" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md md:max-w-lg overflow-hidden animate-pop mx-2">
        <div className="bg-secondary p-6 text-white flex justify-between items-center">
          <h3 className="text-xl font-serif font-bold">My Bookings</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 md:p-6">
          <form onSubmit={handleSearch} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Enter your email address</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-base"
                required
              />
              <button
                type="submit"
                className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-hover transition-colors flex items-center justify-center"
              >
                <Search size={18} className="mr-2 sm:mr-0" />
                <span className="sm:hidden">Search</span>
              </button>
            </div>
          </form>

          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
            {searched && foundBookings.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                <p>No bookings found for this email.</p>
              </div>
            )}

            {foundBookings.map(booking => {
              const room = rooms.find(r => r.id === booking.roomId);
              return (
                <div key={booking.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-800">{room?.name || 'Unknown Room'}</h4>
                      <span className="text-xs text-gray-500">ID: {booking.id.slice(0, 8)}...</span>
                    </div>
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      <span className="capitalize">{booking.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <Calendar size={16} className="mr-2 text-gray-400" />
                    <span>{booking.checkIn}</span>
                    <span className="mx-2">→</span>
                    <span>{booking.checkOut}</span>
                  </div>

                  <div className="mt-3 flex justify-between items-center text-sm">
                    <span className="text-gray-500">{booking.guests} Guests</span>
                    <span className="font-bold text-secondary">₱{booking.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingLookupModal;