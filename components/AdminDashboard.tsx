import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Booking, Room, Amenity, Settings, BookingFilter } from '../types';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { format, isValid, differenceInDays, addDays, addMonths, subMonths, isAfter, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import {
    LayoutDashboard, BedDouble, LogOut, Edit, Save, X, Trash2, Download, TrendingUp, Calendar, Calendar as CalendarIcon, Plus, Image as ImageIcon,
    Wifi, Wind, Coffee, Car, Dumbbell, Tv, ChefHat, Waves, Shield, Sparkles,
    Utensils, Monitor, Zap, Sun, Moon, Umbrella, Music, Briefcase, Key, Bell, Bath, Armchair, Bike, ChevronDown, PlusCircle, MinusCircle,
    FileText, FileSpreadsheet, File, Filter, CheckSquare, Square, Phone, Users, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, XCircle, Clock, Settings as SettingsIcon, Palette, Globe, Loader, Maximize2, Minimize2, CreditCard, Database, Copy, RefreshCw, ExternalLink, Lock, AlertTriangle, Eye, EyeOff, HelpCircle, Rocket, MessageCircle, Award, Share2, Info
} from 'lucide-react';

import { useLocation } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import StatsSummaryModal from './Admin/StatsSummaryModal';
import BookingEditModal from './Admin/BookingEditModal';
import { sendUserConfirmationEmail } from '../services/emailService';
import AdminOnboarding from './Admin/AdminOnboarding';
import RenewalModal from './Admin/RenewalModal';


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
    onFetchFilteredBookings?: (filter: BookingFilter) => Promise<Booking[]>;
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

const HelpTooltip: React.FC<{ text: string, align?: 'center' | 'right' }> = ({ text, align = 'center' }) => (
    <div className="group relative inline-block ml-1.5 cursor-help align-middle">
        <HelpCircle size={13} className="text-gray-400 hover:text-primary transition-colors" />
        <div className={`invisible group-hover:visible absolute z-[9999] bottom-full mb-2 w-48 p-2 bg-gray-900/95 backdrop-blur-md text-white text-[10px] leading-relaxed rounded-lg shadow-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none text-center font-medium ${align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0'
            }`}>
            {text}
            <div className={`absolute top-full -mt-1 border-4 border-transparent border-t-gray-900/95 ${align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-2'
                }`}></div>
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
    onFetchFilteredBookings,
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
    const [draftDepositPct, setDraftDepositPct] = useState<number | null>(null);
    const [isGlobalDepositExpanded, setIsGlobalDepositExpanded] = useState(false);

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
    const { isDark, toggleTheme } = useTheme();
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
                    setNewPasscode(snap.data().adminPasscode);
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

            // UX Fix: Also save the passcode if they changed it but forgot to click the specific save button
            if (newPasscode !== adminPasscode && newPasscode.length === 6) {
                await setDoc(doc(db, '_superadmin', 'settings'), { adminPasscode: newPasscode }, { merge: true });
                setAdminPasscode(newPasscode);
            }

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

    // Server-side filtered bookings for the Bookings Table
    const [tableBookings, setTableBookings] = useState<Booking[]>([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);

    // Fetch bookings from Firebase when the filter or onFetchFilteredBookings changes
    useEffect(() => {
        if (!onFetchFilteredBookings) return;
        setIsLoadingBookings(true);
        setSelectedBookingIds(new Set());
        onFetchFilteredBookings(bookingFilter)
            .then(fetched => {
                setTableBookings(fetched);
                setIsLoadingBookings(false);
            })
            .catch(() => setIsLoadingBookings(false));
    }, [bookingFilter, onFetchFilteredBookings]);

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


    // Notification Panel State
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const notificationPanelRef = useRef<HTMLDivElement>(null);

    // Close notification panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
                setShowNotificationPanel(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            // Overview shows confirmed and cancelled bookings (pending are in the Awaiting Approval section)
            if (b.status === 'pending') return false;

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

    // filteredBookings now uses the server-fetched tableBookings (already date-filtered by Firebase)
    // We only apply a local status filter (exclude pending, which are in the Awaiting Approval section)
    const filteredBookings = (tableBookings.length > 0 || isLoadingBookings
        ? tableBookings
        : processedBookings
    )
        .filter(b => b.status !== 'pending')
        .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());

    const pendingBookings = processedBookings.filter(b => b.status === 'pending').sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

    // Overdue bookings: raw bookings that are still pending but check-in date has passed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueBookings = bookings.filter(b => {
        if (b.status !== 'pending') return false;
        const checkIn = new Date(b.checkIn);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn < today;
    });

    const awaitingPaymentBookings = bookings
        .filter(b => b.status === 'confirmed' && b.depositPaid && !b.balancePaid)
        .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

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
            // Toast is handled centrally in App.tsx -> handleUpdateBooking
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
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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

                            // Parse dates properly using local timezone (handling ISO strings from front-end)
                            const [startY, startM, startD] = b.checkIn.split('T')[0].split('-').map(Number);
                            const [endY, endM, endD] = b.checkOut.split('T')[0].split('-').map(Number);
                            const start = new Date(startY, startM - 1, startD, 0, 0, 0, 0);
                            const end = new Date(endY, endM - 1, endD, 0, 0, 0, 0);

                            // Normalize comparing date as well
                            const currentDay = new Date(date);
                            currentDay.setHours(0, 0, 0, 0);

                            // Include both check-in AND check-out day in the display
                            return currentDay >= start && currentDay <= end;
                        });

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isPast = date < today;
                        const isToday = isSameDay(date, today);

                        // Prevent popup cropping on edges
                        const dayOfWeek = idx % 7;
                        const popupPositionClass = dayOfWeek === 0 ? 'left-0 origin-top-left' : dayOfWeek === 6 ? 'right-0 origin-top-right' : 'left-1/2 -translate-x-1/2 origin-top';

                        return (
                            <div key={idx} className={`min-h-[60px] md:min-h-[100px] p-1 md:p-2 relative group transition-colors 
                                ${!isCurrentMonth
                                    ? 'bg-gray-50/50 dark:bg-gray-900/40 text-gray-300 dark:text-gray-600'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-white'} 
                                ${isPast && isCurrentMonth ? 'bg-gray-50/80 dark:bg-gray-800/50 text-gray-400' : ''} 
                                ${isCurrentMonth && !isPast ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}>
                                <div className={`text-xs md:text-sm font-medium mb-0.5 md:mb-1 ${isToday ? 'bg-primary text-white w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-sm shadow-sm' : ''}`}>
                                    {date.getDate()}
                                </div>

                                <div className="space-y-0.5 md:space-y-1 mt-1">
                                    {dayBookings.slice(0, 2).map(booking => {
                                        const roomIndex = rooms.findIndex(r => r.id === booking.roomId);
                                        const roomColors = ['bg-purple-500 border-purple-600', 'bg-orange-500 border-orange-600', 'bg-teal-500 border-teal-600', 'bg-rose-500 border-rose-600', 'bg-emerald-500 border-emerald-600', 'bg-indigo-500 border-indigo-600'];
                                        const baseColorClass = roomIndex !== -1 ? roomColors[roomIndex % roomColors.length] : 'bg-slate-500 border-slate-600';
                                        const isPending = booking.status === 'pending';
                                        const roomName = roomIndex !== -1 ? rooms[roomIndex].name : 'Unknown Room';
                                        const isOnlyBooking = dayBookings.length === 1;

                                        return (
                                            <button
                                                key={booking.id}
                                                onClick={(e) => { e.stopPropagation(); handleEditBookingClick(booking); }}
                                                className={`w-full text-left rounded border font-medium hover:opacity-100 transition-opacity overflow-hidden text-white shadow-sm ${baseColorClass} ${isPast ? 'opacity-60 saturate-50' : ''} ${isOnlyBooking ? 'text-[9px] md:text-[11px] px-1 py-1.5 md:px-1.5 md:py-2' : 'text-[8px] md:text-[10px] px-0.5 py-0.5 md:px-1 md:py-1 truncate leading-none'}`}
                                                title={`Room: ${roomName}\nGuest: ${booking.guestName} (${booking.guests} guests)\nTime: ${booking.estimatedArrival || '14:00'} - ${booking.estimatedDeparture || '11:00'}\nStatus: ${booking.status.toUpperCase()}`}
                                            >
                                                <div className={`flex items-center gap-[2px] w-full overflow-hidden ${isOnlyBooking ? 'mb-0.5' : ''}`}>
                                                    {isPending ? <Clock size={isOnlyBooking ? 11 : 9} className="shrink-0 text-yellow-300" strokeWidth={3} /> : <CheckCircle size={isOnlyBooking ? 11 : 9} className="shrink-0 text-green-200" strokeWidth={3} />}
                                                    <span className={`truncate flex-1 font-bold ${isOnlyBooking ? 'tracking-normal' : 'tracking-tight'}`}>{booking.guestName}</span>
                                                </div>
                                                {isOnlyBooking && (
                                                    <div className="text-[8px] font-normal opacity-90 truncate hidden sm:block leading-none pl-[14px]">
                                                        {roomName}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                    {dayBookings.length > 2 && (
                                        <details className="mt-1 relative z-20 group/overflow" onClick={(e) => e.stopPropagation()}>
                                            <summary className={`list-none [&::-webkit-details-marker]:hidden cursor-pointer text-[10px] sm:text-xs text-primary bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-center py-[2px] rounded font-bold transition-colors border border-blue-100 dark:border-blue-800 shadow-sm mx-1 outline-none ${isPast ? 'opacity-75' : ''}`}>
                                                +{dayBookings.length - 2} more
                                            </summary>
                                            <div className={`absolute top-full ${popupPositionClass} mt-1 w-[130px] md:w-[180px] z-50 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded p-1 space-y-1 animate-fade-in`}>
                                                {dayBookings.slice(2).map(booking => {
                                                    const roomIndex = rooms.findIndex(r => r.id === booking.roomId);
                                                    const roomColors = ['bg-purple-500 border-purple-600', 'bg-orange-500 border-orange-600', 'bg-teal-500 border-teal-600', 'bg-rose-500 border-rose-600', 'bg-emerald-500 border-emerald-600', 'bg-indigo-500 border-indigo-600'];
                                                    const baseColorClass = roomIndex !== -1 ? roomColors[roomIndex % roomColors.length] : 'bg-slate-500 border-slate-600';
                                                    const isPending = booking.status === 'pending';
                                                    const roomName = roomIndex !== -1 ? rooms[roomIndex].name : 'Unknown Room';

                                                    return (
                                                        <button
                                                            key={'overflow-' + booking.id}
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditBookingClick(booking); }}
                                                            className={`w-full text-left text-[8px] md:text-[10px] px-0.5 py-0.5 md:px-1 md:py-1 rounded border font-medium hover:opacity-100 transition-opacity truncate leading-none text-white shadow-sm ${baseColorClass} ${isPast ? 'opacity-70 saturate-50' : ''}`}
                                                            title={`Room: ${roomName}\nGuest: ${booking.guestName} (${booking.guests} guests)\nStatus: ${booking.status.toUpperCase()}`}
                                                        >
                                                            <div className="flex items-center gap-[2px] w-full overflow-hidden">
                                                                {isPending ? <Clock size={9} className="shrink-0 text-yellow-300" strokeWidth={3} /> : <CheckCircle size={9} className="shrink-0 text-green-200" strokeWidth={3} />}
                                                                <span className="truncate flex-1 font-medium tracking-tight">{booking.guestName}</span>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </details>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Calendar Legend */}
                <div className="mt-4 flex flex-col md:flex-row gap-3 md:gap-4 justify-between items-start md:items-center text-xs md:text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
                        <span className="font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 text-[10px] mr-1">Room Colors:</span>
                        {rooms.map((room, idx) => {
                            const roomColors = ['bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-rose-500', 'bg-emerald-500', 'bg-indigo-500'];
                            const color = roomColors[idx % roomColors.length];
                            return (
                                <div key={room.id} className="flex items-center gap-1.5 whitespace-nowrap">
                                    <div className={`w-3 h-3 rounded-full shadow-sm ${color}`}></div>
                                    <span className="truncate font-medium">{room.name}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto pt-3 md:pt-0 border-t border-gray-100 dark:border-gray-700 md:border-t-0 md:border-l md:pl-4 shrink-0 mt-1 md:mt-0">
                        <div className="flex items-center gap-1.5 font-medium">
                            <Clock size={14} className="text-yellow-500" strokeWidth={2.5} />
                            <span>Pending</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                            <CheckCircle size={14} className="text-green-500" strokeWidth={2.5} />
                            <span>Confirmed</span>
                        </div>
                    </div>
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
                            const next30Days = new Date(today);
                            next30Days.setDate(next30Days.getDate() + 30);

                            const upcomingArrivals = bookings
                                .filter(b => {
                                    if (b.status !== 'pending') return false; // ONLY show action-required pending bookings
                                    const checkIn = new Date(b.checkIn);
                                    checkIn.setHours(0, 0, 0, 0);
                                    return checkIn >= today && checkIn <= next30Days;
                                })
                                .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

                            if (upcomingArrivals.length === 0) return null;

                            return (
                                <div className="hidden md:block bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 md:p-4 mb-4 flex-shrink-0">
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

                        {/* Pending Actions List */}
                        {pendingBookings.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-900/50 overflow-hidden">
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
                                                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
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

                        {/* Awaiting Balance Actions List */}
                        {(() => {
                            if (awaitingPaymentBookings.length === 0) return null;

                            return (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-200 dark:border-orange-900/50 overflow-hidden">
                                    <div className="bg-orange-50 dark:bg-orange-900/20 px-5 py-4 border-b border-orange-100 dark:border-orange-900/30">
                                        <h3 className="text-orange-800 dark:text-orange-200 font-bold flex items-center">
                                            ⏳ Awaiting Balance ({awaitingPaymentBookings.length})
                                        </h3>
                                    </div>
                                    <div className="overflow-y-auto max-h-[300px] md:max-h-[500px] p-2 space-y-2">
                                        {awaitingPaymentBookings.map(b => (
                                            <div
                                                key={b.id}
                                                className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow-sm border border-orange-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer relative group"
                                                onClick={() => setEditingBooking(b)}
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
                                                    </div>
                                                    <div className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 text-[10px] uppercase font-bold px-2 py-1 rounded">
                                                        Deposit Paid
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 relative z-10">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingBooking(b); }}
                                                        className="flex-1 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center justify-center border border-emerald-200"
                                                    >
                                                        Review Payment
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
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
            <div className="animate-fade-in max-w-4xl mx-auto pb-12 px-4 sm:px-6 md:px-0 w-full overflow-x-hidden overflow-y-visible">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                        <SettingsIcon className="mr-3 text-primary" size={28} />
                        Site Settings
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Customize your white-label application</p>
                </div>

                <div className="space-y-6 text-left px-2 sm:px-0">
                    {/* Brand Settings */}
                    <div id="settings-brand" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b dark:border-gray-700 pb-2 mb-4 gap-3">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                                <Globe size={20} className="mr-2 text-primary" /> Brand Identity
                            </h3>
                            <button
                                onClick={() => onUpdateSettings(settingsForm)}
                                className="w-full sm:w-auto px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
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
                        </div>
                    </div>

                    {/* Hero & Features Note */}
                    <div className="hidden md:flex bg-blue-50 dark:bg-blue-900/30 p-6 rounded-xl border border-blue-200 dark:border-blue-800 flex-col md:flex-row items-start md:items-center">
                        <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full md:mr-4 text-blue-600 dark:text-blue-300">
                            <Edit size={24} className="md:w-6 md:h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-1">Visual Builder Enabled</h3>
                            <p className="text-blue-600 dark:text-blue-300 mb-3">
                                The <strong>Hero Section</strong>, <strong>Features</strong>, and <strong>Why Choose Us</strong> content can now be edited directly on the Home Page using the visual editor.
                            </p>
                            {onEnterVisualBuilder && (
                                <button
                                    onClick={onEnterVisualBuilder}
                                    className="md:w-auto justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm flex items-center"
                                >
                                    <Palette size={16} className="mr-2" /> Launch Visual Editor
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Map Configuration */}
                    <div id="settings-map" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
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
                    <div id="settings-payment" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
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

                    {/* Booking Control Mode */}
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4 border-b dark:border-gray-700 pb-2">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center text-sm md:text-lg">
                                <Key className="mr-2 text-primary" size={20} /> Calendar Blocking Mode
                            </h3>
                            <HelpTooltip text="Choose how strictly the calendar blocks dates for new guests." align="right" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const updatedPolicy = settingsForm?.reservationPolicy
                                            ? { ...settingsForm.reservationPolicy, bookingSystemType: 'strict' as const }
                                            : {
                                                requireDeposit: true,
                                                depositType: 'percentage' as const,
                                                depositPercentage: 50,
                                                fixedDepositAmount: 1000,
                                                autoConfirmOnDeposit: false,
                                                cancellationPolicy: '',
                                                paymentDeadlineHours: 24,
                                                bookingSystemType: 'strict' as const
                                            };
                                        const newSettings = { ...settingsForm!, reservationPolicy: updatedPolicy };
                                        setSettingsForm(newSettings);

                                        // Auto-save setting
                                        if (onUpdateSettings) {
                                            await onUpdateSettings(newSettings);
                                            showToast("Mode set to Strict (Auto-saved)", "success");
                                        }
                                    }}
                                    className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${(settingsForm.reservationPolicy?.bookingSystemType ?? 'strict') === 'strict'
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex items-center mb-1">
                                        <div className={`w-4 min-w-[1rem] h-4 rounded-full border-2 mr-2 flex items-center justify-center ${(settingsForm.reservationPolicy?.bookingSystemType ?? 'strict') === 'strict'
                                            ? 'border-primary' : 'border-gray-300'
                                            }`}>
                                            {(settingsForm.reservationPolicy?.bookingSystemType ?? 'strict') === 'strict' && (
                                                <div className="w-2 h-2 bg-primary rounded-full" />
                                            )}
                                        </div>
                                        <span className="font-bold text-gray-800 dark:text-white text-sm">Strict Mode</span>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Blocks dates immediately when a guest submits a request. Safest against double-booking.</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={async () => {
                                        const updatedPolicy = settingsForm?.reservationPolicy
                                            ? { ...settingsForm.reservationPolicy, bookingSystemType: 'smart' as const }
                                            : {
                                                requireDeposit: true,
                                                depositType: 'percentage' as const,
                                                depositPercentage: 50,
                                                fixedDepositAmount: 1000,
                                                autoConfirmOnDeposit: false,
                                                cancellationPolicy: '',
                                                paymentDeadlineHours: 24,
                                                bookingSystemType: 'smart' as const
                                            };
                                        const newSettings = { ...settingsForm!, reservationPolicy: updatedPolicy };
                                        setSettingsForm(newSettings);

                                        // Auto-save setting
                                        if (onUpdateSettings) {
                                            await onUpdateSettings(newSettings);
                                            showToast("Mode set to Smart (Auto-saved)", "success");
                                        }
                                    }}
                                    className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${settingsForm.reservationPolicy?.bookingSystemType === 'smart'
                                        ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500'
                                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex items-center mb-1">
                                        <div className={`w-4 min-w-[1rem] h-4 rounded-full border-2 mr-2 flex items-center justify-center ${settingsForm.reservationPolicy?.bookingSystemType === 'smart'
                                            ? 'border-amber-500' : 'border-gray-300'
                                            }`}>
                                            {settingsForm.reservationPolicy?.bookingSystemType === 'smart' && (
                                                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                            )}
                                        </div>
                                        <span className="font-bold text-gray-800 dark:text-white text-sm">Smart Mode (Troll Protection)</span>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Only blocks dates after you manually confirm. Prevents malicious users from locking up your days.</p>
                                </button>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-4 rounded-xl flex gap-3">
                                <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                                <div className="text-[11px] md:text-xs text-blue-700 dark:text-blue-300">
                                    <p className="font-bold mb-1 italic">Why this matters:</p>
                                    <p className="leading-relaxed">
                                        In <strong>Strict Mode</strong>, if a troll fills out your form, that date becomes unavailable to everyone else. In <strong>Smart Mode</strong>, the date stays open until you accept a real booking. Don&apos;t worry—if two people try to book the same day in Smart Mode, the website will show them a warning first!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Email Passcode Section */}
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center border-b dark:border-gray-700 pb-2">
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
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Admin Passcode {!adminPasscode && <span className="text-red-500 text-xs ml-2 font-bold">(Currently Unprotected)</span>}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        placeholder={adminPasscode ? "Update 6-digit passcode" : "Set a 6-digit passcode"}
                                        className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg font-mono outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                        value={newPasscode}
                                        onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    />
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                if (newPasscode.length !== 6) { showToast('6 digits required', 'error'); return; }
                                                await setDoc(doc(db, '_superadmin', 'settings'), { adminPasscode: newPasscode }, { merge: true });
                                                setAdminPasscode(newPasscode);
                                                showToast('Passcode updated', 'success');
                                            }}
                                            className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-dark transition-all flex-1 sm:flex-none"
                                        >
                                            {adminPasscode ? 'Update Passcode' : 'Set Passcode'}
                                        </button>

                                        {adminPasscode && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    showConfirm({
                                                        title: "Remove Passcode",
                                                        message: "Are you sure you want to remove the admin passcode? This will leave your Admin Panel accessible to anyone without protection.",
                                                        isDangerous: true,
                                                        confirmLabel: "Remove Passcode",
                                                        onConfirm: async () => {
                                                            await setDoc(doc(db, '_superadmin', 'settings'), { adminPasscode: '' }, { merge: true });
                                                            setAdminPasscode('');
                                                            setNewPasscode('');
                                                            showToast('Passcode removed', 'success');
                                                        }
                                                    });
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-2 text-red-500 hover:text-red-600 font-semibold transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-sm"
                                            >
                                                <Trash2 size={14} />
                                                Remove
                                            </button>
                                        )}
                                    </div>
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
            {/* Sidebar Navigation (Desktop) / Mobile Top Header */}
            <aside className="bg-secondary text-white w-full md:w-64 flex-shrink-0 flex flex-col z-30 shadow-xl md:h-screen sticky top-0">
                {/* Header Row */}
                <div className="p-4 md:p-6 border-b border-gray-700 flex justify-between items-center md:block">
                    <div className="flex items-center">
                        <h1 className="text-lg md:text-2xl font-bold font-serif tracking-wider">Admin Panel</h1>
                    </div>
                    <div className="flex items-center space-x-2 md:mt-4 md:justify-between">
                        {/* 🔔 Unified Notification Icon */}
                        <div className="relative" ref={notificationPanelRef}>
                            <button
                                onClick={() => setShowNotificationPanel(prev => !prev)}
                                className={`relative p-2 rounded-xl transition-colors group flex items-center justify-center ${(expiryDays !== null && expiryDays <= 0) || overdueBookings.length > 0
                                    ? 'text-gray-800 dark:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
                                    : expiryDays !== null && expiryDays <= 7
                                        ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'
                                    }`}
                                title="Notifications"
                            >
                                <Bell size={22} className={(expiryDays !== null && expiryDays <= 0) || overdueBookings.length > 0 ? '' : ''} />
                                {/* Facebook-style notification badge */}
                                {(() => {
                                    const count = overdueBookings.length + ((expiryDays !== null && expiryDays <= 7) ? 1 : 0) + awaitingPaymentBookings.length;
                                    return count > 0 ? (
                                        <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-white dark:border-gray-900 z-10">
                                            {count > 9 ? '9+' : count}
                                        </div>
                                    ) : null;
                                })()}
                            </button>

                            {/* 🔔 Notification Center — Matching RenewalModal Style */}
                            {showNotificationPanel && (
                                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                                    {/* Backdrop click to close */}
                                    <div className="absolute inset-0" onClick={() => setShowNotificationPanel(false)} />

                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md md:max-w-lg w-full border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[92vh] flex flex-col relative z-10">

                                        {/* ─── Header ─── */}
                                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0 bg-transparent">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/40">
                                                    <Bell size={20} className="text-blue-500" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                                                        Notifications
                                                    </h3>
                                                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                        {overdueBookings.length + ((expiryDays !== null && expiryDays <= 7) ? 1 : 0) + awaitingPaymentBookings.length === 0
                                                            ? 'No new alerts'
                                                            : `${overdueBookings.length + ((expiryDays !== null && expiryDays <= 7) ? 1 : 0) + awaitingPaymentBookings.length} items pending`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => setShowNotificationPanel(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-gray-700 transition-colors">
                                                <X size={18} />
                                            </button>
                                        </div>

                                        {/* ─── Scrollable Body ─── */}
                                        <div className="p-5 overflow-y-auto flex-1 space-y-4">

                                            {/* License Info block */}
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">License & Renewal</p>
                                                <button
                                                    onClick={() => { setShowExpiryWarning(true); setShowNotificationPanel(false); }}
                                                    className={`group w-full relative rounded-xl p-3.5 flex items-center justify-between transition-all border shadow-sm hover:shadow-md active:scale-[0.98] ${expiryDays !== null && expiryDays <= 0
                                                        ? 'bg-red-50 border-red-200 hover:bg-red-100/50 dark:bg-red-900/10 dark:border-red-500/20 dark:hover:bg-red-900/20'
                                                        : expiryDays !== null && expiryDays <= 7
                                                            ? 'bg-amber-50 border-amber-200 hover:bg-amber-100/50 dark:bg-amber-900/10 dark:border-amber-500/20 dark:hover:bg-amber-900/20'
                                                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${expiryDays !== null && expiryDays <= 0 ? 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400' :
                                                            expiryDays !== null && expiryDays <= 7 ? 'bg-amber-100 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                'bg-green-100 text-green-500 dark:bg-green-900/30 dark:text-green-400'
                                                            }`}>
                                                            {expiryDays !== null && expiryDays <= 7 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                                                        </div>
                                                        <div className="text-left flex-1">
                                                            <span className="block font-bold text-sm text-gray-900 dark:text-white">
                                                                {expiryDays === null ? 'View Details'
                                                                    : expiryDays <= 0 ? 'Subscription Expired'
                                                                        : expiryDays <= 7 ? 'Expiring Soon'
                                                                            : 'Active Subscription'}
                                                            </span>
                                                            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                                                                {expiryDays !== null && expiryDays > 7
                                                                    ? `${expiryDays} days remaining${expiryDate ? ' · Expires ' + expiryDate : ''}`
                                                                    : 'Tap to view details & renew'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 pl-4">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors ${expiryDays !== null && expiryDays <= 7
                                                            ? 'bg-amber-500 text-white'
                                                            : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                                                            }`}>
                                                            {expiryDays !== null && expiryDays <= 7 ? 'Renew Now' : 'Manage'}
                                                        </span>
                                                        <ChevronRight size={14} className={`transition-transform group-hover:translate-x-0.5 ${expiryDays !== null && expiryDays <= 7 ? 'text-amber-500' : 'text-gray-400'
                                                            }`} />
                                                    </div>
                                                </button>
                                            </div>

                                            {/* Overdue Bookings Block */}
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    Overdue Check-ins
                                                    {overdueBookings.length > 0 && (
                                                        <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded text-[10px] break-keep">{overdueBookings.length} pending</span>
                                                    )}
                                                </p>

                                                {overdueBookings.length === 0 ? (
                                                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20 rounded-xl p-4 text-center">
                                                        <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
                                                        <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-1">All Good!</p>
                                                        <p className="text-xs text-green-600 dark:text-green-500">No overdue bookings found.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {overdueBookings.map(b => {
                                                            const room = rooms.find(r => r.id === b.roomId);
                                                            return (
                                                                <div key={b.id} className="p-3 rounded-xl border bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-500/20">
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                                            Overdue
                                                                        </span>
                                                                        <button
                                                                            onClick={() => { handleEditBookingClick(b); setShowNotificationPanel(false); }}
                                                                            className="text-xs font-bold text-primary hover:underline"
                                                                        >
                                                                            Update Status
                                                                        </button>
                                                                    </div>
                                                                    <div className="mt-2">
                                                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{b.guestName}</p>
                                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                                            {room?.name || 'Unknown Room'} · {format(new Date(b.checkIn), 'MMM d')} – {format(new Date(b.checkOut), 'MMM d')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Awaiting Balance Block */}
                                            {awaitingPaymentBookings.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        Awaiting Balance
                                                        <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded text-[10px] break-keep">{awaitingPaymentBookings.length} pending</span>
                                                    </p>
                                                    <div className="space-y-2">
                                                        {awaitingPaymentBookings.map(b => {
                                                            const room = rooms.find(r => r.id === b.roomId);
                                                            return (
                                                                <div key={b.id} className="p-3 rounded-xl border bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-500/20">
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                                                            Deposit Paid
                                                                        </span>
                                                                        <button
                                                                            onClick={() => { handleEditBookingClick(b); setShowNotificationPanel(false); }}
                                                                            className="text-xs font-bold text-primary hover:underline"
                                                                        >
                                                                            Update Status
                                                                        </button>
                                                                    </div>
                                                                    <div className="mt-2">
                                                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{b.guestName}</p>
                                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                                            {room?.name || 'Unknown Room'} · Balance: ₱{b.balanceAmount?.toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="md:hidden p-2 hover:bg-gray-700 rounded transition-all text-gray-300 hover:text-white flex items-center justify-center group"
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDark ? (
                                <Sun size={20} className="group-hover:rotate-12 transition-transform" />
                            ) : (
                                <Moon size={20} className="group-hover:-rotate-12 transition-transform" />
                            )}
                        </button>
                        <button onClick={onExit} className="md:hidden p-2 text-red-400 hover:bg-gray-700 rounded transition-all flex items-center justify-center" title="Exit Admin">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                {/* Sidebar Menu - Desktop Only */}
                <nav className="hidden md:flex flex-1 p-4 flex-col space-y-2">
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'calendar' ? 'bg-primary text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                    >
                        <CalendarIcon size={20} className="mr-3" /> Calendar
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

                <div className="hidden md:flex flex-col p-4 border-t border-gray-700 space-y-3">
                    {onEnterVisualBuilder && (
                        <button
                            onClick={onEnterVisualBuilder}
                            className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-500 bg-[length:200%_auto] animate-gradient-x text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-bold shadow-lg transform hover:-translate-y-0.5"
                        >
                            <Palette size={18} className="mr-2" /> Open Visual Builder
                        </button>
                    )}
                    <button
                        onClick={toggleTheme}
                        className="flex items-center px-4 py-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white w-full"
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {isDark ? <Sun size={18} className="mr-3" /> : <Moon size={18} className="mr-3" />}
                        {isDark ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <button onClick={onExit} className="flex items-center text-red-300 hover:text-red-100 transition-colors w-full justify-center pt-2 mt-2 border-t border-gray-700/50">
                        <LogOut size={20} className="mr-2" /> Return to Site
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden flex justify-around items-center p-2 safe-area-inset-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex flex-col items-center justify-center w-1/4 py-1 gap-1 transition-colors ${activeTab === 'overview' ? 'text-primary' : 'text-gray-400'}`}
                >
                    <div className={`p-1 rounded-lg ${activeTab === 'overview' ? 'bg-primary/10' : ''}`}>
                        <LayoutDashboard size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight">Home</span>
                </button>
                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`flex flex-col items-center justify-center w-1/4 py-1 gap-1 transition-colors ${activeTab === 'calendar' ? 'text-primary' : 'text-gray-400'}`}
                >
                    <div className={`p-1 rounded-lg relative ${activeTab === 'calendar' ? 'bg-primary/10' : ''}`}>
                        <CalendarIcon size={20} />
                        {pendingBookings.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full border-2 border-white dark:border-gray-800">
                                {pendingBookings.length}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight">Calendar</span>
                </button>
                <div className="relative w-1/4 flex justify-center -mt-6">
                    <button
                        onClick={onEnterVisualBuilder}
                        className="bg-primary text-white p-3 rounded-full shadow-lg border-4 border-white dark:border-gray-900 active:scale-95 transition-transform"
                        title="Visual Builder"
                    >
                        <Palette size={24} />
                    </button>
                </div>
                <button
                    onClick={() => setActiveTab('rooms')}
                    className={`flex flex-col items-center justify-center w-1/4 py-1 gap-1 transition-colors ${activeTab === 'rooms' ? 'text-primary' : 'text-gray-400'}`}
                >
                    <div className={`p-1 rounded-lg ${activeTab === 'rooms' ? 'bg-primary/10' : ''}`}>
                        <BedDouble size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight">Rooms</span>
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex flex-col items-center justify-center w-1/4 py-1 gap-1 transition-colors ${activeTab === 'settings' ? 'text-primary' : 'text-gray-400'}`}
                >
                    <div className={`p-1 rounded-lg ${activeTab === 'settings' ? 'bg-primary/10' : ''}`}>
                        <SettingsIcon size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight">Settings</span>
                </button>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen pb-24 md:pb-8">





                {/* Mobile-Only: Upcoming Arrivals at very top */}
                <div className="md:hidden mb-4">
                    {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const next30Days = new Date(today);
                        next30Days.setDate(next30Days.getDate() + 30);

                        const upcomingArrivals = processedBookings
                            .filter(b => {
                                if (b.status !== 'pending') return false; // ONLY show action-required pending bookings
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
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 border border-blue-200 dark:border-gray-700/50 rounded-xl p-3 shadow-sm">
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
                                                    ? 'bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-500/50'
                                                    : isTomorrow
                                                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600/50'
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                style={{ minWidth: '120px', maxWidth: '140px' }}
                                            >
                                                <div className={`text-[9px] font-bold uppercase mb-1 ${isToday ? 'text-green-700 dark:text-green-400' : isTomorrow ? 'text-yellow-700 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'
                                                    }`}>
                                                    {isToday ? '🔔 TODAY' : isTomorrow ? '⏰ Tomorrow' : format(checkInDate, 'EEE, MMM d')}
                                                </div>
                                                <div className="font-bold text-gray-800 dark:text-white text-xs truncate">{booking.guestName}</div>
                                                <div className="text-[10px] text-gray-500 dark:text-gray-300 truncate">{room?.name || 'Room'}</div>
                                                <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                                                    {booking.estimatedArrival || '14:00'} - {booking.estimatedDeparture || '11:00'}
                                                </div>
                                                {booking.status === 'pending' && (
                                                    <div className="mt-1 text-[8px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/20 px-1 py-0.5 rounded inline-block border border-yellow-200/50 dark:border-yellow-500/30">
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


                {/* Admin Onboarding Tour */}
                {settings?.setupComplete && (
                    <AdminOnboarding onNavigate={navigateToTab} onEnterVisualBuilder={onEnterVisualBuilder} />
                )}



                {
                    activeTab === 'overview' && (
                        <div className="animate-fade-in space-y-4 sm:space-y-6 md:space-y-8 pb-12">
                            {/* Stats Cards & Charts - Keep existing implementation */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Track performance and manage bookings</p>
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
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                                        <div className="p-2 bg-teal-50 dark:bg-teal-500/20 rounded-lg text-teal-600 dark:text-teal-400 shrink-0">
                                            <CalendarIcon size={18} className="sm:w-6 sm:h-6" />
                                        </div>
                                        <span className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Bookings</span>
                                    </div>
                                    <div className="flex items-end space-x-1 sm:space-x-2 mt-auto">
                                        <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white leading-none">{rangeBookingsCount}</span>
                                        <span className="text-[9px] md:text-xs text-gray-400 mb-0.5 sm:mb-1 hidden sm:inline">In Range</span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                                        <div className="p-2 bg-green-50 dark:bg-green-500/20 rounded-lg text-green-600 dark:text-green-400 shrink-0">
                                            <TrendingUp size={18} className="sm:w-6 sm:h-6" />
                                        </div>
                                        <span className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue</span>
                                    </div>
                                    <div className="flex items-end space-x-1 sm:space-x-2 mt-auto">
                                        <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white leading-none truncate overflow-hidden text-ellipsis w-full">₱{rangeRevenue.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                                            <BedDouble size={18} className="sm:w-6 sm:h-6" />
                                        </div>
                                        <span className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Rooms</span>
                                    </div>
                                    <div className="flex items-end space-x-1 sm:space-x-2 mt-auto">
                                        <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white leading-none">{rooms.length}</span>
                                        <span className="text-[9px] md:text-xs text-gray-400 mb-0.5 sm:mb-1 hidden sm:inline">Active</span>
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
                                                cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6' }}
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                                                    color: isDark ? '#F3F4F6' : '#111827',
                                                    padding: '8px 12px'
                                                }}
                                                itemStyle={{ color: isDark ? '#F3F4F6' : '#111827' }}
                                                labelStyle={{ color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold' }}
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
                                            <div className="w-full md:w-1/2 h-56">
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

                                {/* Loading Overlay */}
                                {isLoadingBookings && (
                                    <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
                                        <Loader size={18} className="animate-spin text-primary" />
                                        <span className="text-sm font-medium">Fetching bookings...</span>
                                    </div>
                                )}

                                {/* Desktop Table View */}
                                <div className={`hidden lg:block overflow-x-auto ${isLoadingBookings ? 'opacity-30 pointer-events-none' : ''}`}>
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
                                            <div key={booking.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm p-3 sm:p-4 relative">
                                                <div className="flex justify-between items-start mb-1 sm:mb-2 text-left">
                                                    <div className="text-left">
                                                        <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">{booking.guestName}</h4>
                                                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-300">{roomName}</p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full border ${getStatusColor(booking.status)}`}>
                                                        {booking.status}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-1 sm:gap-2 text-sm text-gray-600 dark:text-gray-400 my-2 sm:my-3">
                                                    <div className="text-left">
                                                        <span className="block text-[10px] sm:text-xs text-gray-400 dark:text-primary/70 font-bold uppercase tracking-tight">Dates & Times</span>
                                                        <div className="font-medium text-xs sm:text-sm text-gray-800 dark:text-white">{booking.checkIn} - {booking.checkOut}</div>
                                                        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-300 flex items-center mt-0.5">
                                                            <Clock size={10} className="mr-1" />
                                                            {booking.estimatedArrival || '14:00'} - {booking.estimatedDeparture || '11:00'}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-[10px] sm:text-xs text-gray-400 dark:text-primary/70 font-bold uppercase tracking-tight">Total</span>
                                                        <span className="font-bold text-sm sm:text-base text-primary">₱{booking.totalPrice.toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end border-t border-gray-50 dark:border-gray-700 pt-2 sm:pt-3 space-x-2 sm:space-x-3">
                                                    <button
                                                        onClick={() => handleEditBookingClick(booking)}
                                                        className="flex items-center text-[10px] sm:text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 px-3 sm:px-4 py-1.5 rounded-lg border border-transparent dark:border-indigo-500/20 active:scale-95 transition-all"
                                                    >
                                                        <Edit size={12} className="mr-1" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBookingClick(booking.id)}
                                                        className="flex items-center text-[10px] sm:text-xs font-bold text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 px-3 sm:px-4 py-1.5 rounded-lg border border-transparent dark:border-red-500/20 active:scale-95 transition-all"
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
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Room Management</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Add, edit, or remove rooms and amenities</p>
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

                            {/* ─── Global Deposit Settings (Collapsible Banner) ─── */}
                            {(() => {
                                const currentGlobalDeposit = settingsForm?.reservationPolicy?.depositPercentage ?? 50;
                                const displayDeposit = draftDepositPct !== null ? draftDepositPct : currentGlobalDeposit;
                                const hasDraftDeposit = draftDepositPct !== null && draftDepositPct !== currentGlobalDeposit;

                                return (
                                    <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg overflow-hidden transition-all shadow-sm">
                                        {/* Collapsed State / Toggle Header */}
                                        <button
                                            onClick={() => setIsGlobalDepositExpanded(!isGlobalDepositExpanded)}
                                            className="w-full flex items-center justify-between px-4 py-2.5 sm:py-3 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                                        >
                                            <div className="flex items-center text-sm font-semibold text-gray-800 dark:text-gray-200 text-left">
                                                <span>🌐 Global Deposit Rule: <span className="text-primary font-bold">{currentGlobalDeposit}%</span> <span className="text-gray-400 dark:text-gray-500 font-normal ml-1 hidden sm:inline">— tap to edit</span></span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="sm:hidden">tap to edit</span>
                                                <ChevronDown size={16} className={`transition-transform duration-300 ${isGlobalDepositExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>

                                        {/* Expanded State (Slider + Save button) */}
                                        {isGlobalDepositExpanded && (
                                            <div className="p-4 border-t border-primary/10 dark:border-primary/20 bg-white/50 dark:bg-gray-800/50 animate-fade-in">
                                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                                    <div className="flex items-center gap-3 w-full flex-1">
                                                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">0%</span>
                                                        <input
                                                            type="range"
                                                            min={0}
                                                            max={100}
                                                            step={5}
                                                            value={displayDeposit}
                                                            onChange={(e) => setDraftDepositPct(Number(e.target.value))}
                                                            className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-primary bg-primary/20 dark:bg-primary/30"
                                                        />
                                                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">100%</span>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                                                        <div className="text-xl font-black text-primary tabular-nums shrink-0 w-12 text-center sm:text-right">
                                                            {displayDeposit}%
                                                        </div>
                                                        <button
                                                            disabled={!hasDraftDeposit}
                                                            onClick={async () => {
                                                                if (!hasDraftDeposit) return;
                                                                const updatedPolicy = {
                                                                    ...(settingsForm?.reservationPolicy ?? {
                                                                        autoConfirmOnDeposit: false,
                                                                        cancellationPolicy: '',
                                                                        paymentDeadlineHours: 24,
                                                                        bookingSystemType: 'strict' as const,
                                                                    }),
                                                                    depositPercentage: draftDepositPct,
                                                                };
                                                                const newSettings = { ...settingsForm!, reservationPolicy: updatedPolicy };
                                                                setSettingsForm(newSettings);
                                                                if (onUpdateSettings) {
                                                                    await onUpdateSettings(newSettings);
                                                                }
                                                                setDraftDepositPct(null);
                                                                setIsGlobalDepositExpanded(false); // auto collapse
                                                                showToast('Global deposit updated', 'success');
                                                            }}
                                                            className={`px-5 py-2 text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none ${hasDraftDeposit
                                                                    ? 'bg-primary text-white hover:bg-primary-hover active:scale-95'
                                                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            <Save size={16} /> Save Rule
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Room List */}
                            <div className="grid grid-cols-1 gap-4 sm:gap-6">
                                {rooms.map(room => (
                                    <div key={room.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all overflow-hidden ${editingRoomId === room.id ? 'border-primary ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700 hover:shadow-md'}`}>
                                        <div className="flex flex-row h-32 sm:h-auto">
                                            {/* Image Thumb */}
                                            <div className="w-28 sm:w-48 md:w-64 h-full relative bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                                <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                                                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-white/95 dark:bg-black/80 backdrop-blur-sm px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black shadow-md border border-white/20">
                                                    <span className="text-gray-900 dark:text-white">₱{room.price.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between min-w-0">
                                                <div>
                                                    <div className="flex justify-between items-start mb-1 sm:mb-2">
                                                        <div className="min-w-0">
                                                            <h3 className="text-sm sm:text-xl font-bold text-gray-800 dark:text-white truncate">{room.name}</h3>
                                                            <div className="flex items-center text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                                                                <Users size={12} className="mr-1 sm:hidden" />
                                                                <Users size={14} className="mr-1 hidden sm:block" />
                                                                Capacity: {room.capacity} Guests
                                                            </div>
                                                        </div>
                                                        {editingRoomId !== room.id && (
                                                            <div className="flex space-x-1 sm:space-x-2 ml-2 flex-shrink-0">
                                                                <button
                                                                    onClick={() => handleEditRoomClick(room)}
                                                                    className="p-1.5 sm:p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors border border-transparent dark:border-indigo-500/20"
                                                                    title="Edit"
                                                                >
                                                                    <Edit size={14} className="sm:hidden" />
                                                                    <Edit size={18} className="hidden sm:block" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteRoomClick(room.id)}
                                                                    className="p-1.5 sm:p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors border border-transparent dark:border-red-500/20"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={14} className="sm:hidden" />
                                                                    <Trash2 size={18} className="hidden sm:block" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <p className="hidden sm:-webkit-box text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3 lg:mb-4">{room.description}</p>

                                                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-auto">
                                                        {room.amenities.slice(0, 5).map((am, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-200 border border-gray-100 dark:border-gray-500">
                                                                <span className="sm:hidden">{renderAmenityIcon(am.icon)}</span>
                                                                <span className="hidden sm:inline">{renderAmenityIcon(am.icon)}</span>
                                                                <span className="hidden sm:inline ml-1.5">{am.name}</span>
                                                            </span>
                                                        ))}
                                                        {room.amenities.length > 5 && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs bg-gray-50 dark:bg-gray-600 text-gray-400 dark:text-gray-300">
                                                                +{room.amenities.length - 5} <span className="hidden sm:inline ml-1">more</span>
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
                rooms={rooms}
                onSave={handleSaveBooking}
            />

            {/* Add/Edit Room Modal */}
            {(isAddingRoom || editingRoomId) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-4xl relative animate-pop max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
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

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                                    {/* Deposit Section — per room */}
                                    <div className="col-span-1 md:col-span-2">
                                        {(() => {
                                            const currentForm = isAddingRoom ? newRoom : editForm;
                                            const globalPct = settingsForm?.reservationPolicy?.depositPercentage ?? 50;
                                            const overnightPrice = currentForm.price || 0;
                                            const dayUsePrice = currentForm.dayUsePrice || 0;

                                            // Auto-calculated amounts
                                            const autoOvernight = overnightPrice > 0 ? Math.round(overnightPrice * globalPct / 100) : null;
                                            const autoDayUse = dayUsePrice > 0 ? Math.round(dayUsePrice * globalPct / 100) : null;

                                            // Current stored override values
                                            const overnightDeposit = currentForm.overnightDepositAmount;
                                            const dayUseDeposit = currentForm.dayUseDepositAmount;

                                            // Is this field manually overridden?
                                            const isOvernightOverride = overnightDeposit !== undefined && autoOvernight !== null && overnightDeposit !== autoOvernight;
                                            const isDayUseOverride = dayUseDeposit !== undefined && autoDayUse !== null && dayUseDeposit !== autoDayUse;

                                            // Display values (stored override or auto-calculated)
                                            const displayOvernight = overnightDeposit !== undefined ? overnightDeposit : (autoOvernight ?? 0);
                                            const displayDayUse = dayUseDeposit !== undefined ? dayUseDeposit : (autoDayUse ?? 0);

                                            const setField = (patch: { overnightDepositAmount?: number; dayUseDepositAmount?: number }) => {
                                                isAddingRoom
                                                    ? setNewRoom({ ...newRoom, ...patch })
                                                    : setEditForm({ ...editForm, ...patch });
                                            };

                                            const noPriceYet = overnightPrice === 0;

                                            return (
                                                <div className="rounded-xl border-2 border-primary/20 dark:border-primary/30 overflow-hidden">
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between px-4 py-3 bg-primary/5 dark:bg-primary/10 border-b border-primary/10 dark:border-primary/20">
                                                        <div className="flex items-center gap-2">
                                                            <CreditCard size={15} className="text-primary" />
                                                            <span className="text-sm font-bold text-gray-800 dark:text-white">Deposit Amounts</span>
                                                        </div>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600">
                                                            Global: <span className="font-bold text-primary">{globalPct}%</span>
                                                        </span>
                                                    </div>

                                                    {/* Body */}
                                                    <div className="p-4 bg-white dark:bg-gray-800">
                                                        {noPriceYet ? (
                                                            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-2">
                                                                Enter the overnight price above to auto-calculate deposits
                                                            </p>
                                                        ) : (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                                                {/* Overnight Deposit */}
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-1.5">
                                                                        <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Overnight Deposit</label>
                                                                        {isOvernightOverride
                                                                            ? <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">⚡ Custom</span>
                                                                            : <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">✓ Auto</span>
                                                                        }
                                                                    </div>
                                                                    <div className="relative">
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm pointer-events-none">₱</span>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={displayOvernight}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === '' ? undefined : Number(e.target.value);
                                                                                setField({ overnightDepositAmount: val });
                                                                            }}
                                                                            className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-lg font-semibold text-gray-800 dark:text-white transition-colors ${isOvernightOverride
                                                                                    ? 'border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/10'
                                                                                    : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
                                                                                }`}
                                                                        />
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-400 mt-1.5 min-h-[14px]">
                                                                        {isOvernightOverride
                                                                            ? <span>Custom &mdash; <button type="button" onClick={() => setField({ overnightDepositAmount: undefined })} className="text-primary underline hover:no-underline">Reset to ₱{autoOvernight?.toLocaleString()} ({globalPct}%)</button></span>
                                                                            : <span>Auto: {globalPct}% of ₱{overnightPrice.toLocaleString()}</span>
                                                                        }
                                                                    </p>
                                                                </div>

                                                                {/* Day Use Deposit */}
                                                                {dayUsePrice > 0 ? (
                                                                    <div>
                                                                        <div className="flex items-center justify-between mb-1.5">
                                                                            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Day Use Deposit</label>
                                                                            {isDayUseOverride
                                                                                ? <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">⚡ Custom</span>
                                                                                : <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">✓ Auto</span>
                                                                            }
                                                                        </div>
                                                                        <div className="relative">
                                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm pointer-events-none">₱</span>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                value={displayDayUse}
                                                                                onChange={(e) => {
                                                                                    const val = e.target.value === '' ? undefined : Number(e.target.value);
                                                                                    setField({ dayUseDepositAmount: val });
                                                                                }}
                                                                                className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-lg font-semibold text-gray-800 dark:text-white transition-colors ${isDayUseOverride
                                                                                        ? 'border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/10'
                                                                                        : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
                                                                                    }`}
                                                                            />
                                                                        </div>
                                                                        <p className="text-[10px] text-gray-400 mt-1.5 min-h-[14px]">
                                                                            {isDayUseOverride
                                                                                ? <span>Custom &mdash; <button type="button" onClick={() => setField({ dayUseDepositAmount: undefined })} className="text-primary underline hover:no-underline">Reset to ₱{autoDayUse?.toLocaleString()} ({globalPct}%)</button></span>
                                                                                : <span>Auto: {globalPct}% of ₱{dayUsePrice.toLocaleString()}</span>
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 p-4">
                                                                        <p className="text-xs text-gray-400 text-center">Set a day use price<br />above to see its deposit</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gallery Images</label>
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
                                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                                    placeholder="Image URL"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleRemoveGalleryImage(idx, !isAddingRoom)}
                                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amenities</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                                    {PREDEFINED_AMENITIES.map(amenity => {
                                        const currentAmenities = isAddingRoom ? (newRoom.amenities || []) : (editForm.amenities || []);
                                        const isSelected = currentAmenities.some(a => a.name === amenity.name);
                                        return (
                                            <div
                                                key={amenity.name}
                                                onClick={() => isAddingRoom ? toggleNewRoomAmenity(amenity) : toggleEditAmenity(amenity)}
                                                className={`cursor-pointer flex items-center p-2 rounded-lg border text-sm transition-colors ${isSelected ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 dark:text-gray-300'}`}
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
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="relative" ref={isAddingRoom ? newRoomIconPickerRef : iconPickerRef}>
                                        <button
                                            onClick={() => isAddingRoom ? setShowNewRoomIconPicker(!showNewRoomIconPicker) : setShowIconPicker(!showIconPicker)}
                                            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                            title="Select Icon"
                                        >
                                            {renderAmenityIcon(isAddingRoom ? newRoomCustomIcon : customAmenityIcon)}
                                        </button>
                                        {(isAddingRoom ? showNewRoomIconPicker : showIconPicker) && (
                                            <div className="absolute bottom-full right-0 mb-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 pb-6 grid grid-cols-6 gap-2 z-[100] max-h-64 overflow-y-auto scrollbar-thin">
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
                                        <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-sm">
                                            {renderAmenityIcon(amenity.icon)}
                                            <span className="ml-1.5 mr-1">{amenity.name}</span>
                                            <button
                                                onClick={() => isAddingRoom ? toggleNewRoomAmenity(amenity) : toggleEditAmenity(amenity)}
                                                className="text-gray-400 hover:text-red-500 ml-1 transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end space-x-3 border-t border-gray-100 dark:border-gray-700 pt-6">
                            <button
                                onClick={() => { isAddingRoom ? setIsAddingRoom(false) : setEditingRoomId(null) }}
                                className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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


            {/* Expiry Warning / Self-Service Renewal Modal */}
            {
                showExpiryWarning && expiryDays !== null && (
                    <RenewalModal
                        expiryDays={expiryDays}
                        expiryDate={expiryDate}
                        contactInfo={contactInfo}
                        settings={settings}
                        onClose={() => setShowExpiryWarning(false)}
                    />
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

            {/* Admin Onboarding Tour */}
            {settings?.setupComplete && (
                <AdminOnboarding onNavigate={navigateToTab} onEnterVisualBuilder={onEnterVisualBuilder} />
            )}
        </div>
    );
};

export default AdminDashboard;