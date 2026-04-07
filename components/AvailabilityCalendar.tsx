import React, { useState } from 'react';
import { format, endOfMonth, eachDayOfInterval, isSameDay, addMonths, isWithinInterval, isBefore, isAfter, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Booking } from '../types';

interface AvailabilityCalendarProps {
  roomId: string;
  bookings: Booking[];
  onDateSelect: (start: Date | null, end: Date | null) => void;
  allowDayUse?: boolean;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ roomId, bookings, onDateSelect, allowDayUse }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter bookings for this room
  const roomBookings = bookings.filter(b => b.roomId === roomId && b.status !== 'cancelled');



  const getDaysInMonth = () => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const isDateBooked = (date: Date) => {
    // Normalize the input date to midnight local time
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return roomBookings.some(booking => {
      // Parse booking dates - they come as YYYY-MM-DD strings
      const [startYear, startMonth, startDay] = booking.checkIn.split('-').map(Number);
      const [endYear, endMonth, endDay] = booking.checkOut.split('-').map(Number);

      const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
      const end = new Date(endYear, endMonth - 1, endDay, 0, 0, 0, 0);

      // Both check-in AND check-out dates are blocked
      return checkDate >= start && checkDate <= end;
    });
  };

  const hasOverlap = (start: Date, end: Date) => {
    const range = eachDayOfInterval({ start, end });
    return range.some(date => isDateBooked(date));
  };

  const handleDateClick = (date: Date) => {
    // Normalize today to midnight local time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Normalize clicked date to midnight local time
    const clickedDate = new Date(date);
    clickedDate.setHours(0, 0, 0, 0);

    setError(null);

    // 1. Basic Validation - compare timestamps for accurate past check
    if (clickedDate.getTime() < today.getTime()) return; // Cannot book past
    if (isDateBooked(date)) {
      setError("This date is unavailable.");
      return;
    }

    // 2. No Start Date Selected yet -> Set Start
    if (!startDate) {
      setStartDate(date);
      if (allowDayUse) {
        // If Day Use is enabled, immediately treat the first click as a single-day booking
        setEndDate(date);
        onDateSelect(date, date);
      } else {
        setEndDate(null);
        onDateSelect(date, null);
      }
      return;
    }

    // 3. Clicking the EXACT Start Date again -> Toggle Single Day or Reset
    if (isSameDay(date, startDate)) {
      if (!endDate) {
        // If no end date yet, treat as Single Day Stay (Start = End)
        setEndDate(date);
        onDateSelect(date, date);
        return;
      }
      // If already has end date (even if same day), Reset
      setStartDate(null);
      setEndDate(null);
      onDateSelect(null, null);
      return;
    }

    // 4. Clicking the EXACT End Date -> Shorten range by 1 day (Deselect just the end date)
    if (endDate && isSameDay(date, endDate)) {
      // Calculate the new end date (one day before the clicked date)
      const newEnd = addDays(date, -1);

      // If the new end date would be before the start date or the same as start date,
      // we effectively just want the Start Date selected (Range of 1 day -> Range of 0/Start Only)
      if (isBefore(newEnd, startDate) || isSameDay(newEnd, startDate)) {
        setEndDate(null);
        onDateSelect(startDate, null);
      } else {
        // Otherwise update end date to previous day (e.g. 21-24 becomes 21-23)
        setEndDate(newEnd);
        onDateSelect(startDate, newEnd);
      }
      return;
    }

    // 5. Clicking BEFORE the Start Date -> New Start Date
    if (isBefore(date, startDate)) {
      setStartDate(date);
      setEndDate(null);
      onDateSelect(date, null);
      return;
    }

    // 6. Clicking AFTER the Start Date -> Set/Update End Date
    if (isAfter(date, startDate)) {
      // Check if the new potential range overlaps with any existing bookings
      if (hasOverlap(startDate, date)) {
        setError("Selection includes unavailable dates. Please select a continuous range.");
        return;
      }

      setEndDate(date);
      onDateSelect(startDate, date);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 animate-fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 px-2">
        <div className="flex items-center text-secondary">
          <CalendarIcon className="mr-3 text-primary" size={22} />
          <h4 className="font-bold text-xl font-serif tracking-wide dark:text-white">{format(currentMonth, 'MMMM yyyy')}</h4>
        </div>
        <div className="flex space-x-3">
          <button onClick={prevMonth} className="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors duration-200 text-gray-600 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-600"><ChevronLeft size={18} /></button>
          <button onClick={nextMonth} className="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors duration-200 text-gray-600 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-600"><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start text-red-700 text-sm animate-slide-in-left">
          <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Days Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-2">
        {getDaysInMonth().map((date, idx) => {
          const booked = isDateBooked(date);
          const isToday = isSameDay(date, today);
          const past = isBefore(date, today);

          // Determine selection state
          const isStart = startDate && isSameDay(date, startDate);
          const isEnd = endDate && isSameDay(date, endDate);
          const isInRange = startDate && endDate && isWithinInterval(date, { start: startDate, end: endDate });

          // Base container style
          let containerClass = 'relative h-10 md:h-12 w-full flex items-center justify-center text-sm font-medium transition-all duration-200';

          // Unified Shape logic: Always rounded for consistent "button" look
          let shapeClass = 'rounded-lg';

          // Unified Color/State Logic
          let bgClass = 'hover:bg-green-50 dark:hover:bg-green-900/30 cursor-pointer text-gray-700 dark:text-gray-200';

          if (isStart || isEnd || isInRange) {
            bgClass = 'bg-primary text-white shadow-md transform scale-105 cursor-pointer hover:brightness-110 z-10';
          } else if (past) {
            bgClass = 'opacity-30 text-gray-400 dark:text-gray-500 cursor-not-allowed hover:bg-transparent';
          } else if (booked) {
            bgClass = 'bg-red-50/50 dark:bg-red-900/30 text-red-300 dark:text-red-400 cursor-not-allowed';
          } else if (isToday) {
            bgClass = 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-primary/30 text-primary font-black cursor-pointer hover:bg-blue-100';
          }

          // Combine classes
          const finalClass = `${containerClass} ${shapeClass} ${bgClass}`;

          return (
            <div className="w-full p-0.5" key={idx}>
              <div
                onClick={() => !past && handleDateClick(date)}
                className={finalClass}
                title={booked ? "Unavailable" : past ? "Past Date" : "Available"}
              >
                {format(date, 'd')}
                {booked && !past && (
                  <div className="absolute -top-0.5 -right-0.5">
                    <div className="w-2 h-2 bg-red-300 rounded-full ring-2 ring-white"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap justify-center items-center text-xs text-gray-500 dark:text-gray-400 gap-x-4 gap-y-2">
        <div className="flex items-center">
          <div className="w-6 h-4 bg-primary rounded-sm mr-2"></div>
          <span className="font-medium">Selected</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 border border-red-200 rounded-sm mr-2"></div>
          <span className="font-medium">Booked</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 border border-gray-200 rounded-sm mr-2"></div>
          <span className="font-medium">Available</span>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;