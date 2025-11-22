import React, { useState, useMemo } from 'react';
import { Calendar, Users, Search } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Room } from '../types';

interface SearchBarProps {
  rooms: Room[];
  onSearch: (filters: { checkIn: Date | null; checkOut: Date | null; guests: number }) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ rooms, onSearch }) => {
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [guests, setGuests] = useState<number>(1);

  const maxGuests = useMemo(() => {
      if (!rooms || rooms.length === 0) return 6;
      return Math.max(...rooms.map(r => r.capacity));
  }, [rooms]);

  const handleSearchClick = () => {
    onSearch({
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      guests
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-4 -mt-12 relative z-20 animate-fade-in-up border border-gray-100">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        
        {/* Check In */}
        <div className="w-full md:w-1/3 relative group">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Check In</label>
          <div className="relative bg-gray-50 rounded-xl border border-transparent group-hover:border-gray-200 transition-colors">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={20} />
            <input 
              type="date" 
              min={new Date().toISOString().split('T')[0]}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full bg-transparent py-3 pl-12 pr-4 text-gray-700 font-medium outline-none rounded-xl cursor-pointer"
            />
          </div>
        </div>

        {/* Check Out */}
        <div className="w-full md:w-1/3 relative group">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Check Out</label>
          <div className="relative bg-gray-50 rounded-xl border border-transparent group-hover:border-gray-200 transition-colors">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={20} />
            <input 
              type="date" 
              min={checkIn ? format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd') : new Date().toISOString().split('T')[0]}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-transparent py-3 pl-12 pr-4 text-gray-700 font-medium outline-none rounded-xl cursor-pointer"
            />
          </div>
        </div>

        {/* Guests */}
        <div className="w-full md:w-1/4 relative group">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Guests</label>
          <div className="relative bg-gray-50 rounded-xl border border-transparent group-hover:border-gray-200 transition-colors">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={20} />
            <select 
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full bg-transparent py-3 pl-12 pr-4 text-gray-700 font-medium outline-none rounded-xl appearance-none cursor-pointer"
            >
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Button */}
        <div className="w-full md:w-auto mt-5 md:mt-0">
          <button 
            onClick={handleSearchClick}
            className="w-full bg-accent hover:bg-secondary text-secondary hover:text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
          >
            <Search size={20} className="md:mr-2" />
            <span className="md:hidden">Check Availability</span>
            <span className="hidden md:inline">Check</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;