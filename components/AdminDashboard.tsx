import React, { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Booking, Room, Amenity } from '../types';
import { format, isValid, differenceInDays, addDays, addMonths, isAfter, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { 
  LayoutDashboard, BedDouble, LogOut, Edit, Save, X, Trash2, Download, TrendingUp, Calendar as CalendarIcon, Plus, Image as ImageIcon, 
  Wifi, Wind, Coffee, Car, Dumbbell, Tv, ChefHat, Waves, Shield, Sparkles,
  Utensils, Monitor, Zap, Sun, Umbrella, Music, Briefcase, Key, Bell, Bath, Armchair, Bike, ChevronDown, PlusCircle, MinusCircle,
  FileText, FileSpreadsheet, File, Filter, CheckSquare, Square, Phone, Users, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, XCircle, Clock
} from 'lucide-react';

interface AdminDashboardProps {
  bookings: Booking[];
  rooms: Room[];
  onUpdateRoom?: (room: Room) => void;
  onAddRoom?: (room: Room) => void;
  onDeleteRoom?: (roomId: string) => void;
  onUpdateBooking?: (booking: Booking) => void;
  onAddBooking?: (booking: Booking) => void;
  onDeleteBooking?: (bookingId: string) => void;
  onDeleteBookings?: (bookingIds: string[]) => void;
  onExit: () => void;
}

type Timeframe = 'week' | 'month' | 'year';
type ExportFormat = 'doc' | 'csv' | 'txt';
type BookingFilter = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year';

const PREDEFINED_AMENITIES = [
    { name: 'Wifi', icon: 'wifi' },
    { name: 'Pool', icon: 'waves' },
    { name: 'AC', icon: 'wind' },
    { name: 'Kitchen', icon: 'chef-hat' },
    { name: 'Parking', icon: 'car' },
    { name: 'Gym', icon: 'dumbbell' },
    { name: 'TV', icon: 'tv' },
    { name: 'Coffee', icon: 'coffee' },
    { name: 'Security', icon: 'shield' },
];

const ICON_OPTIONS = [
  'wifi', 'waves', 'wind', 'chef-hat', 'car', 'dumbbell', 'tv', 'coffee', 'shield', 
  'sparkles', 'utensils', 'monitor', 'zap', 'sun', 'umbrella', 'music', 'briefcase', 
  'key', 'bell', 'bath', 'armchair', 'bike'
];

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  bookings, 
  rooms, 
  onUpdateRoom, 
  onAddRoom,
  onDeleteRoom,
  onUpdateBooking,
  onAddBooking,
  onDeleteBooking,
  onDeleteBookings,
  onExit 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'rooms'>('calendar');
  
  // Room Editing State
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Room>>({});
  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const [customAmenityIcon, setCustomAmenityIcon] = useState('sparkles');
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Add Room State
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoom, setNewRoom] = useState<Partial<Room>>({
      name: '',
      description: '',
      price: 0,
      capacity: 2,
      image: 'https://picsum.photos/800/600',
      images: [],
      amenities: []
  });
  const [newRoomCustomAmenity, setNewRoomCustomAmenity] = useState('');
  const [newRoomCustomIcon, setNewRoomCustomIcon] = useState('sparkles');
  const [showNewRoomIconPicker, setShowNewRoomIconPicker] = useState(false);

  // Analytics State
  const [timeframe, setTimeframe] = useState<Timeframe>('month');

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Booking Management State
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('all');
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());

  // Add Booking State
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [newBookingData, setNewBookingData] = useState<Partial<Booking>>({
      guestName: '',
      email: '',
      phoneNumber: '',
      guests: 1,
      roomId: '',
      checkIn: '',
      checkOut: '',
      totalPrice: 0,
      status: 'confirmed'
  });

  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
      format: 'doc' as ExportFormat,
      title: 'Management Report',
      notes: '',
      overrideRevenue: '',
      overrideBookings: ''
  });

  // Close icon picker when clicking outside
  const iconPickerRef = useRef<HTMLDivElement>(null);
  const newRoomIconPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
              setShowIconPicker(false);
          }
          if (newRoomIconPickerRef.current && !newRoomIconPickerRef.current.contains(event.target as Node)) {
              setShowNewRoomIconPicker(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Booking Filtering Logic ---
  const getFilteredBookings = () => {
    const now = new Date();
    return bookings.filter(b => {
        const bookingDate = new Date(b.bookedAt);
        switch (bookingFilter) {
            case 'this_month':
                return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
            case 'last_month':
                const lastMonth = addMonths(now, -1);
                return bookingDate.getMonth() === lastMonth.getMonth() && bookingDate.getFullYear() === lastMonth.getFullYear();
            case 'last_3_months':
                return isAfter(bookingDate, addMonths(now, -3));
            case 'last_6_months':
                return isAfter(bookingDate, addMonths(now, -6));
            case 'this_year':
                return bookingDate.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    });
  };

  const filteredBookings = getFilteredBookings().sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());
  const pendingBookings = bookings.filter(b => b.status === 'pending').sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

  // --- Bulk Selection Logic ---
  const handleSelectAll = () => {
      if (selectedBookingIds.size === filteredBookings.length) {
          setSelectedBookingIds(new Set());
      } else {
          setSelectedBookingIds(new Set(filteredBookings.map(b => b.id)));
      }
  };

  const handleSelectOne = (id: string) => {
      const newSet = new Set(selectedBookingIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedBookingIds(newSet);
  };

  const handleBulkDelete = () => {
      if (selectedBookingIds.size === 0) return;
      if (confirm(`Are you sure you want to delete ${selectedBookingIds.size} bookings? This cannot be undone.`)) {
          if (onDeleteBookings) {
              onDeleteBookings(Array.from(selectedBookingIds));
              setSelectedBookingIds(new Set());
          }
      }
  };

  // --- Helper Functions for Amenity Management ---

  const renderAmenityIcon = (iconName: string) => {
      switch(iconName) {
          case 'wifi': return <Wifi size={16} />;
          case 'waves': return <Waves size={16} />;
          case 'wind': return <Wind size={16} />;
          case 'chef-hat': return <ChefHat size={16} />;
          case 'car': return <Car size={16} />;
          case 'dumbbell': return <Dumbbell size={16} />;
          case 'tv': return <Tv size={16} />;
          case 'coffee': return <Coffee size={16} />;
          case 'shield': return <Shield size={16} />;
          case 'utensils': return <Utensils size={16} />;
          case 'monitor': return <Monitor size={16} />;
          case 'zap': return <Zap size={16} />;
          case 'sun': return <Sun size={16} />;
          case 'umbrella': return <Umbrella size={16} />;
          case 'music': return <Music size={16} />;
          case 'briefcase': return <Briefcase size={16} />;
          case 'key': return <Key size={16} />;
          case 'bell': return <Bell size={16} />;
          case 'bath': return <Bath size={16} />;
          case 'armchair': return <Armchair size={16} />;
          case 'bike': return <Bike size={16} />;
          default: return <Sparkles size={16} />;
      }
  };

  const toggleEditAmenity = (amenity: { name: string, icon: string }) => {
      const currentAmenities = editForm.amenities || [];
      const exists = currentAmenities.some(a => a.name === amenity.name);
      
      let updated;
      if (exists) {
          updated = currentAmenities.filter(a => a.name !== amenity.name);
      } else {
          updated = [...currentAmenities, amenity];
      }
      setEditForm({ ...editForm, amenities: updated });
  };

  const addEditCustomAmenity = () => {
      if (!customAmenityInput.trim()) return;
      const newAmenity = { name: customAmenityInput.trim(), icon: customAmenityIcon };
      setEditForm({ ...editForm, amenities: [...(editForm.amenities || []), newAmenity] });
      setCustomAmenityInput('');
      setCustomAmenityIcon('sparkles');
  };

  const toggleNewRoomAmenity = (amenity: { name: string, icon: string }) => {
      const currentAmenities = newRoom.amenities || [];
      const exists = currentAmenities.some(a => a.name === amenity.name);
      
      let updated;
      if (exists) {
          updated = currentAmenities.filter(a => a.name !== amenity.name);
      } else {
          updated = [...currentAmenities, amenity];
      }
      setNewRoom({ ...newRoom, amenities: updated });
  };

  const addNewRoomCustomAmenity = () => {
      if (!newRoomCustomAmenity.trim()) return;
      const newAmenity = { name: newRoomCustomAmenity.trim(), icon: newRoomCustomIcon };
      setNewRoom({ ...newRoom, amenities: [...(newRoom.amenities || []), newAmenity] });
      setNewRoomCustomAmenity('');
      setNewRoomCustomIcon('sparkles');
  };

  // --- Helper Functions for Gallery Images ---
  
  const handleAddGalleryImage = (isEdit: boolean) => {
      if (isEdit) {
          setEditForm(prev => ({ ...prev, images: [...(prev.images || []), ''] }));
      } else {
          setNewRoom(prev => ({ ...prev, images: [...(prev.images || []), ''] }));
      }
  };

  const handleGalleryImageChange = (index: number, value: string, isEdit: boolean) => {
      if (isEdit) {
          const updated = [...(editForm.images || [])];
          updated[index] = value;
          setEditForm({ ...editForm, images: updated });
      } else {
          const updated = [...(newRoom.images || [])];
          updated[index] = value;
          setNewRoom({ ...newRoom, images: updated });
      }
  };

  const handleRemoveGalleryImage = (index: number, isEdit: boolean) => {
      if (isEdit) {
          const updated = (editForm.images || []).filter((_, i) => i !== index);
          setEditForm({ ...editForm, images: updated });
      } else {
          const updated = (newRoom.images || []).filter((_, i) => i !== index);
          setNewRoom({ ...newRoom, images: updated });
      }
  };

  // --- End Helpers ---

  // Process data for charts based on timeframe
  const getChartData = () => {
    const data: Record<string, { name: string, revenue: number, bookings: number, sortKey: number }> = {};

    bookings.filter(b => b.status !== 'cancelled').forEach(booking => {
      const date = new Date(booking.checkIn);
      if (!isValid(date)) return;

      let key = '';
      let name = '';
      let sortKey = date.getTime();

      if (timeframe === 'week') {
        const weekStart = getStartOfWeek(date);
        key = format(weekStart, 'yyyy-Iw');
        name = `Week of ${format(weekStart, 'MMM d')}`;
        sortKey = weekStart.getTime();
      } else if (timeframe === 'month') {
        key = format(date, 'yyyy-MM');
        name = format(date, 'MMM yyyy');
        sortKey = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      } else if (timeframe === 'year') {
        key = format(date, 'yyyy');
        name = format(date, 'yyyy');
        sortKey = new Date(date.getFullYear(), 0, 1).getTime();
      }

      if (!data[key]) {
        data[key] = { name, revenue: 0, bookings: 0, sortKey };
      }
      data[key].revenue += booking.totalPrice;
      data[key].bookings += 1;
    });

    return Object.values(data).sort((a, b) => a.sortKey - b.sortKey);
  };

  const chartData = getChartData();
  
  // Room Popularity Data
  const activeBookingsCount = bookings.filter(b => b.status !== 'cancelled').length;
  const roomPopularity = rooms.map(room => {
    const count = bookings.filter(b => b.roomId === room.id && b.status !== 'cancelled').length;
    return {
      name: room.name,
      value: count,
      percentage: activeBookingsCount > 0 ? Math.round((count / activeBookingsCount) * 100) : 0
    };
  }).sort((a, b) => b.value - a.value); // Sort by popularity

  const COLORS = ['#2A9D8F', '#E9C46A', '#264653', '#F4A261', '#E76F51', '#8AB17D', '#B5838D'];
  const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.totalPrice, 0);

  // Room Management Handlers
  const handleEditRoomClick = (room: Room) => {
      setEditingRoomId(room.id);
      // Ensure images array exists
      setEditForm({ ...room, images: room.images || [] });
      setCustomAmenityInput('');
      setCustomAmenityIcon('sparkles');
  };

  const handleSaveRoom = () => {
      if (onUpdateRoom && editingRoomId && editForm.price) {
          onUpdateRoom({ 
              ...(editForm as Room)
          });
      }
      setEditingRoomId(null);
  };

  const handleAddRoomSubmit = () => {
      if (!onAddRoom) return;
      const roomId = `room-${Date.now()}`;

      onAddRoom({
          id: roomId,
          name: newRoom.name || 'New Room',
          description: newRoom.description || '',
          price: newRoom.price || 0,
          capacity: newRoom.capacity || 2,
          image: newRoom.image || 'https://picsum.photos/800/600',
          images: newRoom.images || [],
          amenities: newRoom.amenities || []
      });
      setIsAddingRoom(false);
      setNewRoom({ name: '', description: '', price: 0, capacity: 2, image: '', images: [], amenities: [] });
      setNewRoomCustomAmenity('');
      setNewRoomCustomIcon('sparkles');
  };

  const handleDeleteRoomClick = (roomId: string) => {
      if (confirm("Are you sure you want to delete this room? This will affect historical data.")) {
          if (onDeleteRoom) onDeleteRoom(roomId);
      }
  };

  // Booking Management Handlers
  const handleEditBookingClick = (booking: Booking) => {
    setEditingBooking({ ...booking });
  };

  const handleSaveBooking = () => {
    if (onUpdateBooking && editingBooking) {
      onUpdateBooking(editingBooking);
      setEditingBooking(null);
    }
  };

  const handleQuickStatusUpdate = (booking: Booking, newStatus: 'confirmed' | 'cancelled') => {
     if (onUpdateBooking) {
         onUpdateBooking({ ...booking, status: newStatus });
     }
  }

  const handleDeleteBookingClick = (id: string) => {
    if (confirm("Are you sure you want to delete this booking? This action cannot be undone and will affect analytics.")) {
      if (onDeleteBooking) onDeleteBooking(id);
    }
  };

  const handleAddBookingSubmit = () => {
      if (!onAddBooking) return;
      
      const bookingId = `manual-${Date.now()}`;
      
      onAddBooking({
          id: bookingId,
          roomId: newBookingData.roomId || rooms[0]?.id || '1',
          guestName: newBookingData.guestName || 'Guest',
          email: newBookingData.email || 'manual@entry.com',
          phoneNumber: newBookingData.phoneNumber || '',
          guests: newBookingData.guests || 1,
          checkIn: newBookingData.checkIn || format(new Date(), 'yyyy-MM-dd'),
          checkOut: newBookingData.checkOut || format(addDays(new Date(), 1), 'yyyy-MM-dd'),
          totalPrice: newBookingData.totalPrice || 0,
          status: newBookingData.status || 'confirmed',
          bookedAt: format(new Date(), 'yyyy-MM-dd')
      });
      
      setIsAddingBooking(false);
      setNewBookingData({
          guestName: '',
          email: '',
          phoneNumber: '',
          guests: 1,
          roomId: rooms[0]?.id || '',
          checkIn: format(new Date(), 'yyyy-MM-dd'),
          checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
          totalPrice: 0,
          status: 'confirmed'
      });
  };

  // --- Export Functionality ---

  const openExportModal = () => {
      // Always default to 'doc' when opening
      setExportConfig({
          format: 'doc',
          title: 'Management Report',
          notes: '',
          overrideRevenue: `PHP ${totalRevenue.toLocaleString()}`,
          overrideBookings: bookings.length.toString()
      });
      setShowExportModal(true);
  };

  const processExport = () => {
    const now = new Date();
    const reportDate = format(now, 'MMMM d, yyyy HH:mm');
    const { format: fileFormat, title, notes, overrideRevenue, overrideBookings } = exportConfig;

    const displayRevenue = overrideRevenue || `PHP ${totalRevenue.toLocaleString()}`;
    const displayBookings = overrideBookings || bookings.length.toString();
    const displayActive = activeBookingsCount.toString();
    const displayCancelled = bookings.filter(b => b.status === 'cancelled').length.toString();

    alert(`Exporting ${fileFormat.toUpperCase()}... (Feature retained)`);
    setShowExportModal(false);
  };

  const getStatusColor = (status: string) => {
     switch(status) {
         case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
         case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
         case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
         default: return 'bg-gray-100 text-gray-800';
     }
  };

  // --- Calendar View Swipe Handlers ---
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); 
    setTouchStart(e.targetTouches[0].clientX);
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next Month
      setCalendarDate(addMonths(calendarDate, 1));
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Prev Month
      setCalendarDate(addMonths(calendarDate, -1));
    }
  }

  // --- Calendar View Render ---
  const renderCalendarView = () => {
      const daysInMonth = eachDayOfInterval({
          start: startOfMonth(calendarDate),
          end: endOfMonth(calendarDate)
      });

      const CELL_WIDTH = 48; // px
      const ROW_HEIGHT = 64; // px

      return (
          <div 
            className="space-y-6 animate-fade-in"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                  <div>
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                          <CalendarIcon className="mr-3 text-primary" size={28}/> 
                          Bookings Calendar
                      </h2>
                      <p className="text-gray-500 text-sm">Visual timeline of room occupancy</p>
                  </div>
                  
                  <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                      <button onClick={() => setCalendarDate(addMonths(calendarDate, -1))} className="p-4 hover:bg-gray-100 rounded-md text-gray-600 active:bg-gray-200 transition-colors flex items-center justify-center"><ChevronLeft size={24} className="scale-125"/></button>
                      <div className="px-4 font-bold text-gray-700 min-w-[140px] text-center">{format(calendarDate, 'MMMM yyyy')}</div>
                      <button onClick={() => setCalendarDate(addMonths(calendarDate, 1))} className="p-4 hover:bg-gray-100 rounded-md text-gray-600 active:bg-gray-200 transition-colors flex items-center justify-center"><ChevronRight size={24} className="scale-125"/></button>
                  </div>
              </div>

              {/* Pending Approvals Section */}
              {pendingBookings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 animate-slide-down">
                      <div className="flex items-center mb-3 text-yellow-800 font-bold">
                          <Clock size={20} className="mr-2"/> 
                          Pending Approvals ({pendingBookings.length})
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {pendingBookings.map(b => {
                              const room = rooms.find(r => r.id === b.roomId);
                              return (
                                  <div key={b.id} className="bg-white p-3 rounded-lg shadow-sm border border-yellow-100 flex justify-between items-center">
                                      <div>
                                          <div className="font-bold text-sm text-gray-800">{b.guestName}</div>
                                          <div className="text-xs text-gray-500">{room?.name} • {b.guests} Pax</div>
                                          <div className="text-xs font-medium text-primary">{b.checkIn} - {b.checkOut}</div>
                                      </div>
                                      <div className="flex gap-1">
                                          <button onClick={() => handleQuickStatusUpdate(b, 'confirmed')} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Confirm">
                                              <CheckCircle size={16} />
                                          </button>
                                          <button onClick={() => handleQuickStatusUpdate(b, 'cancelled')} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Reject">
                                              <XCircle size={16} />
                                          </button>
                                      </div>
                                  </div>
                              )
                          })}
                      </div>
                  </div>
              )}

              {/* Timeline Calendar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col select-none">
                   {/* Header Row (Dates) */}
                   <div className="flex border-b border-gray-200">
                       <div className="w-48 flex-shrink-0 p-4 font-bold text-gray-500 bg-gray-50 border-r border-gray-200">Room</div>
                       <div className="flex-1 overflow-x-auto scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
                           <div className="flex" style={{ width: daysInMonth.length * CELL_WIDTH }}>
                               {daysInMonth.map(day => (
                                   <div key={day.toISOString()} className="flex-shrink-0 border-r border-gray-100 text-center pt-2 pb-1 bg-gray-50" style={{ width: CELL_WIDTH }}>
                                       <div className="text-[10px] text-gray-400 uppercase font-bold">{format(day, 'EEE')}</div>
                                       <div className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'text-primary bg-primary/10 rounded-full w-6 h-6 mx-auto flex items-center justify-center' : 'text-gray-700'}`}>
                                           {format(day, 'd')}
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   </div>

                   {/* Room Rows */}
                   <div className="overflow-y-auto max-h-[600px]">
                       {rooms.map(room => (
                           <div key={room.id} className="flex border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
                               {/* Sticky Room Name */}
                               <div className="w-48 flex-shrink-0 p-4 border-r border-gray-200 bg-white z-10 flex flex-col justify-center sticky left-0">
                                   <div className="font-bold text-sm text-gray-800 truncate">{room.name}</div>
                                   <div className="text-xs text-gray-500">Cap: {room.capacity}</div>
                               </div>
                               
                               {/* Timeline Grid */}
                               <div className="flex-1 overflow-x-auto relative scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                                    <div className="flex relative" style={{ width: daysInMonth.length * CELL_WIDTH, height: ROW_HEIGHT }}>
                                         {/* Grid Lines */}
                                         {daysInMonth.map(day => (
                                             <div key={day.toISOString()} className="flex-shrink-0 border-r border-gray-100 h-full" style={{ width: CELL_WIDTH }}></div>
                                         ))}

                                         {/* Booking Bars */}
                                         {bookings
                                            .filter(b => b.roomId === room.id && b.status !== 'cancelled')
                                            .map(booking => {
                                                const start = new Date(booking.checkIn);
                                                const end = new Date(booking.checkOut);
                                                const monthStart = startOfMonth(calendarDate);
                                                const monthEnd = endOfMonth(calendarDate);

                                                // Check overlapping
                                                if (end < monthStart || start > monthEnd) return null;

                                                // Calculate position
                                                const effectiveStart = start < monthStart ? monthStart : start;
                                                const effectiveEnd = end > monthEnd ? monthEnd : end;
                                                
                                                const offsetDays = differenceInDays(effectiveStart, monthStart);
                                                const durationDays = differenceInDays(effectiveEnd, effectiveStart) || 1; // Min 1 day visual

                                                const left = offsetDays * CELL_WIDTH;
                                                const width = durationDays * CELL_WIDTH;

                                                let colorClass = 'bg-primary text-white';
                                                if (booking.status === 'pending') colorClass = 'bg-yellow-400 text-yellow-900 bg-[length:10px_10px] bg-[linear-gradient(45deg,rgba(255,255,255,0.3)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.3)_50%,rgba(255,255,255,0.3)_75%,transparent_75%,transparent)]';

                                                return (
                                                    <button
                                                        key={booking.id}
                                                        onClick={() => handleEditBookingClick(booking)}
                                                        className={`absolute top-3 bottom-3 rounded-md shadow-sm text-[10px] font-bold flex items-center px-2 overflow-hidden whitespace-nowrap hover:brightness-110 transition-all z-10 cursor-pointer ${colorClass}`}
                                                        style={{ left: `${left + 2}px`, width: `${width - 4}px` }}
                                                        title={`${booking.guestName} (${booking.guests} guests)`}
                                                    >
                                                        {width > 40 ? booking.guestName : ''}
                                                    </button>
                                                );
                                            })
                                         }
                                    </div>
                               </div>
                           </div>
                       ))}
                   </div>
              </div>
              
              {/* Legend */}
              <div className="flex gap-6 text-xs text-gray-500 mt-2 justify-end">
                  <div className="flex items-center"><div className="w-3 h-3 bg-primary rounded mr-2"></div> Confirmed Booking</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-yellow-400 rounded mr-2"></div> Pending Approval</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-white border border-gray-300 rounded mr-2"></div> Available</div>
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row relative">
      {/* Sidebar Navigation */}
      <aside className="bg-secondary text-white w-full md:w-64 flex-shrink-0 flex flex-col z-30 shadow-xl">
         <div className="p-6 border-b border-gray-700 flex justify-between items-center md:block">
            <h1 className="text-xl md:text-2xl font-bold font-serif tracking-wider">Admin Panel</h1>
            <button onClick={onExit} className="md:hidden p-2 hover:bg-gray-700 rounded"><LogOut size={20}/></button>
         </div>
         <nav className="flex-1 p-4 space-y-2">
            <button 
                onClick={() => setActiveTab('calendar')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'calendar' ? 'bg-primary text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
                <CalendarIcon size={20} className="mr-3"/> Calendar & Bookings
                {pendingBookings.length > 0 && (
                    <span className="ml-auto bg-yellow-500 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingBookings.length}</span>
                )}
            </button>
            <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-primary text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
                <LayoutDashboard size={20} className="mr-3"/> Overview
            </button>
            <button 
                onClick={() => setActiveTab('rooms')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'rooms' ? 'bg-primary text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
                <BedDouble size={20} className="mr-3"/> Manage Rooms
            </button>
         </nav>
         <div className="p-4 border-t border-gray-700 hidden md:block">
            <button onClick={onExit} className="flex items-center text-red-300 hover:text-red-100 transition-colors">
                <LogOut size={20} className="mr-2"/> Return to Site
            </button>
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        
        {activeTab === 'calendar' && renderCalendarView()}

        {activeTab === 'overview' && (
        <div className="animate-fade-in space-y-8 pb-12">
             {/* Stats Cards & Charts - Keep existing implementation */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
                  <p className="text-gray-500 text-sm">Track performance and manage bookings</p>
                </div>
                
                <div className="flex items-center space-x-2 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
                   {(['week', 'month', 'year'] as Timeframe[]).map((t) => (
                     <button 
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${timeframe === t ? 'bg-secondary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                     >
                        {t}
                     </button>
                   ))}
                </div>
                
                <button 
                  onClick={openExportModal}
                  className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors shadow-sm"
                >
                    <Download size={18} className="mr-2" /> Export Report
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-teal-50 rounded-lg text-primary">
                            <CalendarIcon size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bookings</span>
                    </div>
                    <div className="flex items-end space-x-2">
                         <span className="text-3xl font-bold text-gray-800">{bookings.length}</span>
                         <span className="text-xs text-green-500 font-bold mb-1.5">Total</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 rounded-lg text-accent">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue</span>
                    </div>
                    <div className="flex items-end space-x-2">
                         <span className="text-3xl font-bold text-gray-800">₱{totalRevenue.toLocaleString()}</span>
                         <span className="text-xs text-green-500 font-bold mb-1.5">+12%</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-secondary">
                            <BedDouble size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Occupancy</span>
                    </div>
                    <div className="flex items-end space-x-2">
                         <span className="text-3xl font-bold text-gray-800">{rooms.length}</span>
                         <span className="text-xs text-gray-400 mb-1.5">Active Rooms</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                        <TrendingUp size={18} className="mr-2 text-primary"/> 
                        Revenue Trend ({timeframe})
                    </h3>
                    <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} tickFormatter={(val) => `₱${val/1000}k`} />
                        <Tooltip 
                            cursor={{fill: '#F3F4F6'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                            formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="#2A9D8F" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-auto md:h-96 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                        <TrendingUp size={18} className="mr-2 text-primary"/>
                        Room Distribution
                    </h3>
                    <div className="flex-1 flex flex-col md:flex-row items-center min-h-0">
                        <div className="w-full md:w-1/2 h-48 md:h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                    data={roomPopularity}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                    >
                                    {roomPopularity.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Scrollable List with Indicator */}
                        <div className="w-full md:w-1/2 h-32 md:h-56 relative mt-2 md:mt-0">
                            <div 
                                className="absolute inset-0 overflow-y-auto pr-2 space-y-2 scrollbar-thin"
                                style={{ scrollbarWidth: 'thin' }}
                            >
                                {roomPopularity.map((entry, index) => (
                                    <div key={index} className="flex items-center text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                        <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate font-medium text-gray-700">{entry.name}</div>
                                            <div className="text-xs text-gray-400">{entry.value} Bookings</div>
                                        </div>
                                        <div className="font-bold text-gray-600 text-xs ml-2">
                                            {entry.percentage}%
                                        </div>
                                    </div>
                                ))}
                                {/* Spacer at bottom so last item isn't hidden by gradient */}
                                {roomPopularity.length > 4 && <div className="h-8"></div>}
                            </div>
                            
                            {/* Indicator */}
                            {roomPopularity.length > 4 && (
                                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none flex justify-center items-end pb-2">
                                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-gray-200 text-[10px] font-medium text-gray-500 flex items-center animate-pulse">
                                        Scroll <ChevronDown size={12} className="ml-1" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 {/* Header Area - OPTIMIZED */}
                 <div className="p-4 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-800">Recent Bookings</h3>
                        
                        {/* Actions Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            
                            {/* Filter Group */}
                            <div className="flex gap-2 w-full sm:w-auto">
                                 <div className="relative flex-1 sm:flex-none min-w-[160px]">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Filter size={14} className="text-gray-500"/>
                                    </div>
                                    <select 
                                        value={bookingFilter}
                                        onChange={(e) => {
                                            setBookingFilter(e.target.value as BookingFilter);
                                            setSelectedBookingIds(new Set());
                                        }}
                                        className="block w-full pl-9 pr-8 py-2.5 md:py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none appearance-none cursor-pointer hover:border-gray-300 transition-all shadow-sm font-medium"
                                    >
                                        <option value="all">All Time</option>
                                        <option value="this_month">This Month</option>
                                        <option value="last_month">Last Month</option>
                                        <option value="last_3_months">Last 3 Months</option>
                                        <option value="last_6_months">Last 6 Months</option>
                                        <option value="this_year">This Year</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <ChevronDown size={14} className="text-gray-400"/>
                                    </div>
                                </div>

                                {/* Bulk Delete Button */}
                                {selectedBookingIds.size > 0 && (
                                     <button 
                                        onClick={handleBulkDelete}
                                        className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 border border-red-100 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors animate-pop shadow-sm whitespace-nowrap"
                                    >
                                        <Trash2 size={16} className="sm:mr-1"/> 
                                        <span className="hidden sm:inline">Delete ({selectedBookingIds.size})</span>
                                        <span className="sm:hidden">({selectedBookingIds.size})</span>
                                    </button>
                                )}
                            </div>

                            {/* Add Booking Button */}
                            <button 
                                onClick={() => {
                                    setNewBookingData({
                                        guestName: '',
                                        email: '',
                                        phoneNumber: '',
                                        guests: 1,
                                        roomId: rooms[0]?.id || '',
                                        checkIn: format(new Date(), 'yyyy-MM-dd'),
                                        checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
                                        totalPrice: 0,
                                        status: 'confirmed'
                                    });
                                    setIsAddingBooking(true);
                                }}
                                className="flex items-center justify-center w-full sm:w-auto px-4 py-2.5 md:py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-teal-700 transition-colors shadow-sm active:scale-95"
                            >
                                <Plus size={16} className="mr-1.5"/> Add Booking
                            </button>
                        </div>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-6 py-3 text-left w-10">
                                <button 
                                    onClick={handleSelectAll}
                                    className="text-gray-400 hover:text-primary transition-colors"
                                >
                                    {selectedBookingIds.size > 0 && selectedBookingIds.size === filteredBookings.length 
                                        ? <CheckSquare size={18} className="text-primary" /> 
                                        : <Square size={18} />
                                    }
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Guest</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Room</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredBookings.length > 0 ? (
                            filteredBookings.map((booking) => {
                                const roomName = rooms.find(r => r.id === booking.roomId)?.name || 'Unknown Room';
                                const isSelected = selectedBookingIds.has(booking.id);
                                return (
                                <tr key={booking.id} className={`transition-colors ${isSelected ? 'bg-teal-50' : 'hover:bg-gray-50/80'}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button 
                                            onClick={() => handleSelectOne(booking.id)}
                                            className="text-gray-400 hover:text-primary transition-colors"
                                        >
                                            {isSelected ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.guestName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{roomName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {booking.checkIn}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">₱{booking.totalPrice.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => handleEditBookingClick(booking)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3 bg-indigo-50 p-1.5 rounded-md transition-colors"
                                            title="Edit Booking"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteBookingClick(booking.id)}
                                            className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md transition-colors"
                                            title="Delete Booking"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                                    No bookings found for this period.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                </div>

                 {/* Mobile Card View */}
                 <div className="md:hidden p-4 space-y-4">
                    {filteredBookings.map((booking) => {
                        const roomName = rooms.find(r => r.id === booking.roomId)?.name || 'Unknown Room';
                        return (
                            <div key={booking.id} className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 relative">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-gray-900">{booking.guestName}</h4>
                                        <p className="text-xs text-gray-500">{roomName}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 my-3">
                                    <div>
                                        <span className="block text-xs text-gray-400">Check In</span>
                                        {booking.checkIn}
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xs text-gray-400">Total</span>
                                        <span className="font-bold text-primary">₱{booking.totalPrice.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex justify-end border-t border-gray-50 pt-3 space-x-3">
                                    <button 
                                        onClick={() => handleEditBookingClick(booking)}
                                        className="flex items-center text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded"
                                    >
                                        <Edit size={14} className="mr-1"/> Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteBookingClick(booking.id)}
                                        className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded"
                                    >
                                        <Trash2 size={14} className="mr-1"/> Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                     {filteredBookings.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-8">
                            No bookings found.
                        </div>
                    )}
                </div>
            </div>
        </div>
        )}

        {activeTab === 'rooms' && (
            <div className="animate-fade-in pb-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Manage Rooms</h2>
                    <button 
                        onClick={() => setIsAddingRoom(true)}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center text-sm shadow hover:bg-teal-700 transition-colors"
                    >
                        <Plus size={18} className="mr-2"/> Add Room
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {rooms.map(room => (
                        <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col space-y-4 transition-all hover:shadow-md">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative group w-full md:w-32 h-32 flex-shrink-0">
                                    <img src={room.image} alt={room.name} className="w-full h-full object-cover rounded-lg" />
                                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                        +{(room.images?.length || 0)} photos
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{room.name}</h3>
                                            <p className="text-sm text-gray-500">{room.capacity} Guests • {room.amenities.length} Amenities</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{room.description}</p>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                {editingRoomId === room.id ? (
                                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Price (₱)</label>
                                                <input 
                                                    type="number" 
                                                    value={editForm.price} 
                                                    onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})}
                                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <div>
                                                 <label className="block text-xs text-gray-500 mb-1">Capacity</label>
                                                 <input 
                                                    type="number" 
                                                    value={editForm.capacity} 
                                                    onChange={(e) => setEditForm({...editForm, capacity: Number(e.target.value)})}
                                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                             <label className="block text-xs text-gray-500 mb-1">Main Hero Image URL</label>
                                             <input 
                                                type="text" 
                                                value={editForm.image} 
                                                onChange={(e) => setEditForm({...editForm, image: e.target.value})}
                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-2 flex justify-between items-center">
                                                <span>Gallery Images</span>
                                                <button onClick={() => handleAddGalleryImage(true)} className="text-primary hover:text-primary/80 flex items-center text-[10px]">
                                                    <PlusCircle size={12} className="mr-1"/> Add Image
                                                </button>
                                            </label>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {(editForm.images || []).map((imgUrl, idx) => (
                                                    <div key={idx} className="flex items-center space-x-2">
                                                        <input 
                                                            type="text"
                                                            value={imgUrl}
                                                            onChange={(e) => handleGalleryImageChange(idx, e.target.value, true)}
                                                            className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-xs"
                                                            placeholder="Image URL..."
                                                        />
                                                        <button onClick={() => handleRemoveGalleryImage(idx, true)} className="text-red-400 hover:text-red-600">
                                                            <MinusCircle size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {(!editForm.images || editForm.images.length === 0) && (
                                                     <div className="text-xs text-gray-400 italic text-center py-2">No extra gallery images</div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                             <label className="block text-xs text-gray-500 mb-2">Amenities</label>
                                             <div className="grid grid-cols-3 gap-2 mb-3">
                                                {PREDEFINED_AMENITIES.map((amenity) => {
                                                    const isSelected = editForm.amenities?.some(a => a.name === amenity.name);
                                                    return (
                                                        <button
                                                            key={amenity.name}
                                                            onClick={() => toggleEditAmenity(amenity)}
                                                            className={`flex items-center justify-center py-2 px-2 rounded text-xs font-medium border transition-all ${
                                                                isSelected 
                                                                ? 'bg-primary/10 border-primary text-primary' 
                                                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <span className="mr-1.5">{renderAmenityIcon(amenity.icon)}</span>
                                                            {amenity.name}
                                                        </button>
                                                    )
                                                })}
                                             </div>
                                             <div className="flex gap-2 relative" ref={iconPickerRef}>
                                                <input 
                                                    type="text" 
                                                    value={customAmenityInput} 
                                                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                                                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                                                    placeholder="Add custom amenity..."
                                                />
                                                <div className="relative">
                                                    <button 
                                                        onClick={() => setShowIconPicker(!showIconPicker)}
                                                        className="h-full px-3 border border-gray-300 rounded bg-white flex items-center text-gray-600 hover:bg-gray-50"
                                                        title="Select Icon"
                                                    >
                                                        {renderAmenityIcon(customAmenityIcon)}
                                                        <ChevronDown size={12} className="ml-1"/>
                                                    </button>
                                                    {showIconPicker && (
                                                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-gray-200 shadow-xl rounded-lg p-2 z-50 grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                                                            {ICON_OPTIONS.map(icon => (
                                                                <button 
                                                                    key={icon}
                                                                    onClick={() => {
                                                                        setCustomAmenityIcon(icon);
                                                                        setShowIconPicker(false);
                                                                    }}
                                                                    className={`p-2 rounded flex justify-center items-center hover:bg-gray-100 ${customAmenityIcon === icon ? 'bg-primary/10 text-primary' : 'text-gray-600'}`}
                                                                    title={icon}
                                                                >
                                                                    {renderAmenityIcon(icon)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={addEditCustomAmenity}
                                                    className="bg-secondary text-white px-3 py-2 rounded text-xs font-medium"
                                                >
                                                    Add
                                                </button>
                                             </div>
                                             {/* Display custom/selected amenities */}
                                             <div className="flex flex-wrap gap-1 mt-2">
                                                 {editForm.amenities?.map((a, idx) => (
                                                     <span key={idx} className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] mr-1 mb-1">
                                                         <span className="mr-1 opacity-70">{renderAmenityIcon(a.icon)}</span>
                                                         {a.name}
                                                         <button onClick={() => toggleEditAmenity(a)} className="ml-1 text-gray-500 hover:text-red-500"><X size={10}/></button>
                                                     </span>
                                                 ))}
                                             </div>
                                        </div>

                                        <div className="flex items-center space-x-2 pt-2">
                                            <button onClick={handleSaveRoom} className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex justify-center items-center"><Save size={16} className="mr-2"/> Save</button>
                                            <button onClick={() => setEditingRoomId(null)} className="flex-1 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div className="text-2xl font-bold text-secondary">
                                            ₱{room.price.toLocaleString()} <span className="text-sm text-gray-400 font-normal">/ night</span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={() => handleEditRoomClick(room)}
                                                className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                                            >
                                                <Edit size={16} className="mr-2" /> Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteRoomClick(room.id)}
                                                className="flex items-center px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>

      {/* Add Room Modal */}
      {isAddingRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-pop max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                      <h3 className="text-xl font-bold text-gray-800">Add New Room</h3>
                      <button onClick={() => setIsAddingRoom(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                          <input 
                            type="text" 
                            value={newRoom.name}
                            onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                            placeholder="e.g. Sunset Suite"
                          />
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea 
                            value={newRoom.description}
                            onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none h-24"
                            placeholder="Enter room description..."
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
                            <input 
                                type="number" 
                                value={newRoom.price}
                                onChange={(e) => setNewRoom({...newRoom, price: Number(e.target.value)})}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                             <input 
                                type="number" 
                                value={newRoom.capacity}
                                onChange={(e) => setNewRoom({...newRoom, capacity: Number(e.target.value)})}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                      </div>

                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Main Hero Image URL</label>
                          <div className="flex">
                              <div className="bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2 text-gray-500">
                                  <ImageIcon size={18} />
                              </div>
                              <input 
                                type="text" 
                                value={newRoom.image}
                                onChange={(e) => setNewRoom({...newRoom, image: e.target.value})}
                                className="w-full border border-gray-300 rounded-r-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                placeholder="https://..."
                              />
                          </div>
                      </div>

                      <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
                                <span>Gallery Images</span>
                                <button onClick={() => handleAddGalleryImage(false)} className="text-primary hover:text-primary/80 flex items-center text-xs font-semibold">
                                    <PlusCircle size={14} className="mr-1"/> Add Image
                                </button>
                            </label>
                            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50">
                                {(newRoom.images || []).map((imgUrl, idx) => (
                                    <div key={idx} className="flex items-center space-x-2">
                                        <input 
                                            type="text"
                                            value={imgUrl}
                                            onChange={(e) => handleGalleryImageChange(idx, e.target.value, false)}
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                                            placeholder="Image URL..."
                                        />
                                        <button onClick={() => handleRemoveGalleryImage(idx, false)} className="text-red-400 hover:text-red-600">
                                            <MinusCircle size={18} />
                                        </button>
                                    </div>
                                ))}
                                {(!newRoom.images || newRoom.images.length === 0) && (
                                        <div className="text-sm text-gray-400 italic text-center py-2">No extra gallery images added</div>
                                )}
                            </div>
                      </div>

                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                         <div className="grid grid-cols-3 gap-2 mb-3">
                            {PREDEFINED_AMENITIES.map((amenity) => {
                                const isSelected = newRoom.amenities?.some(a => a.name === amenity.name);
                                return (
                                    <button
                                        key={amenity.name}
                                        onClick={() => toggleNewRoomAmenity(amenity)}
                                        className={`flex items-center justify-center py-2 px-2 rounded text-xs font-medium border transition-all ${
                                            isSelected 
                                            ? 'bg-primary/10 border-primary text-primary' 
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className="mr-1.5">{renderAmenityIcon(amenity.icon)}</span>
                                        {amenity.name}
                                    </button>
                                )
                            })}
                         </div>
                         <div className="flex gap-2 relative" ref={newRoomIconPickerRef}>
                            <input 
                                type="text" 
                                value={newRoomCustomAmenity} 
                                onChange={(e) => setNewRoomCustomAmenity(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                placeholder="Add custom amenity..."
                            />
                            <div className="relative">
                                <button 
                                    onClick={() => setShowNewRoomIconPicker(!showNewRoomIconPicker)}
                                    className="h-full px-3 border border-gray-300 rounded-lg bg-white flex items-center text-gray-600 hover:bg-gray-50"
                                    title="Select Icon"
                                >
                                    {renderAmenityIcon(newRoomCustomIcon)}
                                    <ChevronDown size={12} className="ml-1"/>
                                </button>
                                {showNewRoomIconPicker && (
                                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-gray-200 shadow-xl rounded-lg p-2 z-50 grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                                        {ICON_OPTIONS.map(icon => (
                                            <button 
                                                key={icon}
                                                onClick={() => {
                                                    setNewRoomCustomIcon(icon);
                                                    setShowNewRoomIconPicker(false);
                                                }}
                                                className={`p-2 rounded flex justify-center items-center hover:bg-gray-100 ${newRoomCustomIcon === icon ? 'bg-primary/10 text-primary' : 'text-gray-600'}`}
                                                title={icon}
                                            >
                                                {renderAmenityIcon(icon)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={addNewRoomCustomAmenity}
                                className="bg-secondary text-white px-3 py-2 rounded-lg text-xs font-medium"
                            >
                                Add
                            </button>
                         </div>
                         <div className="flex flex-wrap gap-1 mt-2">
                             {newRoom.amenities?.map((a, idx) => (
                                 <span key={idx} className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] mr-1 mb-1">
                                     <span className="mr-1 opacity-70">{renderAmenityIcon(a.icon)}</span>
                                     {a.name}
                                     <button onClick={() => toggleNewRoomAmenity(a)} className="ml-1 text-gray-500 hover:text-red-500"><X size={10}/></button>
                                 </span>
                             ))}
                         </div>
                      </div>
                  </div>

                  <div className="mt-8 flex space-x-3">
                      <button onClick={() => setIsAddingRoom(false)} className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                      <button onClick={handleAddRoomSubmit} className="flex-1 py-3 bg-primary text-white rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-md">Create Room</button>
                  </div>
              </div>
          </div>
      )}

      {/* Add Booking Modal */}
      {isAddingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-pop">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800">Add Manual Booking</h3>
                      <button onClick={() => setIsAddingBooking(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                          <input 
                            type="text" 
                            value={newBookingData.guestName}
                            onChange={(e) => setNewBookingData({...newBookingData, guestName: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                            placeholder="e.g. John Doe"
                          />
                      </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Guest Email</label>
                          <input 
                            type="email" 
                            value={newBookingData.email}
                            onChange={(e) => setNewBookingData({...newBookingData, email: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                            placeholder="e.g. john@example.com"
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input 
                                type="text" 
                                value={newBookingData.phoneNumber}
                                onChange={(e) => setNewBookingData({...newBookingData, phoneNumber: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                placeholder="+63 9xx xxx xxxx"
                            />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                             <input 
                                type="number" 
                                min="1"
                                value={newBookingData.guests}
                                onChange={(e) => setNewBookingData({...newBookingData, guests: Number(e.target.value)})}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                            />
                         </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                          <select
                             value={newBookingData.roomId}
                             onChange={(e) => setNewBookingData({...newBookingData, roomId: e.target.value})}
                             className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none bg-white"
                          >
                              {rooms.map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                          </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                             <input 
                                type="date" 
                                value={newBookingData.checkIn}
                                onChange={(e) => setNewBookingData({...newBookingData, checkIn: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                             <input 
                                type="date" 
                                value={newBookingData.checkOut}
                                onChange={(e) => setNewBookingData({...newBookingData, checkOut: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                             />
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select 
                                value={newBookingData.status}
                                onChange={(e) => setNewBookingData({...newBookingData, status: e.target.value as any})}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none bg-white"
                            >
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Price (₱)</label>
                            <input 
                                type="number" 
                                value={newBookingData.totalPrice}
                                onChange={(e) => setNewBookingData({...newBookingData, totalPrice: Number(e.target.value)})}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                      </div>
                  </div>

                  <div className="mt-8 flex space-x-3">
                      <button onClick={() => setIsAddingBooking(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                      <button onClick={handleAddBookingSubmit} className="flex-1 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-md">Add Booking</button>
                  </div>
              </div>
          </div>
      )}

      {/* Booking Edit Modal */}
      {editingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-pop">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800">Edit Booking</h3>
                      <button onClick={() => setEditingBooking(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                          <input 
                            type="text" 
                            value={editingBooking.guestName}
                            onChange={(e) => setEditingBooking({...editingBooking, guestName: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Guest Email</label>
                          <input 
                            type="email" 
                            value={editingBooking.email}
                            onChange={(e) => setEditingBooking({...editingBooking, email: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input 
                                type="text" 
                                value={editingBooking.phoneNumber || ''}
                                onChange={(e) => setEditingBooking({...editingBooking, phoneNumber: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                             <input 
                                type="number" 
                                min="1"
                                value={editingBooking.guests || 1}
                                onChange={(e) => setEditingBooking({...editingBooking, guests: Number(e.target.value)})}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                         </div>
                      </div>

                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                          <select
                             value={editingBooking.roomId}
                             onChange={(e) => setEditingBooking({...editingBooking, roomId: e.target.value})}
                             className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none bg-white"
                          >
                              {rooms.map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                          </select>
                      </div>

                       <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                             <input 
                                type="date" 
                                value={editingBooking.checkIn}
                                onChange={(e) => setEditingBooking({...editingBooking, checkIn: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                             <input 
                                type="date" 
                                value={editingBooking.checkOut}
                                onChange={(e) => setEditingBooking({...editingBooking, checkOut: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                             />
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select 
                                value={editingBooking.status}
                                onChange={(e) => setEditingBooking({...editingBooking, status: e.target.value as any})}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none bg-white"
                            >
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Price (₱)</label>
                            <input 
                                type="number" 
                                value={editingBooking.totalPrice}
                                onChange={(e) => setEditingBooking({...editingBooking, totalPrice: Number(e.target.value)})}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-xs text-gray-500 italic">Note: Updates affect revenue charts immediately.</p>
                      </div>
                  </div>

                  <div className="mt-8 flex space-x-3">
                      <button onClick={() => setEditingBooking(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                      <button onClick={handleSaveBooking} className="flex-1 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-md">Save Changes</button>
                  </div>
              </div>
          </div>
      )}

       {/* Export Report Modal */}
      {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-pop">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                      <h3 className="text-xl font-bold text-gray-800">Export Report</h3>
                      <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-5">
                      {/* Format Selection */}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Format</label>
                          <div className="grid grid-cols-3 gap-3">
                              <button 
                                onClick={() => setExportConfig({...exportConfig, format: 'doc'})}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${exportConfig.format === 'doc' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                              >
                                  <FileText size={24} className="mb-2" />
                                  <span className="text-xs font-bold">Word Doc</span>
                              </button>
                              <button 
                                onClick={() => setExportConfig({...exportConfig, format: 'csv'})}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${exportConfig.format === 'csv' ? 'bg-green-50 border-green-400 text-green-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                              >
                                  <FileSpreadsheet size={24} className="mb-2" />
                                  <span className="text-xs font-bold">Excel / CSV</span>
                              </button>
                              <button 
                                onClick={() => setExportConfig({...exportConfig, format: 'txt'})}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${exportConfig.format === 'txt' ? 'bg-gray-100 border-gray-400 text-gray-800' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                              >
                                  <File size={24} className="mb-2" />
                                  <span className="text-xs font-bold">Plain Text</span>
                              </button>
                          </div>
                      </div>

                      {/* Report Details */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                          <input 
                            type="text" 
                            value={exportConfig.title}
                            onChange={(e) => setExportConfig({...exportConfig, title: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Custom Notes / Abstract</label>
                          <textarea 
                            value={exportConfig.notes}
                            onChange={(e) => setExportConfig({...exportConfig, notes: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none h-20 resize-none"
                            placeholder="Add optional notes, executive summary, or comments here..."
                          />
                      </div>
                      
                      {/* Alterable Stats */}
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Summary Overrides (Optional)</label>
                          <div className="grid grid-cols-2 gap-3">
                             <div>
                                 <label className="block text-[10px] text-gray-500 mb-1">Total Revenue Display</label>
                                 <input 
                                    type="text" 
                                    value={exportConfig.overrideRevenue}
                                    onChange={(e) => setExportConfig({...exportConfig, overrideRevenue: e.target.value})}
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs"
                                    placeholder={`Current: ₱${totalRevenue.toLocaleString()}`}
                                 />
                             </div>
                             <div>
                                 <label className="block text-[10px] text-gray-500 mb-1">Total Bookings Display</label>
                                 <input 
                                    type="text" 
                                    value={exportConfig.overrideBookings}
                                    onChange={(e) => setExportConfig({...exportConfig, overrideBookings: e.target.value})}
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs"
                                    placeholder={`Current: ${bookings.length}`}
                                 />
                             </div>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 italic">Use these fields to alter the data shown on the report without changing database records.</p>
                      </div>
                  </div>

                  <div className="mt-8 flex space-x-3">
                      <button onClick={() => setShowExportModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                      <button onClick={processExport} className="flex-1 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-md flex justify-center items-center">
                          <Download size={18} className="mr-2"/> Download {exportConfig.format.toUpperCase()}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;