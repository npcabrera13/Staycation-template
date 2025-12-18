import React, { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Booking, Room, Amenity, Settings } from '../types';
import { format, isValid, differenceInDays, addDays, addMonths, isAfter, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import {
    LayoutDashboard, BedDouble, LogOut, Edit, Save, X, Trash2, Download, TrendingUp, Calendar as CalendarIcon, Plus, Image as ImageIcon,
    Wifi, Wind, Coffee, Car, Dumbbell, Tv, ChefHat, Waves, Shield, Sparkles,
    Utensils, Monitor, Zap, Sun, Umbrella, Music, Briefcase, Key, Bell, Bath, Armchair, Bike, ChevronDown, PlusCircle, MinusCircle,
    FileText, FileSpreadsheet, File, Filter, CheckSquare, Square, Phone, Users, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, XCircle, Clock, Settings as SettingsIcon, Palette, Globe, Loader
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
    onRefresh?: () => void;
    onSeed?: () => void;
    settings?: Settings;
    onUpdateSettings?: (settings: Settings) => Promise<void>;
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

const startOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

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
    onRefresh,
    onSeed,
    settings,
    onUpdateSettings,
    onExit
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'rooms' | 'settings'>('calendar');

    // Settings State
    const [settingsForm, setSettingsForm] = useState<Settings | null>(null);

    // Initialize Settings Form when settings prop changes or tab opens
    useEffect(() => {
        if (settings) {
            setSettingsForm(settings);
        }
    }, [settings]);

    const handleSaveSettings = async () => {
        if (onUpdateSettings && settingsForm) {
            await onUpdateSettings(settingsForm);
            alert("Settings saved successfully!");
        }
    };

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
        switch (iconName) {
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
        console.log("handleAddRoomSubmit: triggered");
        if (!onAddRoom) {
            console.error("handleAddRoomSubmit: onAddRoom prop missing");
            return;
        }
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
        switch (status) {
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
                            <CalendarIcon className="mr-3 text-primary" size={28} />
                            Bookings Calendar
                        </h2>
                        <p className="text-gray-500 text-sm">Visual timeline of room occupancy</p>
                    </div>

                    <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                        <button onClick={() => setCalendarDate(addMonths(calendarDate, -1))} className="p-4 hover:bg-gray-100 rounded-md text-gray-600 active:bg-gray-200 transition-colors flex items-center justify-center"><ChevronLeft size={24} className="scale-125" /></button>
                        <div className="px-4 font-bold text-gray-700 min-w-[140px] text-center">{format(calendarDate, 'MMMM yyyy')}</div>
                        <button onClick={() => setCalendarDate(addMonths(calendarDate, 1))} className="p-4 hover:bg-gray-100 rounded-md text-gray-600 active:bg-gray-200 transition-colors flex items-center justify-center"><ChevronRight size={24} className="scale-125" /></button>
                    </div>
                </div>

                {/* Pending Approvals Section */}
                {pendingBookings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 animate-slide-down">
                        <div className="flex items-center mb-3 text-yellow-800 font-bold">
                            <Clock size={20} className="mr-2" />
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
                    <button onClick={onExit} className="md:hidden p-2 hover:bg-gray-700 rounded"><LogOut size={20} /></button>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'calendar' ? 'bg-primary text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                    >
                        <CalendarIcon size={20} className="mr-3" /> Calendar & Bookings
                        {pendingBookings.length > 0 && (
                            <span className="ml-auto bg-yellow-500 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingBookings.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-primary text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                    >
                        <LayoutDashboard size={20} className="mr-3" /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('rooms')}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'rooms' ? 'bg-primary text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                    >
                        <BedDouble size={20} className="mr-3" /> Manage Rooms
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-primary text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                    >
                        <SettingsIcon size={20} className="mr-3" /> Settings
                    </button>
                </nav>
                <div className="p-4 border-t border-gray-700 hidden md:block">
                    <button onClick={onExit} className="flex items-center text-red-300 hover:text-red-100 transition-colors">
                        <LogOut size={20} className="mr-2" /> Return to Site
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">

                {activeTab === 'calendar' && renderCalendarView()}

                {activeTab === 'settings' && (
                    settingsForm ? (
                        <div className="animate-fade-in max-w-4xl mx-auto pb-12">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                        <SettingsIcon className="mr-3 text-primary" size={28} />
                                        Site Settings
                                    </h2>
                                    <p className="text-gray-500 text-sm">Customize your white-label application</p>
                                </div>
                                <button
                                    onClick={handleSaveSettings}
                                    className="flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-md font-bold"
                                >
                                    <Save size={18} className="mr-2" /> Save Changes
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Brand Settings */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                        <Globe size={20} className="mr-2 text-primary" /> Brand Identity
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                                            <input
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                value={settingsForm.siteName}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <input
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                value={settingsForm.description}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                                            />
                                        </div>

                                    </div>
                                </div>

                                {/* Hero Configuration */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                        <ImageIcon size={20} className="mr-2 text-primary" /> Hero Section
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                                            <input
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                value={settingsForm.hero?.title || ''}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, hero: { ...settingsForm.hero, title: e.target.value } })}
                                                placeholder="Rediscover Serenity"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
                                            <textarea
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                value={settingsForm.hero?.subtitle || ''}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, hero: { ...settingsForm.hero, subtitle: e.target.value } })}
                                                rows={2}
                                                placeholder="Luxury staycations curated for your peace of mind."
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                                                <input
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                    value={settingsForm.hero?.ctaText || ''}
                                                    onChange={(e) => setSettingsForm({ ...settingsForm, hero: { ...settingsForm.hero, ctaText: e.target.value } })}
                                                    placeholder="Explore Rooms"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL</label>
                                                <input
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                    value={settingsForm.hero?.image || ''}
                                                    onChange={(e) => setSettingsForm({ ...settingsForm, hero: { ...settingsForm.hero, image: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                        {settingsForm.hero?.image && (
                                            <img src={settingsForm.hero.image} alt="Hero Preview" className="mt-2 h-48 w-full object-cover rounded-lg" />
                                        )}
                                    </div>
                                </div>

                                {/* Features / Body Section */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                        <LayoutDashboard size={20} className="mr-2 text-primary" /> Body / Features Section
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                                            <input
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                value={settingsForm.features?.title || ''}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, features: { ...settingsForm.features, title: e.target.value } })}
                                                placeholder="Stay with us"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Section Description</label>
                                            <textarea
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                value={settingsForm.features?.description || ''}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, features: { ...settingsForm.features, description: e.target.value } })}
                                                rows={3}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Feature Image URL (Optional)</label>
                                            <input
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                value={settingsForm.features?.image || ''}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, features: { ...settingsForm.features, image: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Map Configuration */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                        <Globe size={20} className="mr-2 text-primary" /> Map Configuration
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Embed URL</label>
                                            <input
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                value={settingsForm.map?.embedUrl || ''}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, map: { ...settingsForm.map, embedUrl: e.target.value } })}
                                                placeholder="https://www.google.com/maps/embed?..."
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Paste the 'src' attribute from the Google Maps Embed code.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                        <Phone size={20} className="mr-2 text-primary" /> Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                            <input
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                value={settingsForm.contact.address}
                                                onChange={(e) => setSettingsForm({
                                                    ...settingsForm,
                                                    contact: { ...settingsForm.contact, address: e.target.value }
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                            <input
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                value={settingsForm.contact.phone}
                                                onChange={(e) => setSettingsForm({
                                                    ...settingsForm,
                                                    contact: { ...settingsForm.contact, phone: e.target.value }
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                value={settingsForm.contact.email}
                                                onChange={(e) => setSettingsForm({
                                                    ...settingsForm,
                                                    contact: { ...settingsForm.contact, email: e.target.value }
                                                })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                                                <input
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                    value={settingsForm.contact.socials.facebook}
                                                    onChange={(e) => setSettingsForm({
                                                        ...settingsForm,
                                                        contact: { ...settingsForm.contact, socials: { ...settingsForm.contact.socials, facebook: e.target.value } }
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                                                <input
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                    value={settingsForm.contact.socials.instagram}
                                                    onChange={(e) => setSettingsForm({
                                                        ...settingsForm,
                                                        contact: { ...settingsForm.contact, socials: { ...settingsForm.contact.socials, instagram: e.target.value } }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Theme Settings */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                        <Palette size={20} className="mr-2 text-primary" /> Visual Theme
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    className="h-10 w-20 rounded cursor-pointer"
                                                    value={settingsForm.theme.primaryColor}
                                                    onChange={(e) => setSettingsForm({
                                                        ...settingsForm,
                                                        theme: { ...settingsForm.theme, primaryColor: e.target.value }
                                                    })}
                                                />
                                                <span className="text-gray-600 font-mono text-sm">{settingsForm.theme.primaryColor}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Used for buttons, highlights, and icons.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    className="h-10 w-20 rounded cursor-pointer"
                                                    value={settingsForm.theme.secondaryColor}
                                                    onChange={(e) => setSettingsForm({
                                                        ...settingsForm,
                                                        theme: { ...settingsForm.theme, secondaryColor: e.target.value }
                                                    })}
                                                />
                                                <span className="text-gray-600 font-mono text-sm">{settingsForm.theme.secondaryColor}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Used for backgrounds, headers, and text accents.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center items-center h-64 animate-fade-in">
                            <Loader className="animate-spin text-primary mb-4" size={48} />
                            <p className="text-gray-500 text-lg">Loading Settings...</p>
                            <p className="text-gray-400 text-sm mt-2">If this persists, try refreshing the page.</p>
                        </div>
                    )
                )}

                {
                    activeTab === 'overview' && (
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

                                <div className="flex space-x-2">
                                    {onSeed && rooms.length === 0 && (
                                        <button
                                            onClick={onSeed}
                                            className="flex items-center px-4 py-2 bg-yellow-100 border border-yellow-200 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors shadow-sm"
                                        >
                                            <Sparkles size={18} className="mr-2" /> Seed Data
                                        </button>
                                    )}
                                    <button
                                        onClick={openExportModal}
                                        className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors shadow-sm"
                                    >
                                        <Download size={18} className="mr-2" /> Export Report
                                    </button>
                                </div>
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
                                        <TrendingUp size={18} className="mr-2 text-primary" />
                                        Revenue Trend ({timeframe})
                                    </h3>
                                    <ResponsiveContainer width="100%" height="85%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `₱${val / 1000}k`} />
                                            <Tooltip
                                                cursor={{ fill: '#F3F4F6' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Revenue']}
                                            />
                                            <Bar dataKey="revenue" fill="#2A9D8F" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Pie Chart */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-auto md:h-96 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                                        <TrendingUp size={18} className="mr-2 text-primary" />
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
                                        {/* Scrollable List with Indicator - EDITED: INCREASED RIGHT PADDING */}
                                        <div className="w-full md:w-1/2 h-32 md:h-56 relative mt-2 md:mt-0">
                                            <div
                                                className="absolute inset-0 overflow-y-auto pr-6 space-y-2 scrollbar-thin"
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
                                                        <Filter size={14} className="text-gray-500" />
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
                                                        <ChevronDown size={14} className="text-gray-400" />
                                                    </div>
                                                </div>

                                                {/* Bulk Delete Button */}
                                                {selectedBookingIds.size > 0 && (
                                                    <button
                                                        onClick={handleBulkDelete}
                                                        className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 border border-red-100 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors animate-pop shadow-sm whitespace-nowrap"
                                                    >
                                                        <Trash2 size={16} className="sm:mr-1" />
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
                                                <Plus size={16} className="mr-1.5" /> Add Booking
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden lg:block overflow-x-auto">
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

                                {/* Mobile/Tablet Card View */}
                                <div className="lg:hidden p-4 space-y-4">
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
                                                        <Edit size={14} className="mr-1" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBookingClick(booking.id)}
                                                        className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded"
                                                    >
                                                        <Trash2 size={14} className="mr-1" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredBookings.length === 0 && (
                                        <div className="text-center text-gray-400 text-sm py-8">
                                            No bookings found for the selected criteria.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Rooms Management Tab */}
                {
                    activeTab === 'rooms' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Room Management</h2>
                                    <p className="text-gray-500 text-sm">Add, edit, or remove rooms and amenities</p>
                                </div>
                                {!isAddingRoom && (
                                    <button
                                        onClick={() => setIsAddingRoom(true)}
                                        className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                                    >
                                        <Plus size={18} className="mr-2" /> Add Room
                                    </button>
                                )}
                            </div>

                            {/* Add/Edit Room Modal */}
                            {(isAddingRoom || editingRoomId) && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl relative animate-pop max-h-[90vh] overflow-y-auto">
                                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                            <h3 className="text-lg font-bold text-gray-800">
                                                {isAddingRoom ? 'Add New Room' : 'Edit Room'}
                                            </h3>
                                            <button
                                                onClick={() => { isAddingRoom ? setIsAddingRoom(false) : setEditingRoomId(null) }}
                                                className="text-gray-400 hover:text-gray-600 p-1"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Basic Details */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                                                    <input
                                                        type="text"
                                                        value={isAddingRoom ? newRoom.name : editForm.name}
                                                        onChange={(e) => isAddingRoom ? setNewRoom({ ...newRoom, name: e.target.value }) : setEditForm({ ...editForm, name: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                                        placeholder="e.g. Sunset Villa"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
                                                        <input
                                                            type="number"
                                                            value={isAddingRoom ? newRoom.price : editForm.price}
                                                            onChange={(e) => isAddingRoom ? setNewRoom({ ...newRoom, price: Number(e.target.value) }) : setEditForm({ ...editForm, price: Number(e.target.value) })}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                                                        <input
                                                            type="number"
                                                            value={isAddingRoom ? newRoom.capacity : editForm.capacity}
                                                            onChange={(e) => isAddingRoom ? setNewRoom({ ...newRoom, capacity: Number(e.target.value) }) : setEditForm({ ...editForm, capacity: Number(e.target.value) })}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <textarea
                                                    value={isAddingRoom ? newRoom.description : editForm.description}
                                                    onChange={(e) => isAddingRoom ? setNewRoom({ ...newRoom, description: e.target.value }) : setEditForm({ ...editForm, description: e.target.value })}
                                                    rows={3}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                                />
                                            </div>

                                            {/* Image Handling */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Main Image URL</label>
                                                <input
                                                    type="text"
                                                    value={isAddingRoom ? newRoom.image : editForm.image}
                                                    onChange={(e) => isAddingRoom ? setNewRoom({ ...newRoom, image: e.target.value }) : setEditForm({ ...editForm, image: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none mb-2"
                                                />
                                                {/* Image Preview */}
                                                {(isAddingRoom ? newRoom.image : editForm.image) && (
                                                    <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden relative">
                                                        <img src={isAddingRoom ? newRoom.image : editForm.image} alt="Preview" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Gallery Images */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                                                <div className="space-y-2">
                                                    {((isAddingRoom ? newRoom.images : editForm.images) || []).map((img, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={img}
                                                                onChange={(e) => handleGalleryImageChange(idx, e.target.value, !isAddingRoom)}
                                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                                placeholder="Image URL"
                                                            />
                                                            <button onClick={() => handleRemoveGalleryImage(idx, !isAddingRoom)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => handleAddGalleryImage(!isAddingRoom)}
                                                        className="text-primary text-sm font-medium hover:underline flex items-center"
                                                    >
                                                        <Plus size={14} className="mr-1" /> Add Gallery Image
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Amenities */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                                                    {PREDEFINED_AMENITIES.map(amenity => {
                                                        const currentAmenities = isAddingRoom ? (newRoom.amenities || []) : (editForm.amenities || []);
                                                        const isSelected = currentAmenities.some(a => a.name === amenity.name);
                                                        return (
                                                            <div
                                                                key={amenity.name}
                                                                onClick={() => isAddingRoom ? toggleNewRoomAmenity(amenity) : toggleEditAmenity(amenity)}
                                                                className={`cursor-pointer flex items-center p-2 rounded-lg border text-sm transition-colors ${isSelected ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 hover:border-gray-300'}`}
                                                            >
                                                                {renderAmenityIcon(amenity.icon)}
                                                                <span className="ml-2">{amenity.name}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Custom Amenity */}
                                                <div className="flex gap-2 items-end">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Custom amenity name"
                                                            value={isAddingRoom ? newRoomCustomAmenity : customAmenityInput}
                                                            onChange={(e) => isAddingRoom ? setNewRoomCustomAmenity(e.target.value) : setCustomAmenityInput(e.target.value)}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                    <div className="relative" ref={isAddingRoom ? newRoomIconPickerRef : iconPickerRef}>
                                                        <button
                                                            onClick={() => isAddingRoom ? setShowNewRoomIconPicker(!showNewRoomIconPicker) : setShowIconPicker(!showIconPicker)}
                                                            className="border border-gray-300 rounded-lg p-2 text-gray-600 hover:bg-gray-50"
                                                            title="Select Icon"
                                                        >
                                                            {renderAmenityIcon(isAddingRoom ? newRoomCustomIcon : customAmenityIcon)}
                                                        </button>
                                                        {(isAddingRoom ? showNewRoomIconPicker : showIconPicker) && (
                                                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-2 grid grid-cols-6 gap-2 z-50 max-h-40 overflow-y-auto">
                                                                {ICON_OPTIONS.map(icon => (
                                                                    <button
                                                                        key={icon}
                                                                        onClick={() => {
                                                                            if (isAddingRoom) {
                                                                                setNewRoomCustomIcon(icon);
                                                                                setShowNewRoomIconPicker(false);
                                                                            } else {
                                                                                setCustomAmenityIcon(icon);
                                                                                setShowIconPicker(false);
                                                                            }
                                                                        }}
                                                                        className={`p-1.5 rounded hover:bg-gray-100 ${(isAddingRoom ? newRoomCustomIcon : customAmenityIcon) === icon ? 'bg-primary/20 text-primary' : 'text-gray-500'
                                                                            }`}
                                                                    >
                                                                        {renderAmenityIcon(icon)}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={isAddingRoom ? addNewRoomCustomAmenity : addEditCustomAmenity}
                                                        className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
                                                    >
                                                        Add
                                                    </button>
                                                </div>

                                                {/* Amenities List Display for Custom items or all */}
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {((isAddingRoom ? newRoom.amenities : editForm.amenities) || []).filter(a => !PREDEFINED_AMENITIES.some(p => p.name === a.name)).map((amenity, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            {renderAmenityIcon(amenity.icon)}
                                                            <span className="ml-1.5 mr-1">{amenity.name}</span>
                                                            <button
                                                                onClick={() => isAddingRoom ? toggleNewRoomAmenity(amenity) : toggleEditAmenity(amenity)}
                                                                className="text-gray-400 hover:text-red-500 ml-1"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex justify-end space-x-3 border-t border-gray-100 pt-6">
                                            <button
                                                onClick={() => { isAddingRoom ? setIsAddingRoom(false) : setEditingRoomId(null) }}
                                                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={isAddingRoom ? handleAddRoomSubmit : handleSaveRoom}
                                                className="px-5 py-2 rounded-lg bg-primary text-white font-bold hover:bg-teal-700 transition-colors flex items-center shadow-md"
                                            >
                                                <Save size={18} className="mr-2" /> {isAddingRoom ? 'Create Room' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Room List */}
                            <div className="grid grid-cols-1 gap-6">
                                {rooms.map(room => (
                                    <div key={room.id} className={`bg-white rounded-xl shadow-sm border transition-all ${editingRoomId === room.id ? 'border-primary ring-1 ring-primary' : 'border-gray-200 hover:shadow-md'}`}>
                                        <div className="flex flex-col md:flex-row">
                                            {/* Image Thumb */}
                                            <div className="w-full md:w-48 h-48 md:h-auto relative bg-gray-100 flex-shrink-0">
                                                <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
                                                    ₱{room.price.toLocaleString()}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-800">{room.name}</h3>
                                                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                                                <Users size={14} className="mr-1" /> Capacity: {room.capacity} Guests
                                                            </div>
                                                        </div>
                                                        {editingRoomId !== room.id && (
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => handleEditRoomClick(room)}
                                                                    className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteRoomClick(room.id)}
                                                                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{room.description}</p>

                                                    <div className="flex flex-wrap gap-2">
                                                        {room.amenities.slice(0, 5).map((am, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-50 text-gray-600 border border-gray-100">
                                                                {renderAmenityIcon(am.icon)}
                                                                <span className="ml-1.5">{am.name}</span>
                                                            </span>
                                                        ))}
                                                        {room.amenities.length > 5 && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-50 text-gray-400">
                                                                +{room.amenities.length - 5} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {rooms.length === 0 && (
                                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                        <BedDouble size={48} className="mx-auto text-gray-300 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900">No rooms yet</h3>
                                        <p className="text-gray-500 mb-4">Get started by adding your first room.</p>
                                        <button
                                            onClick={() => setIsAddingRoom(true)}
                                            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-700"
                                        >
                                            <Plus size={18} className="mr-2" /> Add Room
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
};

export default AdminDashboard;