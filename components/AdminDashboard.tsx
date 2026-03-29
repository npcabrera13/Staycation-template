import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Booking, Room, Amenity, Settings } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { format, isValid, differenceInDays, addDays, addMonths, subMonths, isAfter, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import {
    LayoutDashboard, BedDouble, LogOut, Edit, Save, X, Trash2, Download, TrendingUp, Calendar, Calendar as CalendarIcon, Plus, Image as ImageIcon,
    Wifi, Wind, Coffee, Car, Dumbbell, Tv, ChefHat, Waves, Shield, Sparkles,
    Utensils, Monitor, Zap, Sun, Umbrella, Music, Briefcase, Key, Bell, Bath, Armchair, Bike, ChevronDown, PlusCircle, MinusCircle,
    FileText, FileSpreadsheet, File, Filter, CheckSquare, Square, Phone, Users, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, XCircle, Clock, Settings as SettingsIcon, Palette, Globe, Loader, Maximize2, Minimize2, CreditCard, Database, Copy, RefreshCw, ExternalLink, Lock, AlertTriangle, Eye, EyeOff, HelpCircle, Rocket, MessageCircle, Award, Share2
} from 'lucide-react';

import { useLocation } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import StatsSummaryModal from './Admin/StatsSummaryModal';
import BookingEditModal from './Admin/BookingEditModal';
import { sendUserConfirmationEmail } from '../services/emailService';
import AdminOnboarding from './Admin/AdminOnboarding';


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
    onEnterVisualBuilder?: () => void;
    // Subscription Props
    showExpiryWarning: boolean;
    expiryDays: number | null;
    expiryDate: string | null;
    contactInfo: { email: string; phone: string; providerName: string };
    showMissingPasscodeWarning: boolean;
    setShowMissingPasscodeWarning: (show: boolean) => void;
    licenseKey: string;
    setShowExpiryWarning: (show: boolean) => void;
}


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

const HelpTooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="group relative inline-block ml-1.5 cursor-help align-middle">
        <HelpCircle size={13} className="text-gray-400 hover:text-primary transition-colors" />
        <div className="invisible group-hover:visible absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900/95 backdrop-blur-md text-white text-[10px] leading-relaxed rounded-lg shadow-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none text-center font-medium">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900/95"></div>
        </div>
    </div>
);

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
    onExit,
    onEnterVisualBuilder,
    showExpiryWarning,
    expiryDays,
    expiryDate,
    contactInfo,
    showMissingPasscodeWarning,
    setShowMissingPasscodeWarning,
    licenseKey,
    setShowExpiryWarning
}) => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'rooms' | 'settings'>(
        () => (location.state?.activeTab as any) || 'calendar'
    );
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [activeHelpTab, setActiveHelpTab] = useState(0);

    const navigateToTab = (tab: 'overview' | 'calendar' | 'rooms' | 'settings', targetId?: string) => {
        setActiveTab(tab);
        if (targetId) {
            // Increased timeout to 600ms to ensure content is rendered in DOM
            setTimeout(() => {
                const el = document.getElementById(targetId);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Add a temporary highlight effect
                    el.classList.add('ring-4', 'ring-primary/50', 'transition-all', 'duration-1000');
                    setTimeout(() => el.classList.remove('ring-4', 'ring-primary/50'), 3000);
                }
            }, 600);
        }
    };

    // Auto-scroll if navigated from Quick Start Guide
    useEffect(() => {
        if (location.state?.scrollTarget && activeTab === location.state?.activeTab) {
            setTimeout(() => {
                document.getElementById(location.state.scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }, [location.state?.scrollTarget, activeTab]);


    const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
    const { showToast, showConfirm } = useNotification();

    // Passcode state
    const [adminPasscode, setAdminPasscode] = useState('');
    const [newPasscode, setNewPasscode] = useState('');
    const [confirmPasscode, setConfirmPasscode] = useState('');
    const [showPasscode, setShowPasscode] = useState(false);
    const [passcodeStatus, setPasscodeStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [passcodeError, setPasscodeError] = useState('');

    useEffect(() => {
        // Load admin passcode
        const fetchPasscode = async () => {
            try {
                const snap = await getDoc(doc(db, '_superadmin', 'settings'));
                if (snap.exists() && snap.data().adminPasscode) {
                    setAdminPasscode(snap.data().adminPasscode);
                } else {
                    if (!sessionStorage.getItem('dismissedPasscodeWarning')) {
                        setShowMissingPasscodeWarning(true);
                    }
                }
            } catch { }
        };
        fetchPasscode();
    }, []);

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
            showToast("Settings saved successfully!", "success");
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
        dayUsePrice: undefined,
        capacity: 2,
        image: 'https://picsum.photos/800/600',
        images: [],
        amenities: [],
        depositAmount: undefined
    });
    const [newRoomCustomAmenity, setNewRoomCustomAmenity] = useState('');
    const [newRoomCustomIcon, setNewRoomCustomIcon] = useState('sparkles');
    const [showNewRoomIconPicker, setShowNewRoomIconPicker] = useState(false);

    // Analytics State
    const [presetRange, setPresetRange] = useState<'1m' | '3m' | '1y' | 'custom'>('1m');
    const [dateRange, setDateRange] = useState({
        start: subMonths(new Date(), 1),
        end: new Date()
    });

    const handlePresetChange = (preset: '1m' | '3m' | '1y' | 'custom') => {
        setPresetRange(preset);
        const end = new Date();
        if (preset === '1m') setDateRange({ start: subMonths(end, 1), end });
        else if (preset === '3m') setDateRange({ start: subMonths(end, 3), end });
        else if (preset === '1y') setDateRange({ start: subMonths(end, 12), end });
    };

    // Calendar State
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [summaryDate, setSummaryDate] = useState(new Date());
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Booking Management State
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [bookingFilter, setBookingFilter] = useState<BookingFilter>('all');
    const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());

    // Process bookings to auto-cancel pending ones that have passed
    const processedBookings = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return bookings.map(b => {
            if (b.status === 'pending') {
                const checkInDate = new Date(b.checkIn);
                checkInDate.setHours(0, 0, 0, 0);
                if (checkInDate < todayStart) {
                    return { ...b, status: 'cancelled' as const };
                }
            }
            return b;
        });
    }, [bookings]);

    // Computed Values used across views (including Modal)
    const totalBookingsInMonth = processedBookings.filter(b => {
        if (b.status === 'cancelled') return false;
        const checkIn = new Date(b.checkIn);
        return isSameMonth(checkIn, calendarDate);
    }).length;

    const monthlyRevenue = processedBookings.filter(b => {
        // Only count confirmed bookings as actual revenue
        if (b.status !== 'confirmed') return false;
        return isSameMonth(new Date(b.checkIn), calendarDate);
    }).reduce((sum, b) => sum + b.totalPrice, 0);

    // Add Booking State
    const [isAddingBooking, setIsAddingBooking] = useState(false);

    // Zoomed Image State
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);


    // Export State
    const [showExportModal, setShowExportModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
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
        return processedBookings.filter(b => {
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
    const pendingBookings = processedBookings.filter(b => b.status === 'pending').sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

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
        showConfirm({
            title: "Delete Multiple Bookings",
            message: `Are you sure you want to delete ${selectedBookingIds.size} bookings? This cannot be undone.`,
            isDangerous: true,
            confirmLabel: "Delete Bookings",
            onConfirm: () => {
                if (onDeleteBookings) {
                    onDeleteBookings(Array.from(selectedBookingIds));
                    setSelectedBookingIds(new Set());
                }
            }
        });
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

        const rangeStart = new Date(dateRange.start);
        rangeStart.setHours(0, 0, 0, 0);
        const rangeEnd = new Date(dateRange.end);
        rangeEnd.setHours(23, 59, 59, 999);

        // Filter and aggregate confirmed bookings within date range
        processedBookings.filter(b => b.status === 'confirmed').forEach(booking => {
            const date = new Date(booking.checkIn);
            if (!isValid(date) || date < rangeStart || date > rangeEnd) return;

            const diffDays = differenceInDays(rangeEnd, rangeStart);
            let key = '';
            let name = '';
            let sortKey = date.getTime();

            if (diffDays <= 31) {
                key = format(date, 'yyyy-MM-dd');
                name = format(date, 'MMM d');
                sortKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
            } else {
                key = format(date, 'yyyy-MM');
                name = format(date, 'MMM yyyy');
                sortKey = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
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

    // Filtered specific stats for the cards
    const filteredRangeBookings = processedBookings.filter(b => {
        if (b.status === 'cancelled') return false;
        const d = new Date(b.checkIn);
        return isValid(d) && d >= dateRange.start && d <= dateRange.end;
    });
    const rangeBookingsCount = filteredRangeBookings.length;
    const rangeRevenue = filteredRangeBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.totalPrice, 0);

    // Room Popularity Data
    const activeBookingsCount = processedBookings.filter(b => b.status !== 'cancelled').length;
    const roomPopularity = rooms.map(room => {
        const count = processedBookings.filter(b => b.roomId === room.id && b.status !== 'cancelled').length;
        return {
            name: room.name,
            value: count,
            percentage: activeBookingsCount > 0 ? Math.round((count / activeBookingsCount) * 100) : 0
        };
    }).sort((a, b) => b.value - a.value); // Sort by popularity

    const COLORS = ['#2A9D8F', '#E9C46A', '#264653', '#F4A261', '#E76F51', '#8AB17D', '#B5838D'];
    // Total revenue across all time (for exports or specific overrides)
    const totalRevenue = processedBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.totalPrice, 0);

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
            dayUsePrice: newRoom.dayUsePrice,
            capacity: newRoom.capacity || 2,
            image: newRoom.image || 'https://picsum.photos/800/600',
            images: newRoom.images || [],
            amenities: newRoom.amenities || []
        });
        setIsAddingRoom(false);
        setNewRoom({ name: '', description: '', price: 0, dayUsePrice: undefined, capacity: 2, image: '', images: [], amenities: [] });
        setNewRoomCustomAmenity('');
        setNewRoomCustomIcon('sparkles');
    };

    const handleDeleteRoomClick = (roomId: string) => {
        showConfirm({
            title: "Delete Room",
            message: "Are you sure you want to delete this room? This will affect historical data.",
            isDangerous: true,
            confirmLabel: "Delete Room",
            onConfirm: () => {
                if (onDeleteRoom) onDeleteRoom(roomId);
            }
        });
    };

    // Booking Management Handlers

    const handleEditBookingClick = (booking: Booking) => {
        setEditingBooking({ ...booking });
    };

    const handleSaveBooking = (updatedBooking: Booking) => {
        if (!updatedBooking.id) {
            // New Booking
            const newId = `manual-${Date.now()}`;
            const finalBooking = { ...updatedBooking, id: newId };
            if (onAddBooking) onAddBooking(finalBooking);
            showToast('Booking created successfully', 'success');
        } else {
            // Update Existing
            if (onUpdateBooking) {
                onUpdateBooking(updatedBooking);
            }
            showToast('Booking updated successfully', 'success');
        }
        setEditingBooking(null);
        setIsAddingBooking(false);
    };



    const handleQuickStatusUpdate = (booking: Booking, newStatus: 'confirmed' | 'cancelled') => {
        if (newStatus === 'cancelled') {
            showConfirm({
                title: "Cancel Booking",
                message: `Are you sure you want to cancel the booking for ${booking.guestName}? This will free up the dates for other guests.`,
                isDangerous: true,
                confirmLabel: "Yes, Cancel Booking",
                onConfirm: () => {
                    if (onUpdateBooking) {
                        onUpdateBooking({ ...booking, status: newStatus });
                    }
                }
            });
        } else {
            if (onUpdateBooking) {
                // If confirming, send the user confirmation email now
                if (newStatus === 'confirmed') {
                    // Find the room for this booking
                    const room = rooms.find(r => r.id === booking.roomId);
                    if (room && settings) {
                        // Only send if enabled in settings
                        if (settings.notifications?.sendUserConfirmation !== false) {
                            sendUserConfirmationEmail({ ...booking, status: 'confirmed' }, room, settings);
                            showToast("Confirmation email sent to guest", "info");
                        }
                    }
                }

                onUpdateBooking({ ...booking, status: newStatus });
            }
        }
    }

    const handleDeleteBookingClick = (id: string) => {
        showConfirm({
            title: "Delete Booking",
            message: "Are you sure you want to delete this booking? This action cannot be undone and will affect analytics.",
            isDangerous: true,
            onConfirm: () => {
                if (onDeleteBooking) onDeleteBooking(id);
            }
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
        const fileTimestamp = format(now, 'yyyy-MM-dd_HHmm');

        const { format: fileFormat, title, notes, overrideRevenue, overrideBookings } = exportConfig;

        const displayRevenue = overrideRevenue || `PHP ${totalRevenue.toLocaleString()}`;
        const displayBookings = overrideBookings || bookings.length.toString();
        const displayActive = activeBookingsCount.toString();
        const displayCancelled = bookings.filter(b => b.status === 'cancelled').length.toString();

        let content = '';
        let mimeType = '';
        let fileExtension = '';

        if (fileFormat === 'csv') {
            content = `Report Title,Date Generated\n"${title}","${reportDate}"\n\n`;
            content += `Metric,Value\n`;
            content += `Total Revenue,"${displayRevenue}"\n`;
            content += `Total Bookings,"${displayBookings}"\n`;
            content += `Active Bookings,"${displayActive}"\n`;
            content += `Cancelled Bookings,"${displayCancelled}"\n\n`;
            if (notes) {
                content += `Notes\n"${notes.replace(/"/g, '""')}"\n`;
            }
            mimeType = 'text/csv;charset=utf-8;';
            fileExtension = 'csv';
        } else {
            // Default to text format for both 'txt' and 'doc' (simple text export)
            content = `=======================================\n`;
            content += `           STAYCATION REPORT           \n`;
            content += `=======================================\n\n`;
            content += `Title: ${title}\n`;
            content += `Date Generated: ${reportDate}\n\n`;
            content += `--- SUMMARY STATS ---\n`;
            content += `Total Revenue      : ${displayRevenue}\n`;
            content += `Total Bookings     : ${displayBookings}\n`;
            content += `Active Bookings    : ${displayActive}\n`;
            content += `Cancelled Bookings : ${displayCancelled}\n\n`;
            if (notes) {
                content += `--- NOTES ---\n${notes}\n\n`;
            }
            content += `=======================================\n`;
            mimeType = 'text/plain;charset=utf-8;';
            fileExtension = 'txt';
        }

        try {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Staycation_Report_${fileTimestamp}.${fileExtension}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast(`Report exported successfully!`, "success");
            setShowExportModal(false);
        } catch (e) {
            console.error("Export failed", e);
            showToast(`Failed to export report`, "error");
        }
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

    // --- Grid View Render (New) ---
    const renderGridCalendar = () => {
        const start = startOfMonth(calendarDate);
        const end = endOfMonth(calendarDate);
        const days = eachDayOfInterval({ start, end });
        const startWeek = getStartOfWeek(start);

        // Generate empty cells for start of month padding
        const paddingDays = differenceInDays(start, startWeek);
        const prefixDays = Array.from({ length: paddingDays }).map((_, i) => addDays(startWeek, i));

        const allCalendarDays = [...prefixDays, ...days];

        const WEEKS = [];
        let currentWeek = [];

        allCalendarDays.forEach(day => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                WEEKS.push(currentWeek);
                currentWeek = [];
            }
        });
        // Handle last partial week
        if (currentWeek.length > 0) {
            // Fill rest with next month days
            const remaining = 7 - currentWeek.length;
            const lastDay = currentWeek[currentWeek.length - 1];
            for (let i = 1; i <= remaining; i++) {
                currentWeek.push(addDays(lastDay, i));
            }
            WEEKS.push(currentWeek);
        }

        return (
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-1">
                <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="bg-gray-50 dark:bg-gray-800 p-1 md:p-2 text-center text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <span className="hidden md:inline">{day}</span>
                            <span className="md:hidden">{day.charAt(0)}</span>
                        </div>
                    ))}

                    {WEEKS.flat().map((date, idx) => {
                        const isCurrentMonth = date.getMonth() === calendarDate.getMonth();
                        const dayBookings = bookings.filter(b => {
                            if (b.status === 'cancelled') return false;

                            // Parse dates properly using local timezone
                            const [startY, startM, startD] = b.checkIn.split('-').map(Number);
                            const [endY, endM, endD] = b.checkOut.split('-').map(Number);
                            const start = new Date(startY, startM - 1, startD, 0, 0, 0, 0);
                            const end = new Date(endY, endM - 1, endD, 0, 0, 0, 0);

                            // Normalize comparing date as well
                            const currentDay = new Date(date);
                            currentDay.setHours(0, 0, 0, 0);

                            // Include both check-in AND check-out day in the display
                            return currentDay >= start && currentDay <= end;
                        });

                        return (
                            <div key={idx} className={`min-h-[60px] md:min-h-[100px] bg-white dark:bg-gray-800 p-1 md:p-2 relative group hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/50 text-gray-400' : ''}`}>
                                <div className={`text-xs md:text-sm font-medium mb-0.5 md:mb-1 ${isSameDay(date, new Date()) ? 'bg-primary text-white w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-sm shadow-sm' : ''}`}>
                                    {date.getDate()}
                                </div>

                                <div className="space-y-0.5 md:space-y-1">
                                    {dayBookings.slice(0, 2).map(booking => {
                                        const colorClass = booking.status === 'pending'
                                            ? 'bg-yellow-500 text-white border-yellow-600 shadow-sm'
                                            : 'bg-primary text-white border-primary shadow-sm';

                                        return (
                                            <button
                                                key={booking.id}
                                                onClick={(e) => { e.stopPropagation(); handleEditBookingClick(booking); }}
                                                className={`w-full text-left text-[8px] md:text-[10px] px-1 py-0.5 md:px-1.5 md:py-1 rounded border truncate font-medium hover:opacity-90 transition-opacity ${colorClass}`}
                                                title={`${booking.guestName} (${booking.guests} guests)\nTime: ${booking.estimatedArrival || '14:00'} - ${booking.estimatedDeparture || '11:00'}`}
                                            >
                                                <span className="hidden md:inline">{booking.guestName}</span>
                                                <span className="md:hidden truncate">{booking.guestName.split(' ')[0] || booking.guestName}</span>
                                            </button>
                                        );
                                    })}
                                    {dayBookings.length > 2 && (
                                        <div className="text-[8px] md:text-[10px] text-gray-400 pl-0.5 md:pl-1 font-medium">
                                            +{dayBookings.length - 2}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const renderCalendarView = () => {
        const daysInMonth = eachDayOfInterval({
            start: startOfMonth(calendarDate),
            end: endOfMonth(calendarDate)
        });

        const CELL_WIDTH = isCalendarExpanded ? 80 : 48; // px
        const ROW_HEIGHT = 64; // px

        // Calculate stats for the side panel
        const currentMonthBookings = bookings.filter(b => isSameMonth(new Date(b.checkIn), summaryDate));
        const confirmedCount = currentMonthBookings.filter(b => b.status === 'confirmed').length;
        const pendingCount = currentMonthBookings.filter(b => b.status === 'pending').length;
        const cancelledCount = currentMonthBookings.filter(b => b.status === 'cancelled').length;
        const monthlyRevenue = currentMonthBookings
            .filter(b => b.status === 'confirmed')
            .reduce((sum, b) => sum + b.totalPrice, 0);

        return (
            <div
                className={isCalendarExpanded
                    ? "fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col p-4 md:p-6 animate-fade-in overflow-hidden"
                    : "animate-fade-in"
                }
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div className="flex flex-col xl:flex-row gap-6 h-full">
                    {/* Main Calendar Area */}
                    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-4 gap-2 md:gap-4 flex-shrink-0">
                            <div className="hidden md:block">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                                    <CalendarIcon className="mr-3 text-primary" size={28} />
                                    {isCalendarExpanded ? 'Expanded Calendar View' : 'Bookings Calendar'}
                                </h2>
                                {!isCalendarExpanded && <p className="text-gray-500 dark:text-gray-400 text-sm">Visual timeline of room occupancy</p>}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
                                {/* Expand/Collapse Button */}
                                <button
                                    onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                                    className={`p-1.5 md:p-2 rounded-lg border transition-colors flex items-center gap-2 font-medium ${isCalendarExpanded ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                        }`}
                                    title={isCalendarExpanded ? "Exit Full Screen" : "Full Screen Calendar"}
                                >
                                    {isCalendarExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>

                                <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-0.5 md:p-1 ml-auto md:ml-0">
                                    <button onClick={() => setCalendarDate(addMonths(calendarDate, -1))} className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md text-gray-600 dark:text-gray-300 active:bg-gray-200 transition-colors"><ChevronLeft size={18} /></button>
                                    <div className="px-2 md:px-3 font-bold text-gray-700 dark:text-gray-200 min-w-[80px] md:min-w-[120px] text-center text-xs md:text-sm">
                                        <span className="hidden md:inline">{format(calendarDate, 'MMMM yyyy')}</span>
                                        <span className="md:hidden">{format(calendarDate, 'MMM yyyy')}</span>
                                    </div>
                                    <button onClick={() => setCalendarDate(addMonths(calendarDate, 1))} className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md text-gray-600 dark:text-gray-300 active:bg-gray-200 transition-colors"><ChevronRight size={18} /></button>
                                </div>
                            </div>
                        </div>

                        {/* Pending Badge if hidden from side */}
                        {pendingBookings.length > 0 && isCalendarExpanded && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                                <span className="text-yellow-800 font-bold flex items-center text-sm"><Clock size={16} className="mr-2" /> {pendingBookings.length} Pending Approvals</span>
                            </div>
                        )}

                        {/* Upcoming Arrivals - Easy to see incoming bookings */}
                        {(() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const next7Days = new Date(today);
                            next7Days.setDate(next7Days.getDate() + 30);

                            const upcomingArrivals = bookings
                                .filter(b => {
                                    if (b.status === 'cancelled') return false;
                                    const checkIn = new Date(b.checkIn);
                                    checkIn.setHours(0, 0, 0, 0);
                                    return checkIn >= today && checkIn <= next7Days;
                                })
                                .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

                            if (upcomingArrivals.length === 0) return null;

                            return (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 md:p-4 mb-4 flex-shrink-0">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-blue-800 dark:text-blue-200 flex items-center text-sm md:text-base">
                                            <CalendarIcon size={18} className="mr-2" />
                                            📅 All Upcoming Arrivals ({upcomingArrivals.length})
                                        </h3>
                                        <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full">Next 30 days</span>
                                    </div>
                                    <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-thin">
                                        {upcomingArrivals.map(booking => {
                                            const room = rooms.find(r => r.id === booking.roomId);
                                            const checkInDate = new Date(booking.checkIn);
                                            const isToday = isSameDay(checkInDate, new Date());
                                            const isTomorrow = isSameDay(checkInDate, addDays(new Date(), 1));

                                            return (
                                                <button
                                                    key={booking.id}
                                                    onClick={() => handleEditBookingClick(booking)}
                                                    className={`flex-shrink-0 p-2 md:p-3 rounded-lg border-2 text-left transition-all hover:shadow-md ${isToday
                                                        ? 'bg-green-100 dark:bg-green-900/50 border-green-400 hover:border-green-500'
                                                        : isTomorrow
                                                            ? 'bg-yellow-50 dark:bg-yellow-900/50 border-yellow-300 hover:border-yellow-400'
                                                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300'
                                                        }`}
                                                    style={{ minWidth: '140px', maxWidth: '180px' }}
                                                >
                                                    <div className={`text-[10px] font-bold uppercase mb-1 ${isToday ? 'text-green-700 dark:text-green-400' : isTomorrow ? 'text-yellow-700 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'
                                                        }`}>
                                                        {isToday ? '🔔 TODAY' : isTomorrow ? '⏰ Tomorrow' : format(checkInDate, 'EEE, MMM d')}
                                                    </div>
                                                    <div className="font-bold text-gray-800 dark:text-white text-sm truncate">{booking.guestName}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{room?.name || 'Unknown Room'}</div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {booking.nights === 0 ? 'Day Use' : `${booking.nights} night${booking.nights > 1 ? 's' : ''}`} • {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 flex items-center mt-0.5">
                                                        <Clock size={10} className="mr-1" />
                                                        {booking.estimatedArrival || '14:00'} - {booking.estimatedDeparture || '11:00'}
                                                    </div>
                                                    {booking.status === 'pending' && (
                                                        <div className="mt-1 text-[10px] font-bold text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded inline-block">
                                                            PENDING
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}

                                    </div>
                                </div>
                            );
                        })()}

                        <div className="flex-1 min-h-0 overflow-auto">
                            {renderGridCalendar()}
                        </div>
                    </div>

                    {/* Side Stats Panel */}
                    <div className={`w-full xl:w-80 flex-shrink-0 flex flex-col gap-6 ${isCalendarExpanded ? 'hidden xl:flex' : ''}`}>
                        {/* Quick Stats */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                                <TrendingUp className="mr-2 text-primary" size={20} />
                                Month Summary
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Date</p>
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => setSummaryDate(addMonths(summaryDate, -1))} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-600 dark:text-gray-300 transition-colors"><ChevronLeft size={16} /></button>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{format(summaryDate, 'MMMM yyyy')}</p>
                                        <button onClick={() => setSummaryDate(addMonths(summaryDate, 1))} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-600 dark:text-gray-300 transition-colors"><ChevronRight size={16} /></button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                        <div className="text-xs text-blue-800 font-bold mb-1">Bookings</div>
                                        <div className="text-xl font-bold text-blue-900">{currentMonthBookings.length}</div>
                                    </div>
                                    <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                                        <div className="text-xs text-green-800 font-bold mb-1">Revenue</div>
                                        <div className="text-xl font-bold text-green-900">₱{monthlyRevenue.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 flex items-center"><CheckCircle size={14} className="mr-1.5 text-green-500" /> Confirmed</span>
                                        <span className="font-bold text-gray-700 dark:text-gray-200">{confirmedCount}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 flex items-center"><Clock size={14} className="mr-1.5 text-yellow-500" /> Pending</span>
                                        <span className="font-bold text-gray-700 dark:text-gray-200">{pendingCount}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 flex items-center"><XCircle size={14} className="mr-1.5 text-red-500" /> Cancelled</span>
                                        <span className="font-bold text-gray-700 dark:text-gray-200">{cancelledCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pending Actions List */}
                        {pendingBookings.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-900/50 overflow-hidden flex-1 min-h-[300px]">
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 px-5 py-4 border-b border-yellow-100 dark:border-yellow-900/30">
                                    <h3 className="text-yellow-800 dark:text-yellow-200 font-bold flex items-center">
                                        <Bell className="mr-2" size={18} /> Pending ({pendingBookings.length})
                                    </h3>
                                </div>
                                <div className="overflow-y-auto max-h-[300px] md:max-h-[500px] p-2 space-y-2">
                                    {pendingBookings.map(b => (
                                        <div
                                            key={b.id}
                                            className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer relative group"
                                            onClick={() => handleEditBookingClick(b)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-gray-800 dark:text-white text-sm md:text-base">{b.guestName}</h3>
                                                    <p className="text-xs text-primary font-medium mt-0.5">
                                                        {rooms.find(r => r.id === b.roomId)?.name || 'Unknown Room'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                                        <CalendarIcon size={12} className="mr-1" />
                                                        {format(new Date(b.checkIn), 'MMM d')} - {format(new Date(b.checkOut), 'MMM d')}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                                        <Users size={12} className="mr-1" />
                                                        {b.guests} Guests
                                                    </p>
                                                    {b.paymentProof && (
                                                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                            <ImageIcon size={10} className="mr-1" /> Proof Uploaded
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 text-[10px] uppercase font-bold px-2 py-1 rounded">
                                                    New
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 relative z-10">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleQuickStatusUpdate(b, 'confirmed'); }}
                                                    className="flex-1 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold rounded hover:bg-green-100 dark:hover:bg-green-900/50 flex items-center justify-center"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleQuickStatusUpdate(b, 'cancelled'); }}
                                                    className="flex-1 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center justify-center"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderHelpModal = () => {
        if (!showHelpModal) return null;

        // Custom UI Components for the Tutorial
        const JumpToTab = ({ tab, label, icon }: { tab: 'overview' | 'calendar' | 'rooms' | 'settings', label: string, icon?: React.ReactNode }) => (
            <button 
                onClick={() => {
                    setActiveTab(tab);
                    setShowHelpModal(false);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full transition-all font-bold text-[10px] uppercase tracking-wider border border-primary/20 hover:border-primary shadow-sm group mx-1 align-middle"
            >
                {icon}
                {label}
                <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
        );

        const ProTip = ({ children, icon }: { children: React.ReactNode, icon?: React.ReactNode }) => (
            <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 p-4 rounded-r-xl my-6 flex gap-3 shadow-sm">
                <div className="text-amber-500 shrink-0 mt-0.5">{icon || <Sparkles size={20} />}</div>
                <div className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                    <span className="font-black uppercase text-[10px] tracking-widest block mb-1 opacity-60">Success Strategy</span>
                    {children}
                </div>
            </div>
        );

        const StepCard = ({ number, title, desc, icon, color }: { number: number, title: string, desc: string, icon: React.ReactNode, color: string }) => (
            <div className="relative p-6 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity scale-150 rotate-12" style={{ color: color }}>
                    {icon}
                </div>
                <div className="flex gap-4 items-start relative z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 text-white" style={{ backgroundColor: color }}>
                        {number}
                    </div>
                    <div>
                        <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm mb-1">{title}</h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                    </div>
                </div>
            </div>
        );
        
        const sections = [
            {
                id: "how-it-works",
                title: "1. How the System Works",
                icon: <Zap size={18} />,
                content: (
                    <div className="space-y-8">
                        <div className="bg-gradient-to-r from-primary/20 to-transparent p-6 rounded-2xl border border-primary/10">
                            <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Welcome to your Dashboard!</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                This system is designed to automate your bookings, organize your calendar, and give your guests a premium booking experience. Below is the quick map of your business areas:
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {[
                                { name: "Guest Portal", user: "Customers", access: "Live Website", icon: <Globe size={16}/>, color: "blue" },
                                { name: "Admin Panel", user: "Staff / You", access: "This Dashboard", icon: <Lock size={16}/>, color: "purple" },
                                { name: "Visual Builder", user: "Design Mode", access: "Edit Mode", icon: <Palette size={16}/>, color: "orange" }
                            ].map((area, i) => (
                                <div key={i} className="bg-white dark:bg-gray-950 border dark:border-gray-800 p-5 rounded-2xl shadow-sm hover:border-primary/20 transition-colors">
                                    <div className={`w-8 h-8 rounded-lg bg-${area.color}-500/10 text-${area.color}-500 flex items-center justify-center mb-3`}>
                                        {area.icon}
                                    </div>
                                    <h5 className="font-extrabold text-gray-900 dark:text-white text-xs uppercase tracking-widest mb-3">{area.name}</h5>
                                    <div className="space-y-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                        <p className="flex justify-between"><span>Primary User:</span> <span className="text-gray-900 dark:text-white">{area.user}</span></p>
                                        <p className="flex justify-between"><span>Access Via:</span> <span className="text-gray-900 dark:text-white">{area.access}</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-sm shrink-0">The Guest Journey</h4>
                                <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <StepCard number={1} title="Select Room" desc="Guest browses your beautiful rooms and clicks 'Book Now'." icon={<BedDouble />} color="#3b82f6" />
                                <StepCard number={2} title="Pick Dates" desc="They select dates on your interactive calendar logic." icon={<Calendar />} color="#8b5cf6" />
                                <StepCard number={3} title="Payment" desc="They scan your pre-set QR codes to pay the deposit." icon={<CreditCard />} color="#10b981" />
                                <StepCard number={4} title="Confirmation" desc="You receive a notification and confirm the booking here." icon={<CheckCircle />} color="#f59e0b" />
                            </div>
                        </div>
                    </div>
                )
            },
            {
                id: "getting-started",
                title: "2. Getting Started",
                icon: <Rocket size={18} />,
                content: (
                    <div className="space-y-8">
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                    <Lock size={20} />
                                </div>
                                <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Step 1: Secure Your Dashboard</h4>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                                Go to the <JumpToTab tab="settings" label="Settings" icon={<SettingsIcon size={12}/>} /> tab and set a robust 6-digit passcode. This prevents unauthorized access to your revenue data.
                            </p>
                        </section>
                        
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                                    <PlusCircle size={20} />
                                </div>
                                <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Step 2: Add Your Inventory</h4>
                            </div>
                            <div className="ml-11 space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Head over to <JumpToTab tab="rooms" label="Manage Rooms" icon={<BedDouble size={12}/>} /> to list your properties.</p>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {["Use high-res photos", "Define capacity limits", "Set nightly rates", "List all amenities"].map((text, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border dark:border-gray-700">
                                            <CheckCircle size={14} className="text-green-500" /> {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <ProTip>
                            Before going live, visit the <JumpToTab tab="settings" label="Payments" icon={<CreditCard size={12}/>} /> section and upload your QR codes. Testing a fake booking yourself is the best way to see what your clients experience!
                        </ProTip>
                    </div>
                )
            },
            {
                id: "visual-builder",
                title: "3. Visual Builder",
                icon: <Palette size={18} />,
                content: (
                    <div className="space-y-8">
                        <div className="relative aspect-video rounded-2xl bg-gray-900 overflow-hidden group shadow-lg border dark:border-gray-800">
                            <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/10 backdrop-blur-[1px]">
                                <div className="text-center p-8">
                                    <Palette size={64} className="text-white mb-4 mx-auto drop-shadow-sm" />
                                    <h4 className="text-white text-xl font-black uppercase tracking-widest drop-shadow-md">No-Code Website Editor</h4>
                                    <button 
                                        onClick={() => {
                                            onEnterVisualBuilder?.();
                                            setShowHelpModal(false);
                                        }}
                                        className="mt-6 px-8 py-3 bg-white text-indigo-600 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-xl flex items-center gap-2 mx-auto"
                                    >
                                        Launch Editor <ExternalLink size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                { title: "Direct Text Edit", desc: "Click any text on the live site to change it instantly." },
                                { title: "Media Swap", desc: "Click images to upload your own property gallery." },
                                { title: "Color Profiles", desc: "Change the primary color to update all buttons and highlights." },
                                { title: "Real-Time Preview", desc: "What you see is exactly what your guests will see." }
                            ].map((tip, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border dark:border-gray-700">
                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-inner text-indigo-500 shrink-0 uppercase font-black text-xs">0{i+1}</div>
                                    <div>
                                        <h5 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{tip.title}</h5>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{tip.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            },
            {
                id: "dashboard",
                title: "4. Dashboard Mastery",
                icon: <LayoutDashboard size={18} />,
                content: (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-950 border dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                            <div className="p-8 md:w-1/2 border-r dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
                                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-tight">
                                    <Calendar className="text-blue-500" /> The Master Calendar
                                </h4>
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">New bookings arrive as <span className="text-yellow-500 font-black italic">PENDING</span> blocks. You must verify payment before clicking confirm.</p>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <div className="px-3 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-black rounded-lg uppercase tracking-widest border border-yellow-200 shadow-sm">🟡 Pending</div>
                                        <div className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-lg uppercase tracking-widest border border-green-200 shadow-sm">🟢 Confirmed</div>
                                        <div className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-lg uppercase tracking-widest border border-red-200 shadow-sm">🔴 Cancelled</div>
                                    </div>
                                    <div className="pt-4">
                                        <JumpToTab tab="calendar" label="Go to Calendar" icon={<CalendarIcon size={12}/>} />
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 md:w-1/2">
                                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-tight">
                                    <TrendingUp className="text-purple-500" /> Business Analytics
                                </h4>
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">Track your total revenue, upcoming arrivals, and occupancy. Use the 'Export' feature to get your paperwork done in seconds.</p>
                                    <div className="pt-4 flex gap-2">
                                        <JumpToTab tab="overview" label="View Analytics" icon={<BarChart size={12}/>} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            },
            {
                id: "room-expert",
                title: "5. Room Management",
                icon: <BedDouble size={18} />,
                content: (
                    <div className="space-y-8">
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Listing Magic</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                        Your <JumpToTab tab="rooms" label="Rooms Tab" icon={<BedDouble size={12}/>} /> is where you generate income. To maximize bookings:
                                    </p>
                                </div>
                                <ul className="space-y-4">
                                    {[
                                        { t: "Photo Order", d: "First photo is your 'Hero'. Use your best shot of the villa or room view." },
                                        { t: "Amenity Icons", d: "Don't skip icons like Pool or AC—visual cues sell better than text." },
                                        { t: "Descriptive Titles", d: "Use names like 'Serenity Ocean Suite' instead of 'Room 1'." }
                                    ].map((item, i) => (
                                        <li key={i} className="flex gap-4">
                                            <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5"><Sparkles size={12}/></div>
                                            <div>
                                                <h6 className="font-black text-xs text-gray-900 dark:text-white uppercase">{item.t}</h6>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.d}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-gray-900 rounded-3xl p-8 relative overflow-hidden group shadow-2xl min-h-[300px] flex flex-col justify-end">
                                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <BedDouble size={120} />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <div className="px-4 py-1.5 bg-green-500 text-white text-[10px] font-black rounded-full w-fit uppercase tracking-widest">Revenue Hack</div>
                                    <h4 className="text-white text-xl font-black uppercase tracking-tight">The "Day Use" Strategy</h4>
                                    <p className="text-gray-400 text-xs leading-relaxed italic">
                                        Set a separate <strong>Day Use Price</strong> to allow guests to book for swimming or group events without staying overnight. This doubles your occupancy potential!
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                )
            },
            {
                id: "booking-mechanics",
                title: "6. Guest Booking Mechanics",
                icon: <MessageCircle size={18} />,
                content: (
                    <div className="space-y-8">
                        <div className="text-center mb-4">
                            <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">The Conversion Funnel</h4>
                            <p className="text-sm text-gray-400">Understanding exactly what your guest sees at checkout</p>
                        </div>
                        
                        <div className="relative flex flex-col gap-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-800">
                            {[
                                { title: "Room Discovery", desc: "Guest browses the landing page and selects their perfect stay.", icon: <Eye /> },
                                { title: "Dynamic Calendar", desc: "Our system calculates total price based on Nightly vs Day Use rates automatically.", icon: <Calendar /> },
                                { title: "Instant QR Payment", desc: "They scan your custom GCash/Bank codes provided in Settings.", icon: <CreditCard /> },
                                { title: "Guest Handshake", desc: "Request submitted! Guest gets a Reference ID and stays on the page until you confirm.", icon: <Users /> }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-6 relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                                        {step.icon}
                                    </div>
                                    <div className="py-2">
                                        <h5 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-tight text-sm mb-1">{step.title}</h5>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-lg">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            },
            {
                id: "payment-vault",
                title: "7. Payment & Vault Setup",
                icon: <CreditCard size={18} />,
                content: (
                    <div className="space-y-8">
                        <div className="p-8 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent border border-indigo-200 dark:border-indigo-800 rounded-3xl relative overflow-hidden">
                             <CreditCard className="absolute -bottom-4 -right-4 size-48 opacity-[0.03] rotate-12" />
                             <div className="space-y-6 relative z-10">
                                <h4 className="text-lg font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-tight">Your Digital Cashier</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                                    Configure how you get paid in <JumpToTab tab="settings" label="Payment Settings" icon={<CreditCard size={12}/>} />. 
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 shadow-sm">
                                        <h5 className="font-black text-xs uppercase mb-1 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> GCash</h5>
                                        <p className="text-[10px] text-gray-400">Upload your QR + Account Name & Number</p>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 shadow-sm">
                                        <h5 className="font-black text-xs uppercase mb-1 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Bank Transfer</h5>
                                        <p className="text-[10px] text-gray-400">Works with Maya, BPI, BDO, etc.</p>
                                    </div>
                                </div>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-gray-50 dark:bg-gray-950 rounded-2xl border dark:border-gray-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-2 h-full bg-primary" />
                                <h4 className="font-black text-gray-900 dark:text-white uppercase text-xs mb-3 tracking-widest">Deposit Control</h4>
                                <p className="text-xs text-gray-500 leading-relaxed mb-4">Securing bookings with a partial deposit (e.g., 50%) is the best way to prevent no-shows.</p>
                                <JumpToTab tab="settings" label="Adjust Deposits" />
                            </div>
                            <div className="p-6 bg-gray-50 dark:bg-gray-950 rounded-2xl border dark:border-gray-800 relative overflow-hidden group font-medium">
                                <h4 className="font-black text-gray-900 dark:text-white uppercase text-xs mb-3 tracking-widest">Verify Manually</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">Guests scan your code but the system doesn't "know" they paid until you verify. Always wait for payment proof before confirming!</p>
                            </div>
                        </div>
                    </div>
                )
            },
            {
                id: "operations",
                title: "8. Admin Operations",
                icon: <SettingsIcon size={18} />,
                content: (
                    <div className="space-y-8">
                        <section className="space-y-6">
                             <div className="flex items-center gap-4">
                                <Clock className="text-primary" />
                                <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-sm">Operations & Logistics</h4>
                                <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-6 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-3xl hover:border-primary/20 transition-colors group">
                                    <h5 className="font-black text-xs uppercase mb-2 group-hover:text-primary transition-colors">Check-in / Check-out</h5>
                                    <p className="text-[11px] text-gray-500 mb-4">Set your standard check-in/out times. Guests can see these during the booking process.</p>
                                    <JumpToTab tab="settings" label="Change Times" />
                                </div>
                                <div className="p-6 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-3xl hover:border-primary/20 transition-colors group">
                                    <h5 className="font-black text-xs uppercase mb-2 group-hover:text-primary transition-colors">Safety & Security</h5>
                                    <p className="text-[11px] text-gray-500 mb-4">Regularly update your <JumpToTab tab="settings" label="Admin Passcode" /> to keep your records private.</p>
                                </div>
                            </div>
               </div>
                        </section>

                        <ProTip icon={<AlertCircle size={20} className="text-red-500" />}>
                            <span className="text-red-800 dark:text-red-300 uppercase font-black text-[10px] block mb-1">Action Required</span>
                             Wait for the guest to send their payment screenshot via your preferred chat (Messenger, Email). Use the <JumpToTab tab="calendar" label="Calendar Details" /> to see their contact info!
                        </ProTip>
                    </div>
                )
            },
            {
                id: "day-use-deep",
                title: "9. Day Use Logic",
                icon: <Sun size={18} />,
                content: (
                    <div className="space-y-8 text-sm text-gray-600 dark:text-gray-400 font-medium">
                        <div className="p-10 bg-gradient-to-br from-amber-400/10 to-transparent border dark:border-gray-800 rounded-[2.5rem] relative overflow-hidden text-center flex flex-col items-center">
                            <Sun size={80} className="text-amber-500 mb-6 opacity-60" />
                            <h4 className="text-2xl font-black text-amber-900 dark:text-amber-500 uppercase tracking-widest mb-4">Solar Bookings</h4>
                            <p className="text-amber-800 dark:text-amber-200/60 italic leading-relaxed max-w-md mx-auto">
                                "The Day Use feature is your secret weapon for mid-week occupancy. It lets you rent the property while your overnight calendar is empty!"
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-4">
                                <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-tight border-b-2 border-amber-400/30 pb-2 w-fit">How It Triggers</h5>
                                <p className="text-sm">When a guest clicks <strong>ONCE</strong> on the calendar, the system checks for a 'Day Use Price' in <JumpToTab tab="rooms" label="Manage Rooms" />. If found, it selects that single date as a Day Use booking.</p>
                                <p className="text-sm">If you don't provide a Day Use price, the system forces a minimum 1-night stay (requires selecting 2 dates).</p>
                            </div>
                            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                <h6 className="font-black text-xs mb-3 text-gray-400 uppercase">Ideal for:</h6>
                                <ul className="space-y-3">
                                    {["Pool Access (8am - 5pm)", "Pool House Venues", "Corporate Outings", "Family Reunions"].map((t, i) => (
                                        <li key={i} className="flex gap-2 items-center text-xs text-gray-900 dark:text-white font-bold">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )
            },
            {
                id: "awards",
                title: "10. Tips for Success",
                icon: <Award size={18} />,
                content: (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { t: "Photo Magic", c: "blue", d: "Guests book based on visuals. Invest in good lighting and clear property shots." },
                                { t: "Speed Factor", c: "green", d: "Confirming a booking within 30 minutes increases guest loyalty tenfold." },
                                { t: "The Theme", c: "purple", d: "Use the Visual Builder to make the website feel like 'Home' for your brand." },
                                { t: "Deposit Logic", c: "amber", d: "Always require at least ₱500 to keep the booking firm and reduce no-shows." }
                            ].map((tip, i) => (
                                <div key={i} className={`p-6 bg-white dark:bg-gray-800 border border-${tip.c}-500/20 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-default`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2 bg-${tip.c}-500/10 text-${tip.c}-500 rounded-lg`}>
                                            <Award size={18}/>
                                        </div>
                                        <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm">{tip.t}</h5>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed">{tip.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }
        ];

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4" onClick={() => setShowHelpModal(false)}>
                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md transition-opacity" />
                <div
                    className="relative bg-white dark:bg-gray-900 w-full max-w-6xl h-full sm:h-[85vh] sm:rounded-3xl shadow-2xl flex overflow-hidden animate-pop border dark:border-gray-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Internal Sidebar */}
                    <div className="w-16 sm:w-72 bg-gray-50/50 dark:bg-gray-950/50 border-r dark:border-gray-800 flex flex-col shrink-0 backdrop-blur-lg">
                        <div className="px-6 py-10 hidden sm:block">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-tighter italic">
                                <div className="p-1.5 bg-primary text-white rounded-lg -rotate-6 shadow-lg shadow-primary/20"><HelpCircle size={20} /></div> TUTORIAL
                            </h2>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-2 font-black opacity-60">Admin Companion v2.0</p>
                        </div>
                        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
                            {sections.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveHelpTab(idx)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeHelpTab === idx 
                                        ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-xl shadow-primary/10 border-2 border-primary scale-102 font-black' 
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800/50'}`}
                                >
                                    <div className="shrink-0">{s.icon}</div>
                                    <span className="hidden sm:block text-[11px] truncate uppercase tracking-widest">{s.title.split('. ')[1]}</span>
                                </button>
                            ))}
                        </div>
                        <div className="p-6 border-t dark:border-gray-800 hidden sm:block text-center opacity-40">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Built for Excellence</p>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900/50">
                        <header className="px-10 py-8 flex justify-between items-center sticky top-0 z-10">
                            <div className="animate-fade-in-left">
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-1">
                                    {sections[activeHelpTab].title}
                                </h3>
                                <div className="flex items-center gap-2">
                                     <div className="h-1 w-6 bg-primary rounded-full" />
                                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest opacity-80">Operational Mastery Series</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowHelpModal(false)} 
                                className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full hover:bg-red-500 hover:text-white transition-all transform hover:rotate-90 group shadow-inner border dark:border-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </header>
                        
                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                            <div className="max-w-4xl mx-auto">
                                {sections[activeHelpTab].content}
                                
                                <div className="mt-16 pt-16 border-t font-medium dark:border-gray-800 text-center space-y-4 animate-fade-in-up">
                                    <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Need Direct Assistance?</h4>
                                    <div className="flex justify-center gap-4">
                                        <button className="flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-colors">
                                            <MessageCircle size={14}/> Support Chat
                                        </button>
                                        <button className="flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-colors">
                                            <FileText size={14}/> Full Manual
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <footer className="px-10 py-6 border-t dark:border-gray-800 bg-white dark:bg-gray-950 flex justify-between items-center shrink-0">
                             <div className="flex gap-2">
                                {sections.map((_, i) => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === activeHelpTab ? 'w-10 bg-primary shadow-lg shadow-primary/20' : 'w-1.5 bg-gray-200 dark:bg-gray-800'}`} />
                                ))}
                             </div>
                             <div className="flex gap-3">
                                {activeHelpTab > 0 && (
                                    <button 
                                        onClick={() => setActiveHelpTab(prev => prev - 1)}
                                        className="px-6 py-3 border-2 dark:border-gray-700 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
                                    >
                                        Back
                                    </button>
                                )}
                                {activeHelpTab < sections.length - 1 ? (
                                    <button 
                                        onClick={() => setActiveHelpTab(prev => prev + 1)}
                                        className="px-10 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black dark:hover:bg-gray-100 shadow-2xl shadow-blue-500/10 active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        Next Chapter <ChevronRight size={14} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setShowHelpModal(false)}
                                        className="px-12 py-3 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 active:scale-95 transition-all font-bold"
                                    >
                                        Mastered! Close
                                    </button>
                                )}
                             </div>
                        </footer>
                    </div>
                </div>
            </div>
        );
    };

    const renderSettingsView = () => {
        if (!settingsForm) return (
            <div className="flex flex-col justify-center items-center h-64 animate-fade-in">
                <Loader className="animate-spin text-primary mb-4" size={48} />
                <p className="text-gray-500 text-lg">Loading Settings...</p>
                <p className="text-gray-400 text-sm mt-2">If this persists, try refreshing the page.</p>
            </div>
        );

        return (
            <div className="animate-fade-in max-w-4xl mx-auto pb-12">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                        <SettingsIcon className="mr-3 text-primary" size={28} />
                        Site Settings
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Customize your white-label application</p>
                </div>

                <div className="space-y-6 text-left">
                    {/* Brand Settings */}
                    <div id="settings-brand" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between border-b dark:border-gray-700 pb-2 mb-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                                <Globe size={20} className="mr-2 text-primary" /> Brand Identity
                            </h3>
                            <button
                                onClick={() => onUpdateSettings(settingsForm)}
                                className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                            >
                                Save Settings
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Site Name
                                    <HelpTooltip text="The name of your staycation business displayed throughout the site" />
                                </label>
                                <input
                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={settingsForm.siteName}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                    <HelpTooltip text="A short tagline or description for your website (Meta information)" />
                                </label>
                                <input
                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={settingsForm.description}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Logo URL
                                    <HelpTooltip text="Direct link to your logo image (recommended size: 200x50px)" />
                                </label>
                                <input
                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={settingsForm.logo || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, logo: e.target.value })}
                                    placeholder="https://example.com/logo.png"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Hero & Features Note */}
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-xl border border-blue-200 dark:border-blue-800 flex items-start">
                        <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full mr-4 text-blue-600 dark:text-blue-300">
                            <Edit size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-1">Visual Builder Enabled</h3>
                            <p className="text-blue-600 dark:text-blue-300 mb-3">
                                The <strong>Hero Section</strong>, <strong>Features</strong>, and <strong>Why Choose Us</strong> content can now be edited directly on the Home Page using the visual editor.
                            </p>
                            {onEnterVisualBuilder && (
                                <button
                                    onClick={onEnterVisualBuilder}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm flex items-center"
                                >
                                    <Palette size={16} className="mr-2" /> Launch Visual Editor
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Map Configuration */}
                    <div id="settings-map" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center border-b dark:border-gray-700 pb-2">
                            <Globe size={20} className="mr-2 text-primary" /> Map Configuration
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Google Maps Embed URL
                                    <HelpTooltip text="The 'src' value from the Google Maps 'Share > Embed a map' HTML code" />
                                </label>
                                <input
                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={settingsForm.map?.embedUrl || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, map: { ...settingsForm.map, embedUrl: e.target.value } })}
                                    placeholder="https://www.google.com/maps/embed?..."
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Paste the 'src' attribute from the Google Maps Embed code.</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div id="settings-payment" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center border-b dark:border-gray-700 pb-2">
                            <CreditCard size={20} className="mr-2 text-primary" /> Payment Methods
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Upload QR codes for customers to scan and pay. They will see these after booking.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* GCash */}
                            <div className="border dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-gray-700 dark:text-gray-200 flex items-center">
                                        <span className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center mr-2 text-xs font-bold">
                                            {settingsForm.paymentMethods?.gcash?.label?.charAt(0) || 'G'}
                                        </span>
                                        {settingsForm.paymentMethods?.gcash?.label || 'E-Wallet'}
                                    </h4>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settingsForm.paymentMethods?.gcash?.enabled ?? true}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                paymentMethods: {
                                                    ...settingsForm.paymentMethods,
                                                    gcash: { ...settingsForm.paymentMethods?.gcash, enabled: e.target.checked }
                                                }
                                            })}
                                            className="w-4 h-4 text-primary rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                                            Enabled
                                            <HelpTooltip text="Toggle this off to temporarily hide GCash as a payment option" />
                                        </span>
                                    </label>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                                            Account Type / Label
                                            <HelpTooltip text="Customize the name (e.g. GCash, Maya, PayPal)" />
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. E-Wallet"
                                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            value={settingsForm.paymentMethods?.gcash?.label ?? ''}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                paymentMethods: {
                                                    ...settingsForm.paymentMethods,
                                                    gcash: { ...settingsForm.paymentMethods?.gcash, label: e.target.value }
                                                }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Account Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Juan Dela Cruz"
                                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            value={settingsForm.paymentMethods?.gcash?.accountName ?? ''}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                paymentMethods: {
                                                    ...settingsForm.paymentMethods,
                                                    gcash: { ...settingsForm.paymentMethods?.gcash, accountName: e.target.value }
                                                }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 09XX XXX XXXX"
                                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            value={settingsForm.paymentMethods?.gcash?.accountNumber ?? ''}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                paymentMethods: {
                                                    ...settingsForm.paymentMethods,
                                                    gcash: { ...settingsForm.paymentMethods?.gcash, accountNumber: e.target.value }
                                                }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">QR Code Image URL</label>
                                        <input
                                            type="text"
                                            placeholder="Paste image URL here"
                                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            value={settingsForm.paymentMethods?.gcash?.qrImage ?? ''}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                paymentMethods: {
                                                    ...settingsForm.paymentMethods,
                                                    gcash: { ...settingsForm.paymentMethods?.gcash, qrImage: e.target.value }
                                                }
                                            })}
                                        />
                                        {settingsForm.paymentMethods?.gcash?.qrImage && (
                                            <img src={settingsForm.paymentMethods.gcash.qrImage} alt="E-Wallet QR" className="mt-3 w-32 h-32 object-contain border dark:border-gray-600 rounded-lg bg-white" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bank Transfer */}
                            <div className="border dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-gray-700 dark:text-gray-200 flex items-center">
                                        <span className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center mr-2 text-xs font-bold">
                                            {settingsForm.paymentMethods?.bankTransfer?.label?.charAt(0) || '₱'}
                                        </span>
                                        {settingsForm.paymentMethods?.bankTransfer?.label || 'Bank Transfer'}
                                    </h4>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settingsForm.paymentMethods?.bankTransfer?.enabled ?? false}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                paymentMethods: {
                                                    ...settingsForm.paymentMethods,
                                                    bankTransfer: { ...settingsForm.paymentMethods?.bankTransfer, enabled: e.target.checked }
                                                }
                                            })}
                                            className="w-4 h-4 text-primary rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                                            Enabled
                                            <HelpTooltip text="Toggle this off to temporarily hide Bank Transfer as a payment option" />
                                        </span>
                                    </label>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                                            Account Type / Label
                                            <HelpTooltip text="Customize the name (e.g. Bank Transfer, BPI, PayMaya)" />
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Bank Transfer"
                                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            value={settingsForm.paymentMethods?.bankTransfer?.label ?? ''}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                paymentMethods: {
                                                    ...settingsForm.paymentMethods,
                                                    bankTransfer: { ...settingsForm.paymentMethods?.bankTransfer, label: e.target.value }
                                                }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Bank Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. BDO, BPI, UnionBank"
                                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            value={settingsForm.paymentMethods?.bankTransfer?.bankName ?? ''}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                paymentMethods: {
                                                    ...settingsForm.paymentMethods,
                                                    bankTransfer: { ...settingsForm.paymentMethods?.bankTransfer, bankName: e.target.value }
                                                }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Account Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Juan Dela Cruz"
                                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            value={settingsForm.paymentMethods?.bankTransfer?.accountName ?? ''}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                paymentMethods: {
                                                    ...settingsForm.paymentMethods,
                                                    bankTransfer: { ...settingsForm.paymentMethods?.bankTransfer, accountName: e.target.value }
                                                }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 1234 5678 9012"
                                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            value={settingsForm.paymentMethods?.bankTransfer?.accountNumber ?? ''}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                paymentMethods: {
                                                    ...settingsForm.paymentMethods,
                                                    bankTransfer: { ...settingsForm.paymentMethods?.bankTransfer, accountNumber: e.target.value }
                                                }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">QR Code Image URL</label>
                                        <input
                                            type="text"
                                            placeholder="Paste image URL here"
                                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            value={settingsForm.paymentMethods?.bankTransfer?.qrImage ?? ''}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                paymentMethods: {
                                                    ...settingsForm.paymentMethods,
                                                    bankTransfer: { ...settingsForm.paymentMethods?.bankTransfer, qrImage: e.target.value }
                                                }
                                            })}
                                        />
                                        {settingsForm.paymentMethods?.bankTransfer?.qrImage && (
                                            <img src={settingsForm.paymentMethods.bankTransfer.qrImage} alt="Bank QR" className="mt-3 w-32 h-32 object-contain border dark:border-gray-600 rounded-lg bg-white" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Media Links */}
                    <div id="settings-social" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center border-b dark:border-gray-700 pb-2">
                            <Share2 size={20} className="mr-2 text-primary" /> Social Media Links
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Connect your social accounts so guests can follow you.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facebook URL</label>
                                <input
                                    type="url"
                                    placeholder="https://facebook.com/yourpage"
                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={settingsForm.social?.facebook || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, social: { ...settingsForm.social, facebook: e.target.value, facebookLabel: 'Facebook' } as any })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instagram URL</label>
                                <input
                                    type="url"
                                    placeholder="https://instagram.com/yourpage"
                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={settingsForm.social?.instagram || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, social: { ...settingsForm.social, instagram: e.target.value, instagramLabel: 'Instagram' } as any })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Airbnb URL</label>
                                <input
                                    type="url"
                                    placeholder="https://airbnb.com/rooms/12345"
                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={settingsForm.social?.airbnb || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, social: { ...settingsForm.social, airbnb: e.target.value, airbnbLabel: 'Airbnb' } as any })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website or Other Link</label>
                                <input
                                    type="url"
                                    placeholder="https://yourwebsite.com"
                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={settingsForm.social?.customUrl || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, social: { ...settingsForm.social, customUrl: e.target.value, customLabel: 'Website' } as any })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reservation & Deposit Settings */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                            <CreditCard className="mr-2 text-primary" size={20} />
                            Reservation & Deposit Settings
                        </h3>

                        {/* Require Deposit Toggle */}
                        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-white flex items-center">
                                        Require Deposit
                                        <HelpTooltip text="If enabled, guests must upload a payment proof before their booking is saved" />
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Guests must pay a deposit to confirm their booking</p>
                                </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settingsForm.reservationPolicy?.requireDeposit ?? true}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        reservationPolicy: {
                                            ...settingsForm.reservationPolicy,
                                            requireDeposit: e.target.checked
                                        }
                                    })}
                                />
                                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {settingsForm.reservationPolicy?.requireDeposit && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        Deposit Type
                                        <HelpTooltip text="Choose between a percentage of the total price or a fixed amount per booking" />
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="depositType"
                                                value="percentage"
                                                checked={settingsForm.reservationPolicy?.depositType === 'percentage'}
                                                onChange={() => setSettingsForm({
                                                    ...settingsForm,
                                                    reservationPolicy: { ...settingsForm.reservationPolicy!, depositType: 'percentage' }
                                                })}
                                                className="mr-2 text-primary"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">Percentage</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="depositType"
                                                value="fixed"
                                                checked={settingsForm.reservationPolicy?.depositType === 'fixed'}
                                                onChange={() => setSettingsForm({
                                                    ...settingsForm,
                                                    reservationPolicy: { ...settingsForm.reservationPolicy!, depositType: 'fixed' }
                                                })}
                                                className="mr-2 text-primary"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">Fixed Amount</span>
                                        </label>
                                    </div>
                                </div>

                                {settingsForm.reservationPolicy?.depositType === 'percentage' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                            Deposit Percentage: <span className="text-primary font-bold ml-1">{settingsForm.reservationPolicy?.depositPercentage ?? 50}%</span>
                                            <HelpTooltip text="Slide to adjust the percentage of total price required for deposit" />
                                        </label>
                                        <input
                                            type="range"
                                            min="10"
                                            max="100"
                                            step="5"
                                            value={settingsForm.reservationPolicy?.depositPercentage ?? 50}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                reservationPolicy: { ...settingsForm.reservationPolicy!, depositPercentage: parseInt(e.target.value) }
                                            })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                            Fixed Deposit Amount (₱)
                                            <HelpTooltip text="The exact amount in Pesos required for every reservation" />
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={settingsForm.reservationPolicy?.fixedDepositAmount ?? 1000}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                reservationPolicy: { ...settingsForm.reservationPolicy!, fixedDepositAmount: parseInt(e.target.value) || 0 }
                                            })}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Email Passcode Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                            <Shield className="mr-2 text-primary" size={20} /> Security & Notifications
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Notification Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={settingsForm.notifications?.adminEmail ?? ''}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        notifications: { ...settingsForm.notifications!, adminEmail: e.target.value }
                                    })}
                                />
                            </div>

                            <div className="pt-4 border-t dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Admin Passcode</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="New 6-digit passcode"
                                        className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg font-mono outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                        value={newPasscode}
                                        onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    />
                                    <button
                                        onClick={async () => {
                                            if (newPasscode.length !== 6) { showToast('6 digits required', 'error'); return; }
                                            await setDoc(doc(db, '_superadmin', 'settings'), { adminPasscode: newPasscode }, { merge: true });
                                            setAdminPasscode(newPasscode);
                                            setNewPasscode('');
                                            showToast('Passcode updated', 'success');
                                        }}
                                        className="px-4 py-2 bg-primary text-white rounded-lg font-bold"
                                    >
                                        Update
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Changes Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleSaveSettings}
                            className="w-full flex items-center justify-center px-6 py-4 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-lg font-bold text-lg"
                        >
                            <Save size={20} className="mr-2" /> Save All Settings
                        </button>
                    </div>
                </div>

            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col md:flex-row relative">
            {/* Sidebar Navigation */}
            <aside className="bg-secondary text-white w-full md:w-64 flex-shrink-0 flex flex-col z-30 shadow-xl">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center md:block">
                    <h1 className="text-xl md:text-2xl font-bold font-serif tracking-wider">Admin Panel</h1>
                    <button onClick={onExit} className="md:hidden p-2 hover:bg-gray-700 rounded" title="Return to Site">
                        <LogOut size={20} />
                    </button>
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
                <div className="p-4 border-t border-gray-700 space-y-3">
                    {onEnterVisualBuilder && (
                        <button
                            onClick={onEnterVisualBuilder}
                            className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-500 bg-[length:200%_auto] animate-gradient-x text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-bold shadow-lg transform hover:-translate-y-0.5"
                        >
                            <Palette size={18} className="mr-2" /> Open Visual Builder
                        </button>
                    )}
                    <button onClick={onExit} className="hidden md:flex items-center text-red-300 hover:text-red-100 transition-colors w-full justify-center pt-2">
                        <LogOut size={20} className="mr-2" /> Return to Site
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-2 sm:p-4 md:p-8 overflow-y-auto h-screen">

                {/* Admin Onboarding Tour */}
                {settings?.setupComplete && (
                    <AdminOnboarding onNavigate={navigateToTab} onEnterVisualBuilder={onEnterVisualBuilder} />
                )}

                {/* Expiry Tracker Banner */}
                {expiryDays !== null && (
                    <div className={`mb-4 rounded-xl p-3 flex items-center justify-between border ${expiryDays <= 0 ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' :
                        expiryDays <= 7 ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' :
                            expiryDays <= 30 ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' :
                                'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                        }`}>
                        <div className="flex items-center">
                            <Clock size={18} className={`mr-2 ${expiryDays <= 0 ? 'text-red-500' : expiryDays <= 7 ? 'text-yellow-500' : expiryDays <= 30 ? 'text-amber-500' : 'text-green-500'
                                }`} />
                            <div>
                                <span className={`text-sm font-bold ${expiryDays <= 0 ? 'text-red-700 dark:text-red-300' : expiryDays <= 7 ? 'text-yellow-700 dark:text-yellow-300' : expiryDays <= 30 ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'
                                    }`}>
                                    {expiryDays <= 0 ? `Website expired ${Math.abs(expiryDays)} days ago` :
                                        `${expiryDays} day${expiryDays !== 1 ? 's' : ''} until expiry`}
                                </span>
                                {expiryDate && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 hidden sm:inline">
                                        (Expires: {new Date(expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                                    </span>
                                )}
                            </div>
                        </div>
                        {expiryDays <= 7 && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${expiryDays <= 0 ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' : 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                                }`}>
                                {expiryDays <= 0 ? 'EXPIRED' : 'RENEW SOON'}
                            </span>
                        )}
                    </div>
                )}

                {/* Mobile-Only: Upcoming Arrivals at very top */}
                <div className="md:hidden mb-4">
                    {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const next30Days = new Date(today);
                        next30Days.setDate(next30Days.getDate() + 30);

                        const upcomingArrivals = processedBookings
                            .filter(b => {
                                if (b.status === 'cancelled') return false;
                                const checkIn = new Date(b.checkIn);
                                checkIn.setHours(0, 0, 0, 0);
                                return checkIn >= today && checkIn <= next30Days;
                            })
                            .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

                        if (upcomingArrivals.length === 0) return (
                            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                                <CalendarIcon size={24} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming arrivals in the next 30 days</p>
                            </div>
                        );

                        return (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-blue-800 dark:text-blue-200 flex items-center text-sm">
                                        <CalendarIcon size={16} className="mr-2" />
                                        📅 Upcoming Arrivals ({upcomingArrivals.length})
                                    </h3>
                                    <span className="text-[10px] text-blue-600 dark:text-blue-300 font-medium bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded-full">Next 30 days</span>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                                    {upcomingArrivals.map(booking => {
                                        const room = rooms.find(r => r.id === booking.roomId);
                                        const checkInDate = new Date(booking.checkIn);
                                        const isToday = isSameDay(checkInDate, new Date());
                                        const isTomorrow = isSameDay(checkInDate, addDays(new Date(), 1));

                                        return (
                                            <button
                                                key={booking.id}
                                                onClick={() => handleEditBookingClick(booking)}
                                                className={`flex-shrink-0 p-2 rounded-lg border-2 text-left transition-all hover:shadow-md ${isToday
                                                    ? 'bg-green-100 dark:bg-green-900/50 border-green-400 dark:border-green-600'
                                                    : isTomorrow
                                                        ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600'
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                                                    }`}
                                                style={{ minWidth: '120px', maxWidth: '140px' }}
                                            >
                                                <div className={`text-[9px] font-bold uppercase mb-1 ${isToday ? 'text-green-700 dark:text-green-300' : isTomorrow ? 'text-yellow-700 dark:text-yellow-300' : 'text-blue-600 dark:text-blue-300'
                                                    }`}>
                                                    {isToday ? '🔔 TODAY' : isTomorrow ? '⏰ Tomorrow' : format(checkInDate, 'EEE, MMM d')}
                                                </div>
                                                <div className="font-bold text-gray-800 dark:text-white text-xs truncate">{booking.guestName}</div>
                                                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{room?.name || 'Room'}</div>
                                                <div className="text-[9px] text-gray-400 mt-0.5 truncate">
                                                    {booking.estimatedArrival || '14:00'} - {booking.estimatedDeparture || '11:00'}
                                                </div>
                                                {booking.status === 'pending' && (
                                                    <div className="mt-1 text-[8px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-1 py-0.5 rounded inline-block">
                                                        PENDING
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {activeTab === 'calendar' && renderCalendarView()}

                {activeTab === 'settings' && (
                    <div className="animate-fade-in-up">
                        {renderSettingsView()}
                    </div>
                )}

                {/* Floating Help Button */}
                <button
                    onClick={() => setShowHelpModal(true)}
                    className="fixed bottom-6 right-6 z-[60] w-12 h-12 bg-primary text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center group"
                    title="Quick Guide"
                >
                    <HelpCircle size={22} />
                    <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                        Quick Guide
                    </span>
                </button>

                {/* Help Modal */}
                {renderHelpModal()}


                {
                    activeTab === 'overview' && (
                        <div className="animate-fade-in space-y-4 sm:space-y-6 md:space-y-8 pb-12">
                            {/* Stats Cards & Charts - Keep existing implementation */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm hidden sm:block">Track performance and manage bookings</p>
                                </div>

                                <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2 xl:space-x-2 w-full md:w-auto">
                                    <div className="flex items-center bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm w-full xl:w-auto overflow-x-auto scrollbar-hide">
                                        {(['1m', '3m', '1y', 'custom'] as const).map((preset) => (
                                            <button
                                                key={preset}
                                                onClick={() => handlePresetChange(preset)}
                                                className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${presetRange === preset ? 'bg-secondary text-white shadow-sm' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                            >
                                                {preset === '1m' ? '1 Month' : preset === '3m' ? '3 Months' : preset === '1y' ? '1 Year' : 'Custom'}
                                            </button>
                                        ))}
                                    </div>

                                    {presetRange === 'custom' && (
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white dark:bg-gray-800 p-2 sm:p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in w-full xl:w-auto">
                                            <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-100 dark:border-gray-600 p-1 flex-1 sm:bg-transparent sm:border-none sm:p-0">
                                                <span className="text-xs text-gray-500 font-bold ml-2 mr-2 uppercase w-10 shrink-0">From</span>
                                                <input
                                                    type="date"
                                                    className="flex-1 px-2 py-1.5 sm:py-1 text-sm bg-white sm:bg-gray-50 dark:bg-gray-800 sm:dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-800 dark:text-white outline-none cursor-pointer w-full"
                                                    value={format(dateRange.start, 'yyyy-MM-dd')}
                                                    onChange={(e) => {
                                                        if (e.target.value) setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }));
                                                    }}
                                                />
                                            </div>
                                            <div className="hidden sm:block text-gray-300 dark:text-gray-600 font-bold">—</div>
                                            <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-100 dark:border-gray-600 p-1 flex-1 sm:bg-transparent sm:border-none sm:p-0">
                                                <span className="text-xs text-gray-500 font-bold ml-2 mr-2 uppercase w-10 shrink-0">To</span>
                                                <input
                                                    type="date"
                                                    className="flex-1 px-2 py-1.5 sm:py-1 text-sm bg-white sm:bg-gray-50 dark:bg-gray-800 sm:dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-800 dark:text-white outline-none cursor-pointer w-full"
                                                    value={format(dateRange.end, 'yyyy-MM-dd')}
                                                    onChange={(e) => {
                                                        if (e.target.value) setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }));
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
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
                                        className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary transition-colors shadow-sm"
                                    >
                                        <Download size={18} className="mr-2" /> Export Report
                                    </button>
                                </div>
                            </div>

                            {/* Stats Cards - Compact on mobile */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                                    <div className="flex justify-between items-start mb-1 sm:mb-3 md:mb-4">
                                        <div className="p-1.5 sm:p-2 md:p-3 bg-teal-50 rounded-lg text-primary">
                                            <CalendarIcon size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Bookings</span>
                                    </div>
                                    <div className="flex items-end space-x-1 sm:space-x-2">
                                        <span className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white leading-none">{rangeBookingsCount}</span>
                                        <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 mb-0.5 sm:mb-1 md:mb-1.5 hidden sm:inline">In Range</span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                                    <div className="flex justify-between items-start mb-1 sm:mb-3 md:mb-4">
                                        <div className="p-1.5 sm:p-2 md:p-3 bg-orange-50 rounded-lg text-accent">
                                            <TrendingUp size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue</span>
                                    </div>
                                    <div className="flex items-end space-x-1 sm:space-x-2">
                                        <span className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white leading-none truncate">₱{rangeRevenue.toLocaleString()}</span>
                                        <span className="text-[9px] sm:text-xs text-green-500 font-bold mb-0.5 sm:mb-1 md:mb-1.5 hidden sm:inline">+12%</span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                                    <div className="flex justify-between items-start mb-1 sm:mb-3 md:mb-4">
                                        <div className="p-1.5 sm:p-2 md:p-3 bg-blue-50 rounded-lg text-secondary">
                                            <BedDouble size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Rooms</span>
                                    </div>
                                    <div className="flex items-end space-x-1 sm:space-x-2">
                                        <span className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white leading-none">{rooms.length}</span>
                                        <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 mb-0.5 sm:mb-1 md:mb-1.5 hidden sm:inline">Active</span>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                                {/* Bar Chart */}
                                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-56 sm:h-72 md:h-96">
                                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 dark:text-white mb-2 sm:mb-4 md:mb-6 flex items-center">
                                        <TrendingUp size={16} className="mr-2 text-primary sm:w-[18px] sm:h-[18px]" />
                                        Revenue Trend
                                    </h3>
                                    <ResponsiveContainer width="100%" height="85%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={(val) => `₱${val / 1000}k`} width={45} />
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
                                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 dark:text-white mb-2 sm:mb-3 md:mb-4 flex items-center">
                                        <TrendingUp size={16} className="mr-2 text-primary sm:w-[18px] sm:h-[18px]" />
                                        Room Distribution
                                    </h3>
                                    <div className={`flex flex-col ${roomPopularity.some(r => r.value > 0) ? 'md:flex-row' : ''} items-center gap-4`}>
                                        {/* Only show pie chart if there's data */}
                                        {roomPopularity.some(r => r.value > 0) && (
                                            <div className="w-full md:w-1/2 h-48">
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
                                        )}
                                        {/* Scrollable List with Indicator */}
                                        <div className={`w-full ${roomPopularity.some(r => r.value > 0) ? 'md:w-1/2' : ''} relative`}>
                                            <div
                                                className="space-y-2 max-h-48 overflow-y-auto pr-2"
                                                style={{ scrollbarWidth: 'thin' }}
                                            >
                                                {roomPopularity.map((entry, index) => (
                                                    <div key={index} className="flex items-center text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
                                                        <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="truncate font-medium text-gray-700 dark:text-gray-200">{entry.name}</div>
                                                            <div className="text-xs text-gray-400">{entry.value} Bookings</div>
                                                        </div>
                                                        <div className="font-bold text-gray-600 dark:text-gray-300 text-xs ml-2">
                                                            {entry.percentage}%
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Spacer at bottom so last item isn't hidden by gradient */}
                                                {roomPopularity.length > 4 && <div className="h-8"></div>}
                                            </div>

                                            {/* Indicator */}
                                            {roomPopularity.length > 4 && (
                                                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white dark:from-gray-800 via-white/80 dark:via-gray-800/80 to-transparent pointer-events-none flex justify-center items-end pb-2">
                                                    <div className="bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-gray-200 dark:border-gray-600 text-[10px] font-medium text-gray-500 dark:text-gray-300 flex items-center animate-pulse">
                                                        Scroll <ChevronDown size={12} className="ml-1" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking List */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {/* Header Area - OPTIMIZED */}
                                <div className="p-3 sm:p-4 md:px-6 md:py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                                        {/* Title */}
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Bookings</h3>

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
                                                        className="block w-full pl-9 pr-8 py-2.5 md:py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none appearance-none cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-all shadow-sm font-medium"
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
                                                onClick={() => setIsAddingBooking(true)}
                                                className="flex items-center justify-center w-full sm:w-auto px-4 py-2.5 md:py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover transition-colors shadow-sm active:scale-95"
                                            >
                                                <Plus size={16} className="mr-1.5" /> Add Booking
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                                        <thead>
                                            <tr className="bg-gray-50/50 dark:bg-gray-700/50">
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
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                                            {filteredBookings.length > 0 ? (
                                                filteredBookings.map((booking) => {
                                                    const roomName = rooms.find(r => r.id === booking.roomId)?.name || 'Unknown Room';
                                                    const isSelected = selectedBookingIds.has(booking.id);
                                                    return (
                                                        <tr key={booking.id} className={`transition-colors ${isSelected ? 'bg-teal-50 dark:bg-teal-900/30' : 'hover:bg-gray-50/80 dark:hover:bg-gray-700/50'}`}>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <button
                                                                    onClick={() => handleSelectOne(booking.id)}
                                                                    className="text-gray-400 hover:text-primary transition-colors"
                                                                >
                                                                    {isSelected ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} />}
                                                                </button>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{booking.guestName}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{roomName}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                <div>
                                                                    {booking.checkIn} <span className="text-gray-300 mx-1">→</span> {booking.checkOut}
                                                                </div>
                                                                {(booking.estimatedArrival || booking.estimatedDeparture) && (
                                                                    <div className="text-xs text-gray-400 flex items-center mt-0.5">
                                                                        <Clock size={10} className="mr-1" />
                                                                        {booking.estimatedArrival || '14:00'} - {booking.estimatedDeparture || '11:00'}
                                                                    </div>
                                                                )}
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
                                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 mr-3 bg-indigo-50 dark:bg-indigo-900/50 p-1.5 rounded-md transition-colors"
                                                                    title="Edit Booking"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteBookingClick(booking.id)}
                                                                    className="text-red-600 dark:text-red-400 hover:text-red-900 bg-red-50 dark:bg-red-900/50 p-1.5 rounded-md transition-colors"
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
                                <div className="lg:hidden p-2 sm:p-4 space-y-2 sm:space-y-4">
                                    {filteredBookings.map((booking) => {
                                        const roomName = rooms.find(r => r.id === booking.roomId)?.name || 'Unknown Room';
                                        return (
                                            <div key={booking.id} className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg shadow-sm p-3 sm:p-4 relative">
                                                <div className="flex justify-between items-start mb-1 sm:mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">{booking.guestName}</h4>
                                                        <p className="text-[10px] sm:text-xs text-gray-500">{roomName}</p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full border ${getStatusColor(booking.status)}`}>
                                                        {booking.status}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-1 sm:gap-2 text-sm text-gray-600 my-2 sm:my-3">
                                                    <div>
                                                        <span className="block text-[10px] sm:text-xs text-gray-400">Dates & Times</span>
                                                        <div className="font-medium text-xs sm:text-sm">{booking.checkIn} - {booking.checkOut}</div>
                                                        <div className="text-[10px] sm:text-xs text-gray-500 flex items-center mt-0.5">
                                                            <Clock size={10} className="mr-1" />
                                                            {booking.estimatedArrival || '14:00'} - {booking.estimatedDeparture || '11:00'}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-[10px] sm:text-xs text-gray-400">Total</span>
                                                        <span className="font-bold text-sm sm:text-base text-primary">₱{booking.totalPrice.toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end border-t border-gray-50 pt-2 sm:pt-3 space-x-2 sm:space-x-3">
                                                    <button
                                                        onClick={() => handleEditBookingClick(booking)}
                                                        className="flex items-center text-[10px] sm:text-xs font-medium text-indigo-600 bg-indigo-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded"
                                                    >
                                                        <Edit size={12} className="mr-1" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBookingClick(booking.id)}
                                                        className="flex items-center text-[10px] sm:text-xs font-medium text-red-600 bg-red-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded"
                                                    >
                                                        <Trash2 size={12} className="mr-1" /> Delete
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
                                        className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
                                    >
                                        <Plus size={18} className="mr-2" /> Add Room
                                    </button>
                                )}
                            </div>

                            {/* Room List */}
                            <div className="grid grid-cols-1 gap-6">
                                {rooms.map(room => (
                                    <div key={room.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all ${editingRoomId === room.id ? 'border-primary ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700 hover:shadow-md'}`}>
                                        <div className="flex flex-col md:flex-row">
                                            {/* Image Thumb */}
                                            <div className="w-full md:w-48 h-48 md:h-auto relative bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden rounded-t-xl md:rounded-l-xl md:rounded-tr-none">
                                                <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2 bg-white dark:bg-black px-2 py-1 rounded-lg text-xs font-bold shadow-md">
                                                    <span className="text-gray-900 dark:text-white">₱{room.price.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{room.name}</h3>
                                                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
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

                                                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4">{room.description}</p>

                                                    <div className="flex flex-wrap gap-2">
                                                        {room.amenities.slice(0, 5).map((am, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-200 border border-gray-100 dark:border-gray-500">
                                                                {renderAmenityIcon(am.icon)}
                                                                <span className="ml-1.5">{am.name}</span>
                                                            </span>
                                                        ))}
                                                        {room.amenities.length > 5 && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-50 dark:bg-gray-600 text-gray-400 dark:text-gray-300">
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
            {/* Modals */}
            < StatsSummaryModal
                isOpen={showStatsModal}
                onClose={() => setShowStatsModal(false)}
                bookings={
                    bookings.filter(b => {
                        // Filter context: "Total Bookings" usually implies the bookings in the current view (month)
                        // or global? The prompt asked for "Summary", let's pass the calendar-filtered bookings to match the count shown
                        // The count shown is `totalBookingsInMonth`.
                        if (b.status === 'cancelled') return false; // Although stats might want to see cancelled?
                        // Let's pass ALL bookings so the modal can decide or pass filtered.
                        // The modal logic (created above) filters itself.
                        // But we want it to match the "Total Bookings" number which *excludes* cancelled in the view...
                        // Wait, the "Total Bookings" count in renderCalendarView *excludes* cancelled.
                        // But the Stats Modal *shows* cancelled.
                        // So we should pass contextual bookings based on the month.
                        return isSameMonth(new Date(b.checkIn), summaryDate);
                    })
                }
                revenue={monthlyRevenue}
            />
            <BookingEditModal
                isOpen={!!editingBooking || isAddingBooking}
                onClose={() => {
                    setEditingBooking(null);
                    setIsAddingBooking(false);
                }}
                booking={editingBooking}
                onSave={handleSaveBooking}
            />

            {/* Add/Edit Room Modal */}
                            {(isAddingRoom || editingRoomId) && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
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
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="lg:col-span-2">
                                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                            Room Name
                                                            <HelpTooltip text="The display name of the unit (e.g. 'Sunset Villa')" />
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={isAddingRoom ? newRoom.name : editForm.name}
                                                            onChange={(e) => isAddingRoom ? setNewRoom({ ...newRoom, name: e.target.value }) : setEditForm({ ...editForm, name: e.target.value })}
                                                            placeholder="e.g. Sunset Villa"
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                            Overnight Price (₱)
                                                            <HelpTooltip text="Base price for a standard one-night stay" />
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={isAddingRoom ? newRoom.price : editForm.price}
                                                            onChange={(e) => isAddingRoom ? setNewRoom({ ...newRoom, price: Number(e.target.value) }) : setEditForm({ ...editForm, price: Number(e.target.value) })}
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                            Day Use Price (₱)
                                                            <HelpTooltip text="Optional price for daytime-only stays. Leave empty or 0 if not supported." />
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={isAddingRoom ? (newRoom.dayUsePrice || '') : (editForm.dayUsePrice || '')}
                                                            onChange={(e) => {
                                                                const val = e.target.value ? Number(e.target.value) : undefined;
                                                                isAddingRoom ? setNewRoom({ ...newRoom, dayUsePrice: val }) : setEditForm({ ...editForm, dayUsePrice: val });
                                                            }}
                                                            placeholder="e.g. 1500"
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                                        />
                                                        <p className="text-[10px] text-gray-400 mt-1 italic">(Optional)</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                            Capacity
                                                            <HelpTooltip text="Maximum number of guests allowed in this unit" />
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={isAddingRoom ? newRoom.capacity : editForm.capacity}
                                                            onChange={(e) => isAddingRoom ? setNewRoom({ ...newRoom, capacity: Number(e.target.value) }) : setEditForm({ ...editForm, capacity: Number(e.target.value) })}
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="lg:col-span-2">
                                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                            Fixed Deposit Amount (₱)
                                                            <HelpTooltip text="Overrides global deposit settings for this room only. Set to 0 to use global defaults." />
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={isAddingRoom ? (newRoom.depositAmount || '') : (editForm.depositAmount || '')}
                                                            onChange={(e) => {
                                                                const val = e.target.value ? Number(e.target.value) : undefined;
                                                                isAddingRoom ? setNewRoom({ ...newRoom, depositAmount: val }) : setEditForm({ ...editForm, depositAmount: val });
                                                            }}
                                                            placeholder="e.g. 2000 (leave empty to use global setting)"
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                        Description
                                                        <HelpTooltip text="Brief highlights of the room features and view" />
                                                    </label>
                                                    <textarea
                                                        value={isAddingRoom ? newRoom.description : editForm.description}
                                                        onChange={(e) => isAddingRoom ? setNewRoom({ ...newRoom, description: e.target.value }) : setEditForm({ ...editForm, description: e.target.value })}
                                                        rows={3}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                        Main Image URL
                                                        <HelpTooltip text="Direct link to the main photo of this unit" />
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={isAddingRoom ? newRoom.image : editForm.image}
                                                        onChange={(e) => isAddingRoom ? setNewRoom({ ...newRoom, image: e.target.value }) : setEditForm({ ...editForm, image: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                                {/* Image Preview */}
                                                {(isAddingRoom ? newRoom.image : editForm.image) && (
                                                    <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden relative">
                                                        <img src={isAddingRoom ? newRoom.image : editForm.image} alt="Preview" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                            

                                            {/* Gallery Images */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                                                <div className="space-y-2">
                                                    {((isAddingRoom ? newRoom.images : editForm.images) || []).map((img, idx) => (
                                                        <div key={idx} className="flex gap-2 items-center group">
                                                            {img && (
                                                                <div 
                                                                    className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 cursor-zoom-in hover:border-primary transition-all relative group/thumb shadow-sm hover:shadow-md"
                                                                    onClick={() => setZoomedImage(img)}
                                                                    title="Click to Zoom"
                                                                >
                                                                    <img 
                                                                        src={img} 
                                                                        alt="" 
                                                                        className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300" 
                                                                        onError={(e) => {
                                                                            (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                                                                        }} 
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <Maximize2 size={14} className="text-white" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="flex-1 relative">
                                                                <input
                                                                    type="text"
                                                                    value={img}
                                                                    onChange={(e) => handleGalleryImageChange(idx, e.target.value, !isAddingRoom)}
                                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                                                    placeholder="Image URL"
                                                                />
                                                            </div>
                                                            <button 
                                                                onClick={() => handleRemoveGalleryImage(idx, !isAddingRoom)} 
                                                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                                title="Remove Image"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
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
                                                className="px-5 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors flex items-center shadow-md"
                                            >
                                                <Save size={18} className="mr-2" /> {isAddingRoom ? 'Create Room' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            
            {/* Expiry Warning Popup */}
            {
                showExpiryWarning && expiryDays !== null && expiryDays <= 7 && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-fade-in border border-gray-200 dark:border-gray-700">
                            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${expiryDays <= 0 ? 'bg-red-100 dark:bg-red-900/40' : 'bg-yellow-100 dark:bg-yellow-900/40'}`}>
                                <AlertTriangle size={32} className={`${expiryDays <= 0 ? 'text-red-500 animate-pulse' : 'text-yellow-500 animate-pulse'}`} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {expiryDays <= 0 ? 'Subscription Expired!' : 'Subscription Expiring Soon!'}
                            </h3>
                            <p className={`text-3xl font-bold mb-1 ${expiryDays <= 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                                {expiryDays <= 0 ? 'Expired' : `${expiryDays} day${expiryDays !== 1 ? 's' : ''} left`}
                            </p>
                            {expiryDate && (
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                                    {expiryDays <= 0 ? 'Expired on' : 'Expires on'}: {new Date(expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                            )}
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-5">
                                {contactInfo.providerName
                                    ? `Please contact ${contactInfo.providerName} to renew your subscription.`
                                    : 'Please contact your service provider to renew your subscription and avoid service interruption.'}
                            </p>
                            {(contactInfo.email || contactInfo.phone) && (
                                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-3 mb-5 space-y-2">
                                    {contactInfo.email && (
                                        <a href={`mailto:${contactInfo.email}`} className="flex items-center justify-center gap-2 text-blue-500 hover:text-blue-600 text-sm font-medium">
                                            <Clock size={14} /> {contactInfo.email}
                                        </a>
                                    )}
                                    {contactInfo.phone && (
                                        <a href={`tel:${contactInfo.phone}`} className="flex items-center justify-center gap-2 text-green-500 hover:text-green-600 text-sm font-medium">
                                            <Phone size={14} /> {contactInfo.phone}
                                        </a>
                                    )}
                                </div>
                            )}
                            <button
                                onClick={() => setShowExpiryWarning(false)}
                                className="w-full py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Missing Passcode Warning Modal */}
            {
                showMissingPasscodeWarning && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-fade-in border border-gray-200 dark:border-gray-700">
                            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-4">
                                <Lock className="text-red-500" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Admin Panel is Unprotected
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                                You haven't set an admin passcode, so anyone visiting this page can access the admin panel.
                                Would you like to secure it with a passcode now?
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        setShowMissingPasscodeWarning(false);
                                        setActiveTab('settings');
                                        // Give it a tiny delay to switch to settings tab before scrolling
                                        setTimeout(() => {
                                            const passcodeSection = document.getElementById('admin-passcode-section');
                                            if (passcodeSection) passcodeSection.scrollIntoView({ behavior: 'smooth' });
                                        }, 100);
                                    }}
                                    className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-md flex items-center justify-center gap-2"
                                >
                                    <Lock size={18} /> Add Password Now
                                </button>
                                <button
                                    onClick={() => {
                                        sessionStorage.setItem('dismissedPasscodeWarning', 'true');
                                        setShowMissingPasscodeWarning(false);
                                    }}
                                    className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Later
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Export Configuration Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold dark:text-white flex items-center">
                                <Download className="mr-2 text-primary" size={24} /> Export Report
                            </h3>
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-gray-100 dark:bg-gray-700 p-2 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Report Title
                                </label>
                                <input
                                    type="text"
                                    value={exportConfig.title}
                                    onChange={(e) => setExportConfig({ ...exportConfig, title: e.target.value })}
                                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-4 py-2 bg-gray-50 dark:bg-gray-800"
                                    placeholder="e.g. Monthly Report - January"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Override Revenue (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={exportConfig.overrideRevenue || ''}
                                        onChange={(e) => setExportConfig({ ...exportConfig, overrideRevenue: e.target.value })}
                                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-4 py-2 bg-gray-50 dark:bg-gray-800"
                                        placeholder={`Default: PHP ${totalRevenue.toLocaleString()}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Override Bookings (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={exportConfig.overrideBookings || ''}
                                        onChange={(e) => setExportConfig({ ...exportConfig, overrideBookings: e.target.value })}
                                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-4 py-2 bg-gray-50 dark:bg-gray-800"
                                        placeholder={`Default: ${bookings.length}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Format
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setExportConfig({ ...exportConfig, format: 'doc' })}
                                        className={`py-2 px-3 border rounded-lg text-sm font-medium transition-colors ${exportConfig.format === 'doc'
                                                ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        .DOC (Text)
                                    </button>
                                    <button
                                        onClick={() => setExportConfig({ ...exportConfig, format: 'csv' })}
                                        className={`py-2 px-3 border rounded-lg text-sm font-medium transition-colors ${exportConfig.format === 'csv'
                                                ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-400 dark:text-green-300'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        .CSV (Excel)
                                    </button>
                                    <button
                                        onClick={() => setExportConfig({ ...exportConfig, format: 'txt' })}
                                        className={`py-2 px-3 border rounded-lg text-sm font-medium transition-colors ${exportConfig.format === 'txt'
                                                ? 'bg-gray-100 border-gray-500 text-gray-700 dark:bg-gray-600 dark:border-gray-400 dark:text-gray-200'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        .TXT
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Additional Notes
                                </label>
                                <textarea
                                    value={exportConfig.notes}
                                    onChange={(e) => setExportConfig({ ...exportConfig, notes: e.target.value })}
                                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-4 py-2 bg-gray-50 dark:bg-gray-800 min-h-[80px]"
                                    placeholder="Add any context or explanations for these numbers..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={processExport}
                                    className="px-6 py-2 text-sm font-bold text-white bg-primary border border-transparent rounded-lg shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                >
                                    Download Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Zoomed Image Overlay */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4"
                    onClick={() => setZoomedImage(null)}
                >
                    <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center animate-pop" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setZoomedImage(null)}
                            className="absolute -top-12 right-0 p-2 text-white hover:text-red-400 transition-colors bg-white/10 hover:bg-white/20 rounded-full z-10"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={zoomedImage}
                            alt="Zoomed Preview"
                            className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl bg-white/5 p-1"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;