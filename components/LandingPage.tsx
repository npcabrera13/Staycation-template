import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import Navbar from './Navbar';
import Footer from './Footer';
import RoomCard from './RoomCard';
import AIChat from './AIChat';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import RevealOnScroll from './RevealOnScroll';
import SearchBar from './SearchBar';
import { Room, Booking, Settings } from '../types';
import { 
    ChevronLeft, ChevronRight, MapPin, AlertCircle, Loader, Phone, Mail, 
    Facebook, Instagram, Music, Plus, Image as ImageIcon, Info, Trash2, 
    Sparkles, X, Wifi, Shield, Star, Coffee, Home, 
    Waves, Wind, ChefHat, Car, Dumbbell, Tv, Utensils, 
    Monitor, Zap, Sun, Umbrella, Bell, Bath, Armchair, Bike, Key, Edit, Hash,
    Layout, RotateCcw, Move, ExternalLink, Maximize
} from 'lucide-react';
import { COMPANY_INFO } from '../constants';
import InlineText from './Builder/InlineText';
import InlineImage from './Builder/InlineImage';
import InlineButton from './Builder/InlineButton';
import InlineColorBlock from './Builder/InlineColorBlock';
import BuilderToolbar from './Builder/BuilderToolbar';
import SetupWizard from './SetupWizard';
import GalleryFrame from './UI/GalleryFrame';

const LAYOUT_CONFIGS = {
    'mosaic': {
        name: 'Classic Mosaic',
        gridClass: 'grid-cols-2 grid-rows-2',
        frames: [
            { className: 'col-span-1 row-span-2 h-full' },
            { className: 'col-span-1 row-span-1 h-full' },
            { className: 'col-span-1 row-span-1 h-full' },
        ]
    },
    'grid-2': {
        name: '2-Column Split',
        gridClass: 'grid-cols-2 grid-rows-1',
        frames: [
            { className: 'col-span-1 h-64 md:h-full' },
            { className: 'col-span-1 h-64 md:h-full' },
        ]
    },
    'grid-3': {
        name: '3-Column Row',
        gridClass: 'grid-cols-1 md:grid-cols-3 gap-4',
        frames: [
            { className: 'h-64 md:h-80' },
            { className: 'h-64 md:h-80' },
            { className: 'h-64 md:h-80' },
        ]
    },
    'grid-4': {
        name: '2x2 Grid',
        gridClass: 'grid-cols-2 grid-rows-2',
        frames: [
            { className: 'aspect-square' },
            { className: 'aspect-square' },
            { className: 'aspect-square' },
            { className: 'aspect-square' },
        ]
    },
    'panorama': {
        name: 'Panorama Feature',
        gridClass: 'grid-cols-2 grid-rows-2',
        frames: [
            { className: 'col-span-2 row-span-1 h-48 md:h-64' },
            { className: 'col-span-1 row-span-1 h-40 md:h-48' },
            { className: 'col-span-1 row-span-1 h-40 md:h-48' },
        ]
    }
};

// Wrapper that only shows AI chat when enabled in SuperAdmin settings
// Deferred by 3s to avoid competing with critical page-load Firebase calls
const AiChatWrapper: React.FC = () => {
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                const snap = await getDoc(doc(db, '_superadmin', 'settings'));
                if (snap.exists() && snap.data().enableAiChat === true) setEnabled(true);
            } catch { }
        }, 3000); // Defer 3 seconds after page load
        return () => clearTimeout(timer);
    }, []);
    if (!enabled) return null;
    return <AIChat />;
};
import { DEFAULT_SETTINGS } from '../services/settingsService';

const ICON_OPTIONS = [
    { name: 'wifi', icon: Wifi },
    { name: 'shield', icon: Shield },
    { name: 'star', icon: Star },
    { name: 'coffee', icon: Coffee },
    { name: 'home', icon: Home },
    { name: 'map', icon: MapPin },
    { name: 'sparkles', icon: Sparkles },
    { name: 'waves', icon: Waves },
    { name: 'wind', icon: Wind },
    { name: 'chef-hat', icon: ChefHat },
    { name: 'car', icon: Car },
    { name: 'dumbbell', icon: Dumbbell },
    { name: 'tv', icon: Tv },
    { name: 'utensils', icon: Utensils },
    { name: 'monitor', icon: Monitor },
    { name: 'zap', icon: Zap },
    { name: 'sun', icon: Sun },
    { name: 'umbrella', icon: Umbrella },
    { name: 'bell', icon: Bell },
    { name: 'bath', icon: Bath },
    { name: 'armchair', icon: Armchair },
    { name: 'bike', icon: Bike },
    { name: 'key', icon: Key },
    { name: 'number', icon: Hash }
];

const RenderFeatureIcon: React.FC<{ icon?: string, index: number }> = ({ icon, index }) => {
    // If specifically set to 'number' OR if it's explicitly empty/missing, show the number 01, 02 
    if (!icon || icon.toLowerCase() === 'number') {
        return (
            <div className="flex-shrink-0 bg-primary flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] text-white font-black text-xl sm:text-2xl md:text-3xl shadow-2xl shadow-primary/20 transition-transform group-hover:scale-110 group-hover:rotate-6 duration-500">
                0{index + 1}
            </div>
        );
    }

    if (icon.startsWith('http')) {
        return (
             <div className="flex-shrink-0 bg-white dark:bg-gray-700 flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] shadow-xl overflow-hidden glass transition-transform group-hover:scale-110 duration-500">
                <img src={icon} alt="icon" className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain" />
            </div>
        );
    }

    const FoundIcon = ICON_OPTIONS.find(io => io.name === icon.toLowerCase())?.icon || Sparkles;
    
    return (
        <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/5 flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] text-primary shadow-2xl shadow-primary/5 transition-transform group-hover:scale-110 group-hover:rotate-6 duration-500">
            <FoundIcon size={40} className="w-1/2 h-1/2" />
        </div>
    );
};

interface LandingPageProps {
    rooms: Room[];
    bookings: Booking[];
    onRoomSelect: (room: Room, openGallery?: boolean) => void;
    onAdminEnter: () => void;
    onOpenMyBookings: () => void;
    isLoading: boolean;
    settings?: Settings;
    onUpdateSettings?: (settings: Settings) => Promise<void>; // Added for Builder
    isAdmin?: boolean;
    onExitAdmin?: () => void;
    startEditing?: boolean;
    onEditingStarted?: () => void;
    onUpdateRoom?: (roomId: string, updates: Partial<Room>) => Promise<void>;
}

const LandingPage: React.FC<LandingPageProps> = ({
    rooms,
    bookings,
    onRoomSelect,
    onAdminEnter,
    onOpenMyBookings,
    isLoading,
    settings,
    onUpdateSettings,
    isAdmin = false,
    onExitAdmin,
    startEditing,
    onEditingStarted,
    onUpdateRoom,
}) => {
    const navigate = useNavigate();
    const [activeRoomIndex, setActiveRoomIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Dynamic Room Gallery Images
    const roomGalleryImages = useMemo(() => {
        const imgs = rooms.flatMap(r => [r.image, ...(r.images || [])])
            .filter(img => img && typeof img === "string" && img.trim() !== "" && img.includes("http"));
        return Array.from(new Set(imgs));
    }, [rooms]);

    // Builder State
    const [isEditing, setIsEditing] = useState(false);
    const [workingSettings, setWorkingSettings] = useState<Settings>(settings || DEFAULT_SETTINGS);
    const [hasChanges, setHasChanges] = useState(false);
    const [activeHeroSlide, setActiveHeroSlide] = useState(0);
    const [activeAboutSlide, setActiveAboutSlide] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Minimum swipe distance in pixels
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            setActiveAboutSlide(prev => (prev + 1) % displayGalleryImages.length);
        } else if (isRightSwipe) {
            setActiveAboutSlide(prev => (prev - 1 + displayGalleryImages.length) % displayGalleryImages.length);
        }
    };
    const [showAboutLightbox, setShowAboutLightbox] = useState(false);
    
    // Gallery Manager State
    const [showGalleryManager, setShowGalleryManager] = useState(false);
    const [tempGalleryImages, setTempGalleryImages] = useState<string[]>([]);
    const [tempGalleryPositions, setTempGalleryPositions] = useState<string[]>([]);
    const [tempGalleryScales, setTempGalleryScales] = useState<number[]>([]);
    const [tempLayoutType, setTempLayoutType] = useState<string>('mosaic');
    const [tempInheritGallery, setTempInheritGallery] = useState<boolean>(true);

    const [isBuilderMinimized, setIsBuilderMinimized] = useState(false);
    const [activeIconPicker, setActiveIconPicker] = useState<number | null>(null);

    // Consolidated Gallery Images Logic
    const displayGalleryImages = useMemo(() => {
        const isInheriting = workingSettings.about?.inheritGallery !== false;
        const customImages = (workingSettings.about?.images || []).filter(img => img && img.trim() !== "");
        
        const defaultFallbackImages = [
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
        ];

        return isInheriting 
            ? (roomGalleryImages.length > 0 ? roomGalleryImages : defaultFallbackImages)
            : (customImages.length > 0 ? customImages : defaultFallbackImages);
    }, [workingSettings.about?.inheritGallery, workingSettings.about?.images, roomGalleryImages]);

    const { showToast, showConfirm } = useNotification();

    // Initial load - use deep copy to avoid shared reference
    useEffect(() => {
        if (settings) setWorkingSettings(JSON.parse(JSON.stringify(settings)));
    }, [settings]);

    // Hero Slider Interval
    useEffect(() => {
        // Filter out empty images
        const images = (workingSettings.hero?.images || [workingSettings.hero?.image]).filter(img => img && img.trim() !== '' && img.includes('http'));
        if (!images || images.length <= 1) return;

        const interval = setInterval(() => {
            setActiveHeroSlide(prev => (prev + 1) % images.length);
        }, workingSettings.hero?.slideInterval || 5000);

        return () => clearInterval(interval);
    }, [workingSettings.hero?.images, workingSettings.hero?.slideInterval, workingSettings.hero?.image]);

    // Effect to handle external edit trigger
    React.useEffect(() => {
        if (startEditing) {
            setIsEditing(true);
            setIsBuilderMinimized(true); // Start minimized so user sees website directly
            if (onEditingStarted) onEditingStarted();
        }
    }, [startEditing, onEditingStarted]);

    // Update working settings when actual settings prop changes (if not editing)
    // Use deep copy to avoid shared reference mutations
    React.useEffect(() => {
        if (!isEditing && settings) {
            setWorkingSettings(JSON.parse(JSON.stringify(settings)));
        }
    }, [settings, isEditing]);

    // Live update document title
    React.useEffect(() => {
        if (workingSettings.siteName) {
            document.title = workingSettings.siteName;
        }
    }, [workingSettings.siteName]);

    // Live update CSS variables for Theme
    React.useEffect(() => {
        if (workingSettings.theme) {
            if (workingSettings.theme.primaryColor) {
                document.documentElement.style.setProperty('--color-primary', workingSettings.theme.primaryColor);
            }
            if (workingSettings.theme.primaryHoverColor) {
                document.documentElement.style.setProperty('--color-primary-hover', workingSettings.theme.primaryHoverColor);
            }
            if (workingSettings.theme.secondaryColor) {
                document.documentElement.style.setProperty('--color-secondary', workingSettings.theme.secondaryColor);
            }
            // Auto-mirror accent to primary (accent picker removed from builder)
            document.documentElement.style.setProperty('--color-accent', workingSettings.theme.accentColor || workingSettings.theme.primaryColor);
            if (workingSettings.theme.fontFamily) {
                document.body.classList.remove('font-sans', 'font-serif', 'font-mono');
                document.body.classList.add(`font-${workingSettings.theme.fontFamily}`);
            }
        }
    }, [workingSettings.theme]);

    const handleSettingChange = (section: keyof Settings, field: string, value: any) => {
        setWorkingSettings(prev => {
            const updated = { ...prev };

            if (field === '') {
                // Top-level property update (e.g. siteName, logo)
                (updated as any)[section] = value;
            } else if (typeof updated[section] === 'object' && updated[section] !== null) {
                // Nested property update — create new object reference so useEffect detects changes
                (updated as any)[section] = { ...(updated[section] as any), [field]: value };
            }

            return updated;
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (onUpdateSettings) {
            await onUpdateSettings(workingSettings);
            setIsEditing(false);
            setHasChanges(false);
            if (isAdmin) {
                navigate('/admin');
            }
        }
    };

    // Ref to capture latest settings for discard callback (avoids stale closure)
    const settingsRef = useRef(settings);
    settingsRef.current = settings;

    const handleCancel = useCallback(() => {
        console.log('=== handleCancel CALLED ===');
        console.log('hasChanges:', hasChanges);
        console.log('isEditing:', isEditing);

        const doExit = () => {
            // Reset to original settings using ref for latest value
            console.log('Resetting settings and exiting...');
            console.log('settingsRef.current:', settingsRef.current);
            if (settingsRef.current) {
                setWorkingSettings(JSON.parse(JSON.stringify(settingsRef.current)));
            }
            setIsEditing(false);
            setHasChanges(false);
            setIsBuilderMinimized(false);
            if (isAdmin) {
                navigate('/admin');
            }
            console.log('=== Builder EXITED, isEditing set to false ===');
        };

        if (hasChanges) {
            // Show styled confirmation modal
            showConfirm({
                title: "Discard Changes?",
                message: "You have unsaved changes. Are you sure you want to discard them?",
                isDangerous: true,
                confirmLabel: "Discard & Exit",
                onConfirm: doExit
            });
        } else {
            doExit();
        }
    }, [hasChanges, isEditing, showConfirm]);

    // Drag Scroll State
    const [isDragging, setIsDragging] = useState(false);
    const isDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    // Search State
    const [searchCriteria, setSearchCriteria] = useState<{
        checkIn: Date | null;
        checkOut: Date | null;
        guests: number;
    } | null>(null);

    const filteredRooms = useMemo(() => {
        if (!searchCriteria) return rooms;

        return rooms.filter(room => {
            // 1. Capacity Check
            if (room.capacity < searchCriteria.guests) return false;

            // 2. Availability Check
            if (searchCriteria.checkIn && searchCriteria.checkOut) {
                const isSmartMode = workingSettings.reservationPolicy?.bookingSystemType === 'smart';
                const roomBookings = bookings.filter(b => {
                    if (b.roomId !== room.id || b.status === 'cancelled') return false;
                    // In Smart Mode, only 'confirmed' bookings block the search results
                    return isSmartMode ? b.status === 'confirmed' : true;
                });

                const hasOverlap = roomBookings.some(b => {
                    const bookedStart = new Date(b.checkIn);
                    const bookedEnd = new Date(b.checkOut);
                    const reqStart = searchCriteria.checkIn!;
                    const reqEnd = searchCriteria.checkOut!;

                    // Standard Overlap Logic
                    return (reqStart < bookedEnd && reqEnd > bookedStart);
                });

                if (hasOverlap) return false;
            }

            return true;
        });
    }, [rooms, bookings, searchCriteria]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const scrollPosition = container.scrollLeft;
        // Get precise card width including gap estimate
        const firstCard = container.firstElementChild as HTMLElement;
        const cardWidth = firstCard ? firstCard.offsetWidth + 24 : container.clientWidth * 0.85; // 24 is gap-6

        if (cardWidth) {
            const index = Math.round(scrollPosition / cardWidth);
            setActiveRoomIndex(index);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            // Calculate scroll amount based on the first card's width plus the gap
            const firstCard = current.firstElementChild as HTMLElement;
            const scrollAmount = firstCard ? firstCard.offsetWidth + 24 : current.clientWidth * 0.85;

            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const handleClearSearch = () => setSearchCriteria(null);

    // Drag to Scroll Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        // Ignore right clicks or touch devices (coarse pointers). Let native overflow-x handle touch swipes.
        if (e.button !== 0 || (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches)) return;
        
        if (!scrollContainerRef.current) return;
        isDown.current = true;
        startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
        scrollLeft.current = scrollContainerRef.current.scrollLeft;
    };

    const handleMouseLeave = () => {
        isDown.current = false;
        if (isDragging) setIsDragging(false);
    };

    const handleMouseUp = () => {
        isDown.current = false;
        setTimeout(() => setIsDragging(false), 50);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDown.current || !scrollContainerRef.current) return;
        e.preventDefault(); // Only fires on desktop holding click, prevents text selection
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX.current) * 2; // Scroll-fast

        // Only engage drag mode if moved significantly (threshold)
        if (Math.abs(x - startX.current) > 5) {
            if (!isDragging) setIsDragging(true);
            scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
        }
    };

    return (
        <>
            {/* Content Wrapper that shifts when Builder is open - DESKTOP ONLY */}
            <div
                className={`transition-all duration-300 ease-in-out ${isEditing && !isBuilderMinimized ? 'md:ml-[320px] md:w-[calc(100%-320px)] w-full' : 'w-full'}`}
            >
                <Navbar
                    isAdmin={isAdmin}
                    onAdminAccess={onAdminEnter}
                    onOpenMyBookings={onOpenMyBookings}
                    settings={workingSettings} // Use working settings to see live preview
                    isEditing={isEditing}
                    isBuilderOpen={isEditing && !isBuilderMinimized}
                    onUpdateSettings={handleSettingChange}
                />

                {/* Setup Wizard — mandatory until user changes the default name */}
                {workingSettings?.siteName === 'Serenity Staycation' && onUpdateSettings && (
                    <SetupWizard
                        settings={workingSettings}
                        rooms={rooms}
                        onUpdateSettings={onUpdateSettings}
                        onUpdateRoom={onUpdateRoom}
                        onEnterAdmin={onAdminEnter}
                    />
                )}

                {/* Hero Section */}
                <div id="hero" className="relative h-[75vh] md:h-[100vh] min-h-[500px] md:min-h-[600px] bg-secondary text-white overflow-hidden scroll-mt-24">
                    <div className="absolute inset-0">
                        {/* Get valid images array */}
                        {(() => {
                            const focusPoint = workingSettings.hero?.imageFocusPoint || 'center';
                            const focusPosition = focusPoint === 'top' ? 'top' : focusPoint === 'bottom' ? 'bottom' : 'center';
                            const mobileImage = workingSettings.hero?.mobileImage;
                            const validImages = (workingSettings.hero?.images || [workingSettings.hero?.image]).filter(img => img && img.trim() !== '' && img.includes('http'));

                            if (validImages.length === 0) {
                                // No valid images - show default
                                return (
                                    <div className="absolute inset-0">
                                        <InlineImage
                                            src={DEFAULT_SETTINGS.hero.image}
                                            alt="Hero Background"
                                            isEditing={isEditing}
                                            onChange={(val) => handleSettingChange('hero', 'image', val)}
                                            className="w-full h-full object-cover"
                                            style={{ objectPosition: focusPosition }}
                                        />
                                    </div>
                                );
                            }

                            if (validImages.length === 1) {
                                // Single image - no carousel
                                return (
                                    <div className="absolute inset-0">
                                        {/* Mobile hero image (if set) */}
                                        {mobileImage && mobileImage.trim() !== '' && (
                                            <img
                                                src={mobileImage}
                                                alt="Hero Background"
                                                fetchPriority="high"
                                                loading="eager"
                                                className="md:hidden w-full h-full object-cover absolute inset-0 z-[1]"
                                                style={{ objectPosition: focusPosition }}
                                            />
                                        )}
                                        <InlineImage
                                            src={validImages[0]}
                                            alt="Hero Background"
                                            isEditing={isEditing}
                                            onChange={(val) => {
                                                handleSettingChange('hero', 'image', val);
                                                handleSettingChange('hero', 'images', [val]);
                                            }}
                                            className={`w-full h-full object-cover ${mobileImage && mobileImage.trim() !== '' ? 'hidden md:block' : ''}`}
                                            style={{ objectPosition: focusPosition }}
                                        />
                                    </div>
                                );
                            }

                            // Multiple images - carousel with crossfade
                            return validImages.map((img, index) => {
                                const isActive = index === (activeHeroSlide ?? 0);
                                return (
                                    <div
                                        key={index}
                                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
                                    >
                                        {/* Mobile hero image override (only on active slide 0) */}
                                        {index === 0 && mobileImage && mobileImage.trim() !== '' && (
                                            <img
                                                src={mobileImage}
                                                alt="Hero Background"
                                                fetchPriority="high"
                                                loading="eager"
                                                className="md:hidden w-full h-full object-cover absolute inset-0 z-[1]"
                                                style={{ objectPosition: focusPosition }}
                                            />
                                        )}
                                        <InlineImage
                                            src={img}
                                            alt={`Hero Background ${index + 1}`}
                                            isEditing={isEditing}
                                            onChange={(val) => {
                                                const newImages = [...validImages];
                                                newImages[index] = val;
                                                handleSettingChange('hero', 'images', newImages);
                                            }}
                                            className={`w-full h-full object-cover ${index === 0 && mobileImage && mobileImage.trim() !== '' ? 'hidden md:block' : ''}`}
                                            style={{ objectPosition: focusPosition }}
                                        />
                                    </div>
                                );
                            });
                        })()}

                        <div
                            className="absolute inset-0 bg-black transition-opacity duration-300 z-20"
                            style={{ opacity: (workingSettings.hero?.overlayOpacity ?? 50) / 100 }}
                        ></div>
                    </div>

                    {isEditing && (
                        <div className="absolute bottom-4 right-4 z-40">
                            {/* Quick Hint or mini controls could go here, but main controls are in sidebar now */}
                        </div>
                    )}

                    <div className="relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-center items-center text-center z-30 pt-20">
                        <RevealOnScroll>
                            <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-accent text-sm tracking-widest uppercase font-bold mb-6">
                                <InlineText
                                    value={workingSettings.hero?.tagline ?? (settings?.siteName || "Welcome to Paradise")}
                                    placeholder="Enter short tagline"
                                    isEditing={isEditing}
                                    onChange={(val) => handleSettingChange('hero', 'tagline', val)}
                                />
                            </span>
                        </RevealOnScroll>

                        <RevealOnScroll delay={200}>
                            <h1 className={`text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 tracking-tight leading-tight transition-all duration-300 ${workingSettings.hero?.textShadow === 'lg' ? 'drop-shadow-[0_5px_5px_rgba(0,0,0,1)]' :
                                workingSettings.hero?.textShadow === 'sm' ? 'drop-shadow-md' : ''
                                }`}>
                                <InlineText
                                    value={workingSettings.hero?.title ?? ""}
                                    placeholder="Rediscover Serenity"
                                    isEditing={isEditing}
                                    onChange={(val) => handleSettingChange('hero', 'title', val)}
                                />
                            </h1>
                        </RevealOnScroll>

                        <RevealOnScroll delay={400}>
                            <p className={`text-lg md:text-2xl mb-10 max-w-2xl mx-auto text-gray-100 font-light leading-relaxed break-words transition-all duration-300 ${workingSettings.hero?.textShadow === 'lg' ? 'drop-shadow-[0_3px_3px_rgba(0,0,0,1)] font-medium' :
                                workingSettings.hero?.textShadow === 'sm' ? 'drop-shadow' : ''
                                }`}>
                                <InlineText
                                    value={workingSettings.hero?.subtitle ?? ""}
                                    placeholder="Luxury staycations curated for your peace of mind."
                                    isEditing={isEditing}
                                    onChange={(val) => handleSettingChange('hero', 'subtitle', val)}
                                    multiline
                                />
                            </p>
                        </RevealOnScroll>

                        <RevealOnScroll delay={600}>
                            <InlineButton
                                text={workingSettings.hero?.ctaText || "Explore Rooms"}
                                onTextChange={(val) => handleSettingChange('hero', 'ctaText', val)}
                                color={workingSettings.hero?.buttonColor || workingSettings.theme.primaryColor}
                                onColorChange={(newColor) => handleSettingChange('hero', 'buttonColor', newColor)}
                                textColor={workingSettings.hero?.buttonTextColor || ''}
                                onTextColorChange={(val) => handleSettingChange('hero', 'buttonTextColor', val)}
                                fontFamily={workingSettings.hero?.buttonFontFamily || 'sans'}
                                onFontFamilyChange={(val) => handleSettingChange('hero', 'buttonFontFamily', val)}
                                isEditing={isEditing}
                                onClick={() => {
                                    if (!isEditing) {
                                        document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}
                            />
                        </RevealOnScroll>
                    </div>
                </div>

                {/* Rooms Section */}
                <section id="rooms" className="py-24 md:py-32 bg-surface dark:bg-gray-900 relative overflow-hidden scroll-mt-20">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

                    <div className="max-w-7xl mx-auto px-4 relative z-10">
                        <RevealOnScroll>
                            <div className="text-center mb-12">
                                <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase mb-3 block">
                                    <InlineText
                                        value={workingSettings.features?.title ?? ""}
                                        placeholder="Stay with us"
                                        isEditing={isEditing}
                                        onChange={(val) => handleSettingChange('features', 'title', val)}
                                    />
                                </span>
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-secondary dark:text-white mb-10 leading-tight text-center px-2">
                                    <InlineText
                                        value={workingSettings.roomsSection?.title ?? ""}
                                        placeholder="Our Exclusive Rooms"
                                        isEditing={isEditing}
                                        onChange={(val) => handleSettingChange('roomsSection', 'title', val)}
                                    />
                                </h2>
                                <InlineColorBlock
                                    color={workingSettings.roomsSection?.accentColor || workingSettings.theme.primaryColor}
                                    onChange={(color) => handleSettingChange('roomsSection', 'accentColor', color)}
                                    className="w-24 h-1 mx-auto mb-8 rounded-full"
                                    isEditing={isEditing}
                                />

                                {searchCriteria ? (
                                    <div className="flex flex-col items-center animate-fade-in">
                                        <p className="text-gray-600 text-lg mb-4">
                                            Showing {filteredRooms.length} room{filteredRooms.length !== 1 && "s"} available for{" "}
                                            <span className="font-bold text-primary">
                                                {searchCriteria.checkIn?.toLocaleDateString()} - {searchCriteria.checkOut?.toLocaleDateString()}
                                            </span>
                                        </p>
                                        <button
                                            onClick={handleClearSearch}
                                            className="text-sm text-red-500 hover:text-red-700 underline font-medium"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-light text-center">
                                        <InlineText
                                            value={workingSettings.features?.description ?? ""}
                                            placeholder="From beachfront villas to cozy mountain cabins, each property is designed to provide the ultimate relaxation experience."
                                            isEditing={isEditing}
                                            onChange={(val) => handleSettingChange("features", "description", val)}
                                            multiline
                                        />
                                    </p>
                                )}
                            </div>
                        </RevealOnScroll>

                        {isLoading ? (
                            <div className="flex justify-center items-center py-24">
                                <Loader className="animate-spin text-primary mr-2" size={32} />
                                <span className="text-gray-500">Loading rooms...</span>
                            </div>
                        ) : filteredRooms.length > 0 ? (
                            <div className="relative group">
                                {filteredRooms.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => scroll("left")}
                                            className="absolute left-2 md:-left-6 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-white text-secondary p-3 rounded-full shadow-xl border border-gray-100 transition-all active:scale-95 md:opacity-0 md:group-hover:opacity-100 duration-300"
                                            aria-label="Scroll Left"
                                        >
                                            <ChevronLeft size={24} className="relative -left-0.5" />
                                        </button>

                                        <button
                                            onClick={() => scroll("right")}
                                            className="absolute right-2 md:-right-6 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-white text-secondary p-3 rounded-full shadow-xl border border-gray-100 transition-all active:scale-95 md:opacity-0 md:group-hover:opacity-100 duration-300"
                                            aria-label="Scroll Right"
                                        >
                                            <ChevronRight size={24} className="relative -right-0.5" />
                                        </button>
                                    
<style>{`
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
`}</style>
</>
                                )}

                                <div
                                    ref={scrollContainerRef}
                                    className={`flex items-stretch overflow-x-auto snap-x snap-mandatory gap-6 py-8 px-[7.5vw] md:px-4 -mx-4 md:mx-0 scroll-smooth scrollbar-hide ${isDragging ? "cursor-grabbing snap-none" : "cursor-grab"} ${filteredRooms.length === 1 ? "justify-center" : ""}`}
                                    onScroll={handleScroll}
                                    onMouseDown={handleMouseDown}
                                    onMouseLeave={handleMouseLeave}
                                    onMouseUp={handleMouseUp}
                                    onMouseMove={handleMouseMove}
                                >
                                    {filteredRooms.map((room, index) => (
                                        <div key={room.id} className="w-[85vw] max-w-[340px] md:w-[45%] md:max-w-none lg:w-[32%] flex-shrink-0 snap-center h-full flex flex-col">
                                            <div className={`h-full ${isDragging ? "pointer-events-none" : ""}`}>
                                                <RoomCard
                                                    room={room}
                                                    onSelect={onRoomSelect}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800 mb-2">No Rooms Available</h3>
                                <p className="text-gray-500">
                                    {searchCriteria ? "Try adjusting your dates or guest count." : "Our rooms are currently being updated. Please check back soon!"}
                                </p>
                                {searchCriteria && (
                                    <button onClick={handleClearSearch} className="mt-4 text-primary font-bold hover:underline">View All Rooms</button>
                                )}
                            </div>
                        )}

                        {filteredRooms.length > 0 && (
                            <div className="flex justify-center mt-6 space-x-2">
                                {filteredRooms.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-2 rounded-full transition-all duration-300 ${idx === activeRoomIndex ? "w-8 bg-secondary" : "w-2 bg-gray-300"}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Search Bar - Below Room Cards */}
                        <div className="mt-16">
                            <SearchBar
                                rooms={rooms}
                                onSearch={setSearchCriteria}
                                isEditing={isEditing}
                                buttonText={workingSettings.searchBar?.buttonText}
                                onButtonTextChange={(val) => handleSettingChange("searchBar", "buttonText", val)}
                                buttonColor={workingSettings.searchBar?.buttonColor || ""}
                                onButtonColorChange={(val) => handleSettingChange("searchBar", "buttonColor", val)}
                                buttonTextColor={workingSettings.searchBar?.buttonTextColor}
                                onButtonTextColorChange={(val) => handleSettingChange("searchBar", "buttonTextColor", val)}
                                buttonFontFamily={workingSettings.searchBar?.buttonFontFamily}
                                onButtonFontFamilyChange={(val) => handleSettingChange("searchBar", "buttonFontFamily", val)}
                            />
                        </div>
                    </div>
                </section>


                {/* About/Promo Section - Removed overflow-hidden to prevent clipping absolute popovers */}
                <section id="about" className="py-24 md:py-32 bg-white dark:bg-gray-800 scroll-mt-20 overflow-visible relative">
                    <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2 order-2 md:order-1">
                            <RevealOnScroll className="mb-10 text-center md:text-left">
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-secondary dark:text-white leading-tight">
                                    <div className="flex flex-col md:items-start items-center">
                                        <InlineText
                                            value={workingSettings.about?.title ?? ""}
                                            placeholder="Why Choose"
                                            isEditing={isEditing}
                                            onChange={(val) => handleSettingChange('about', 'title', val)}
                                        />
                                        <span className="text-primary mt-1 font-bold">
                                            <InlineText
                                                value={workingSettings.about?.subtitle ?? ""}
                                                placeholder="Us?"
                                                isEditing={isEditing}
                                                onChange={(val) => handleSettingChange('about', 'subtitle', val)}
                                            />
                                        </span>
                                    </div>
                                </h2>
                            </RevealOnScroll>


                            {isEditing && (
                                <div className="mb-10 flex flex-wrap gap-4 justify-center md:justify-start ring-2 ring-primary/20 p-6 rounded-3xl bg-gray-50 dark:bg-gray-900/50">
                                    <div className="w-full mb-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Feature Management</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newFeatures = [...(workingSettings.about?.features || [])];
                                            newFeatures.push({ title: "New Feature", description: "Describe here..." });
                                            handleSettingChange("about", "features", newFeatures);
                                        }}
                                        className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Add Point
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (!rooms || rooms.length === 0) {
                                                showToast("No rooms found! Add some rooms with amenities first.", "info");
                                                return;
                                            }

                                            const allAmenities = new Set<string>();
                                            rooms.forEach(r => {
                                                if (Array.isArray(r.amenities)) {
                                                    r.amenities.forEach(a => {
                                                        if (typeof a === 'string') allAmenities.add(a);
                                                        else if (a && typeof a === 'object' && a.name) allAmenities.add(a.name);
                                                    });
                                                }
                                            });
                                            
                                            const amenityList = Array.from(allAmenities).slice(0, 6); 
                                            
                                            if (amenityList.length === 0) {
                                                showToast("No amenities found in your rooms! Make sure your rooms have amenities listed.", "error");
                                                return;
                                            }

                                            const DESCRIPTIONS = [
                                                (name: string) => `Enjoy our ${name} facilities, designed for your comfort and absolute relaxation.`,
                                                (name: string) => `Experience our ${name} services, curated to make your stay even more pleasant.`,
                                                (name: string) => `Our ${name} amenities are here to ensure your getaway is as relaxing as possible.`,
                                                (name: string) => `Relax and make use of the ${name} available to you throughout your entire visit.`,
                                                (name: string) => `We've provided ${name} to ensure you have everything you need for a worry-free stay.`,
                                                (name: string) => `Your comfort is our top priority, which is why we include ${name} for all our guests.`
                                            ];

                                            const newFeatures = amenityList.map((name, idx) => {
                                                const lower = name.toLowerCase();
                                                let icon = "star";
                                                if (lower.includes('wifi')) icon = 'wifi';
                                                else if (lower.includes('pool') || lower.includes('water')) icon = 'waves';
                                                else if (lower.includes('security') || lower.includes('safe')) icon = 'shield';
                                                else if (lower.includes('coffee') || lower.includes('breakfast')) icon = 'coffee';
                                                else if (lower.includes('parking') || lower.includes('location')) icon = 'map';
                                                else if (lower.includes('ac') || lower.includes('aircon') || lower.includes('cooling')) icon = 'wind';
                                                else if (lower.includes('food') || lower.includes('cook') || lower.includes('kitchen')) icon = 'chef-hat';
                                                else if (lower.includes('tv') || lower.includes('movie')) icon = 'tv';
                                                else if (lower.includes('gym') || lower.includes('fitness')) icon = 'dumbbell';
                                                
                                                // Cycle through templates or pick at random
                                                const template = DESCRIPTIONS[idx % DESCRIPTIONS.length];
                                                
                                                return {
                                                    title: name,
                                                    description: template(name),
                                                    icon: icon
                                                };
                                            });
                                            
                                            showConfirm({
                                                title: "Sync from Amenities",
                                                message: `Found ${amenityList.length} unique amenities. This will replace your current feature cards. Continue?`,
                                                confirmLabel: "Yes, Sync Now",
                                                onConfirm: () => {
                                                    handleSettingChange("about", "features", newFeatures);
                                                    showToast("Features updated from amenities!", "success");
                                                }
                                            });
                                        }}
                                        className="px-6 py-3 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-105 transition-transform flex items-center gap-2"
                                    >
                                        <Sparkles size={16} /> Sync with Amenities
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-10 md:gap-y-8">
                                {(() => {
                                    const features = workingSettings.about?.features || [
                                        { title: "Handpicked Locations", description: "Every house is verified for quality, view, and comfort to ensure a magical stay." },
                                        { title: "Seamless Booking", description: "Real-time availability calendar, instant confirmation, and secure payments." },
                                        { title: "Exceptional Service", description: "Our dedicated team is always available to assist you, ensuring a smooth and worry-free experience from start to finish." }
                                    ];
                                    return features.map((feature, index) => {
                                        const isLast = index === features.length - 1;
                                        const isOddCount = features.length % 2 !== 0;
                                        const shouldCenter = isLast && isOddCount;

                                        return (
                                            <RevealOnScroll 
                                                key={index} 
                                                delay={100 * (index + 1)} 
                                                width="full" 
                                                className={`${shouldCenter ? "col-span-2 w-full flex justify-center lg:col-span-1" : "w-full"} ${activeIconPicker === index ? 'z-[100]' : ''}`}
                                            > 
                                                <div className={`flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-8 group cursor-default relative ${shouldCenter ? "max-w-xs md:max-w-none" : ""}`}>
                                            {isEditing && (
                                                <button 
                                                    onClick={() => {
                                                        const newFeatures = [...(workingSettings.about?.features || [])];
                                                        newFeatures.splice(index, 1);
                                                        handleSettingChange("about", "features", newFeatures);
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg z-10 hover:scale-110 transition-transform"
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                            
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="relative group/icon">
                                                    <RenderFeatureIcon icon={feature.icon} index={index} />
                                                    {isEditing && (
                                                        <button 
                                                            onClick={() => setActiveIconPicker(activeIconPicker === index ? null : index)}
                                                            className="absolute -bottom-2 right-0 bg-white dark:bg-gray-800 text-primary p-1.5 rounded-full shadow-lg border border-primary/20 hover:scale-110 transition-transform z-20"
                                                            title="Change Icon"
                                                        >
                                                            <Edit size={12} />
                                                        </button>
                                                    )}

                                                    {/* Icon Picker Popover */}
                                                    {isEditing && activeIconPicker === index && (
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 p-3 pb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[110] w-56 animate-fade-in max-h-[300px] overflow-y-auto scrollbar-thin">
                                                            <div className="flex items-center justify-between mb-2 px-1">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Icon</span>
                                                                <button onClick={() => setActiveIconPicker(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-2">
                                                                {ICON_OPTIONS.map((opt) => (
                                                                    <button
                                                                        key={opt.name}
                                                                        onClick={() => {
                                                                            const newFeatures = [...(workingSettings.about?.features || [])];
                                                                            if (!newFeatures[index]) newFeatures[index] = { ...feature };
                                                                            newFeatures[index].icon = opt.name;
                                                                            handleSettingChange("about", "features", newFeatures);
                                                                            setActiveIconPicker(null);
                                                                        }}
                                                                        className={`p-2 rounded-lg flex items-center justify-center transition-all ${feature.icon === opt.name ? 'bg-primary/20 text-primary ring-1 ring-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'}`}
                                                                        title={opt.name}
                                                                    >
                                                                        <opt.icon size={16} />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            
                                                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                                <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1 px-1">Custom Image URL</label>
                                                                <input 
                                                                    type="text"
                                                                    placeholder="https://..."
                                                                    className="text-[10px] w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 outline-none focus:border-primary"
                                                                    value={feature.icon?.startsWith('http') ? feature.icon : ''}
                                                                    onChange={(e) => {
                                                                        const newFeatures = [...(workingSettings.about?.features || [])];
                                                                        if (!newFeatures[index]) newFeatures[index] = { ...feature };
                                                                        newFeatures[index].icon = e.target.value;
                                                                        handleSettingChange("about", "features", newFeatures);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 text-center md:text-left">
                                                <h4 className="font-bold text-secondary dark:text-white text-sm sm:text-base md:text-2xl lg:text-3xl font-black mb-1 sm:mb-2 md:mb-4 tracking-tight">
                                                    <InlineText
                                                        value={feature.title}
                                                        isEditing={isEditing}
                                                        onChange={(val) => {
                                                            const newFeatures = [...(workingSettings.about?.features || [])];
                                                            if (!newFeatures[index]) newFeatures[index] = { ...feature };
                                                            newFeatures[index].title = val;
                                                            handleSettingChange("about", "features", newFeatures);
                                                        }}
                                                    />
                                                </h4>
                                                <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs md:text-base lg:text-lg leading-relaxed font-medium line-clamp-3 md:line-clamp-none">
                                                    <InlineText
                                                        value={feature.description}
                                                        isEditing={isEditing}
                                                        onChange={(val) => {
                                                            const newFeatures = [...(workingSettings.about?.features || [])];
                                                            if (!newFeatures[index]) newFeatures[index] = { ...feature };
                                                            newFeatures[index].description = val;
                                                            handleSettingChange("about", "features", newFeatures);
                                                        }}
                                                        multiline
                                                    />
                                                </p>
                                            </div>
                                        </div>
                                    </RevealOnScroll>
                                );
                            });
                        })()}
                    </div>
                        </div>

                        <div className="md:w-1/2 relative w-full h-80 md:h-[600px] order-1 md:order-2">
                            <RevealOnScroll delay={300} className="h-full w-full">
                                <div className="absolute -inset-4 bg-accent/20 rounded-full blur-3xl z-0 animate-pulse-slow"></div>

                                                                {/* Dynamic Room Mosaic Gallery */}
                                {(() => {
                                    const isInheriting = workingSettings.about?.inheritGallery !== false;
                                    const customImages = (workingSettings.about?.images || []).filter(img => img && img.trim() !== "");
                                    const customPositions = workingSettings.about?.imagePositions || [];
                                    
                                    const layoutType = (workingSettings.about?.layoutType || 'mosaic') as keyof typeof LAYOUT_CONFIGS;
                                    const layout = LAYOUT_CONFIGS[layoutType] || LAYOUT_CONFIGS.mosaic;
                                    
                                    return (
                                        <div 
                                            className={`relative w-full h-full grid gap-3 md:gap-4 group ${layout.gridClass}`}
                                        >
                                            {layout.frames.map((frame, idx) => {
                                                const imgUrl = displayGalleryImages[idx % displayGalleryImages.length];
                                                const pos = customImages.length > 0 && customPositions[idx % displayGalleryImages.length] ? customPositions[idx % displayGalleryImages.length] : '50% 50%';
                                                const scale = workingSettings.about?.imageScales?.[idx % displayGalleryImages.length] || 1;

                                                return (
                                                    <div 
                                                        key={`${layoutType}-${idx}`}
                                                        className={`${frame.className} relative cursor-pointer group/frame-wrapper`}
                                                        onClick={(e) => {
                                                            if (isEditing) {
                                                                e.stopPropagation();
                                                                setTempInheritGallery(isInheriting);
                                                                setTempGalleryImages(customImages.length > 0 ? customImages : [...displayGalleryImages]);
                                                                setTempGalleryPositions([...customPositions]);
                                                                setTempGalleryScales([...(workingSettings.about?.imageScales || [])]);
                                                                setTempLayoutType(layoutType);
                                                                setShowGalleryManager(true);
                                                            } else {
                                                                setActiveAboutSlide(idx % displayGalleryImages.length);
                                                                setShowAboutLightbox(true);
                                                            }
                                                        }}
                                                    >
                                                        <GalleryFrame 
                                                            src={imgUrl}
                                                            alt={`Gallery ${idx + 1}`}
                                                            isEditing={isEditing}
                                                            className="h-full w-full"
                                                            objectPosition={pos}
                                                            scale={scale}
                                                            onPositionChange={(newPos) => {
                                                                const newPositions = [...customPositions];
                                                                while (newPositions.length <= idx) newPositions.push('50% 50%');
                                                                newPositions[idx] = newPos;
                                                                handleSettingChange('about', 'imagePositions', newPositions);
                                                            }}
                                                        />
                                                        {!isEditing && (
                                                            <div className="absolute inset-0 bg-black/0 group-hover/frame-wrapper:bg-black/10 transition-colors rounded-3xl flex items-center justify-center opacity-0 group-hover/frame-wrapper:opacity-100">
                                                                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white shadow-xl transform scale-90 group-hover/frame-wrapper:scale-100 transition-all">
                                                                    <Maximize size={20} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Manage Gallery Overlay - ONLY in Edit Mode */}
                                            {isEditing && (
                                                <button 
                                                    className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTempInheritGallery(isInheriting);
                                                        setTempGalleryImages(customImages.length > 0 ? customImages : [...displayGalleryImages]);
                                                        setTempGalleryPositions([...customPositions]);
                                                        setTempGalleryScales([...(workingSettings.about?.imageScales || [])]);
                                                        setTempLayoutType(layoutType);
                                                        setShowGalleryManager(true);
                                                    }}
                                                >
                                                    <div className="bg-primary px-6 py-3 rounded-xl shadow-xl flex items-center text-white font-bold transform translate-y-4 hover:translate-y-0 transition-all">
                                                        <ImageIcon size={20} className="mr-2" /> Manage Gallery & Layout
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()}
                            </RevealOnScroll>
                        </div>
                    </div>                    {/* About Lightbox Modal */}
                    {showAboutLightbox && (() => {
                        return (
                            <div
                                className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fade-in"
                                onClick={() => setShowAboutLightbox(false)}
                                onTouchStart={onTouchStart}
                                onTouchMove={onTouchMove}
                                onTouchEnd={onTouchEnd}
                                onKeyDown={(e) => {
                                    if (e.key === 'ArrowLeft') setActiveAboutSlide(prev => (prev - 1 + displayGalleryImages.length) % displayGalleryImages.length);
                                    if (e.key === 'ArrowRight') setActiveAboutSlide(prev => (prev + 1) % displayGalleryImages.length);
                                    if (e.key === 'Escape') setShowAboutLightbox(false);
                                }}
                            >
                                {/* Close Button - Separate from main area to ensure it's clickable */}
                                <button
                                    onClick={() => setShowAboutLightbox(false)}
                                    className="absolute top-4 right-4 z-[110] p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                                >
                                    <X size={24} />
                                </button>

                                <div className="flex-1 flex items-center justify-center p-0 md:p-4 relative" onClick={(e) => e.stopPropagation()}>
                                    {/* Left Arrow (Desktop Only) */}
                                    <button
                                        className="hidden md:flex absolute left-8 z-[110] p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all transform hover:scale-110"
                                        onClick={(e) => { e.stopPropagation(); setActiveAboutSlide(prev => (prev - 1 + displayGalleryImages.length) % displayGalleryImages.length); }}
                                    >
                                        <ChevronLeft size={32} />
                                    </button>

                                    {/* Right Arrow (Desktop Only) */}
                                    <button
                                        className="hidden md:flex absolute right-8 z-[110] p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all transform hover:scale-110"
                                        onClick={(e) => { e.stopPropagation(); setActiveAboutSlide(prev => (prev + 1) % displayGalleryImages.length); }}
                                    >
                                        <ChevronRight size={32} />
                                    </button>

                                    {/* Carousel Content */}
                                    <div className="w-full max-w-5xl aspect-[4/3] md:aspect-video relative overflow-hidden flex items-center justify-center">
                                        {displayGalleryImages.map((img, i) => {
                                            const len = displayGalleryImages.length;
                                            const forwardDiff = (i - activeAboutSlide + len) % len;
                                            const backwardDiff = (activeAboutSlide - i + len) % len;
                                            
                                            let positionClass = '';
                                            if (i === activeAboutSlide) {
                                                positionClass = 'opacity-100 translate-x-0 scale-100 z-10';
                                            } else if (forwardDiff <= backwardDiff) {
                                                positionClass = 'opacity-0 translate-x-full scale-95 z-0';
                                            } else {
                                                positionClass = 'opacity-0 -translate-x-full scale-95 z-0';
                                            }

                                            return (
                                                <div
                                                    key={i}
                                                    className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out transform ${positionClass}`}
                                                >
                                                    <img
                                                    src={img}
                                                    alt={`Gallery large ${i + 1}`}
                                                    className="max-h-full max-w-full object-contain shadow-2xl rounded-sm sm:rounded-xl"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        );
                                        })}
                                    </div>
                                </div>

                                {/* Indicators and Info area */}
                                <div className="p-6 bg-gradient-to-t from-black to-transparent text-white" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 max-w-4xl mx-auto">
                                        <div>
                                            <h3 className="text-xl font-bold font-serif mb-1">{workingSettings.siteName || "Experience Our Resort"}</h3>
                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold font-mono">
                                                    {(activeAboutSlide % displayGalleryImages.length) + 1} / {displayGalleryImages.length}
                                                </div>
                                                <span className="hidden md:inline">Swipe or use arrows to navigate</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin touch-pan-x touch-pan-y touch-manipulation select-none" style={{ touchAction: 'pan-x pan-y' }}>
                                            {displayGalleryImages.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setActiveAboutSlide(i)}
                                                    className={`h-1.5 transition-all duration-300 rounded-full ${i === activeAboutSlide ? 'w-8 bg-primary' : 'w-2 bg-white/20'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Gallery Manager Modal */}
                    {showGalleryManager && (
                        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowGalleryManager(false)}>
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                                    <h3 className="text-xl font-bold flex items-center dark:text-white">
                                        <ImageIcon className="mr-2 text-primary" size={20} /> Manage Gallery
                                    </h3>
                                    <button onClick={() => setShowGalleryManager(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                        ✕
                                    </button>
                                </div>
                                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                                    
                                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-black text-xs uppercase tracking-widest text-primary mb-1 flex items-center gap-2">
                                                <RotateCcw size={14} /> Auto-Sync Room Gallery
                                            </h4>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                {tempInheritGallery 
                                                    ? "Currently pulling photos from your Room list automatically." 
                                                    : "Currently using a Custom Gallery. Manual control enabled."}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => setTempInheritGallery(!tempInheritGallery)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${tempInheritGallery ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-gray-200 dark:bg-gray-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${tempInheritGallery ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {/* Layout Picker */}
                                    <div className="pt-2">
                                        <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-3">Choose Gallery Style</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                            {Object.entries(LAYOUT_CONFIGS).map(([key, config]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setTempLayoutType(key)}
                                                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${tempLayoutType === key ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50'}`}
                                                >
                                                    <div className={`w-8 h-8 rounded border-2 border-dashed ${tempLayoutType === key ? 'border-primary' : 'border-gray-300 dark:border-gray-600'} flex items-center justify-center`}>
                                                        <Layout size={14} className={tempLayoutType === key ? 'text-primary' : 'text-gray-400'} />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-center leading-tight dark:text-gray-300">{config.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <h4 className="font-bold text-gray-800 dark:text-white mb-4 uppercase text-xs tracking-wider">
                                            {tempInheritGallery ? 'Inherited Room Images (Read-Only)' : 'Custom Gallery Images'}
                                        </h4>
                                                                          {(tempInheritGallery ? roomGalleryImages : tempGalleryImages).map((imgUrl, idx) => {
                                            const xPos = tempGalleryPositions[idx] ? parseInt(tempGalleryPositions[idx].split('%')[0]) : 50;
                                            const yPos = tempGalleryPositions[idx] ? parseInt(tempGalleryPositions[idx].split('%')[1]) : 50;
                                            const scale = tempGalleryScales[idx] || 1;

                                            return (
                                                <div key={idx} className="bg-white dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm relative group mb-4">
                                                    <div className="flex flex-col sm:flex-row gap-4">
                                                        {/* Interactive Preview Frame */}
                                                        <div className="w-full sm:w-48 h-32 flex-shrink-0">
                                                            <GalleryFrame 
                                                                src={imgUrl} 
                                                                alt={`Frame ${idx + 1}`} 
                                                                isEditing={true}
                                                                objectPosition={tempGalleryPositions[idx] || '50% 50%'}
                                                                scale={scale}
                                                                onPositionChange={(newPos) => {
                                                                    const newPosArr = [...tempGalleryPositions];
                                                                    // Pad if needed
                                                                    while (newPosArr.length <= idx) newPosArr.push('50% 50%');
                                                                    newPosArr[idx] = newPos;
                                                                    setTempGalleryPositions(newPosArr);
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="flex-1 space-y-4">
                                                            {!tempInheritGallery && (
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Image URL</label>
                                                                    <input 
                                                                        type="text" 
                                                                        value={imgUrl} 
                                                                        onChange={(e) => {
                                                                            const newImgs = [...tempGalleryImages];
                                                                            newImgs[idx] = e.target.value;
                                                                            setTempGalleryImages(newImgs);
                                                                        }}
                                                                        placeholder="https://..."
                                                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
                                                                    />
                                                                </div>
                                                            )}

                                                            <div>
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <label className="text-[10px] font-black uppercase text-gray-400">Zoom Level</label>
                                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{Math.round(scale * 100)}%</span>
                                                                </div>
                                                                <input 
                                                                    type="range" 
                                                                    min="1" max="3" step="0.1"
                                                                    value={scale}
                                                                    onChange={(e) => {
                                                                        const newScales = [...tempGalleryScales];
                                                                        while (newScales.length <= idx) newScales.push(1);
                                                                        newScales[idx] = parseFloat(e.target.value);
                                                                        setTempGalleryScales(newScales);
                                                                    }}
                                                                    className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                                                />
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-3 text-gray-400 italic text-[10px]">
                                                                <Move size={12} />
                                                                Tip: Drag the image on the left to center it
                                                            </div>
                                                        </div>

                                                        {!tempInheritGallery && (
                                                            <button 
                                                                onClick={() => {
                                                                    const newImgs = [...tempGalleryImages];
                                                                    const newPos = [...tempGalleryPositions];
                                                                    const newScales = [...tempGalleryScales];
                                                                    newImgs.splice(idx, 1);
                                                                    newPos.splice(idx, 1);
                                                                    newScales.splice(idx, 1);
                                                                    setTempGalleryImages(newImgs);
                                                                    setTempGalleryPositions(newPos);
                                                                    setTempGalleryScales(newScales);
                                                                }}
                                                                className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 text-red-500 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all border border-gray-100 dark:border-gray-700"
                                                                title="Remove Frame"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {!tempInheritGallery && (
                                            <button 
                                                onClick={() => {
                                                    setTempGalleryImages([...tempGalleryImages, ""]);
                                                    setTempGalleryPositions([...tempGalleryPositions, "50% 50%"]);
                                                    setTempGalleryScales([...tempGalleryScales, 1]);
                                                }}
                                                className="mt-2 w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-gray-500 dark:text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all font-bold flex flex-col items-center"
                                            >
                                                <Plus size={24} className="mb-2" />
                                                Add New Frame
                                            </button>
                                        )}
                                        {tempInheritGallery && roomGalleryImages.length === 0 && (
                                             <div className="text-center p-6 text-gray-400">
                                                 No room images found. It will display demo images automatically.
                                             </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end space-x-3">
                                    <button onClick={() => setShowGalleryManager(false)} className="px-5 py-2 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">Cancel</button>
                                    <button onClick={() => {
                                        handleSettingChange('about', 'inheritGallery', tempInheritGallery);
                                        handleSettingChange('about', 'images', tempGalleryImages.filter(u => u.trim() !== ""));
                                        handleSettingChange('about', 'imagePositions', tempGalleryPositions);
                                        handleSettingChange('about', 'imageScales', tempGalleryScales);
                                        handleSettingChange('about', 'layoutType', tempLayoutType);
                                        setShowGalleryManager(false);
                                    }} className="px-5 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover shadow-md transition">Apply Changes</button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Location Section with Google Maps Embed */}
                <section id="contact" className="py-20 bg-gray-50 dark:bg-gray-900 scroll-mt-20">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <RevealOnScroll>
                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary dark:text-white mb-4">
                                <InlineText
                                    value={workingSettings.contact?.title ?? ""}
                                    placeholder="Our Location"
                                    isEditing={isEditing}
                                    onChange={(val) => handleSettingChange('contact', 'title', val)}
                                />
                            </h2>
                            <p className="text-gray-500 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                                <InlineText
                                    value={workingSettings.contact?.description ?? ""}
                                    placeholder="Visit our primary office or book a stay at one of our premium properties. We're here to make your experience unforgettable."
                                    isEditing={isEditing}
                                    onChange={(val) => handleSettingChange('contact', 'description', val)}
                                    multiline
                                />
                            </p>
                        </RevealOnScroll>

                        <RevealOnScroll delay={200}>
                            <div className="w-full h-96 md:h-[500px] rounded-3xl overflow-hidden shadow-xl border-4 border-white relative group">
                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 md:p-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm overflow-y-auto">
                                        <h3 className="text-white text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center gap-2">
                                            <MapPin className="w-5 h-5 md:w-6 md:h-6" /> Edit Google Map 
                                        </h3>
                                        <div className="w-full max-w-2xl bg-white/10 p-4 md:p-6 rounded-2xl border border-white/20 backdrop-blur-md">
                                            <label className="block text-xs md:text-sm font-medium text-gray-200 mb-1.5 md:mb-2">Google Maps Embed URL (src link)</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-black mb-3 md:mb-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                placeholder="https://www.google.com/maps/embed?..."
                                                value={workingSettings.map?.embedUrl || ''}
                                                onChange={(e) => handleSettingChange('map', 'embedUrl', e.target.value)}
                                            />
                                            <div className="bg-black/30 p-3 md:p-4 rounded-xl flex gap-2.5 md:gap-3 text-[11px] md:text-sm text-gray-300">
                                                <Info className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0 mt-0.5" />
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="mb-2 leading-relaxed">
                                                        Go to Google Maps → Share → Embed a map → Copy HTML. <br className="hidden md:block"/>
                                                        Extract only the URL inside the <code className="text-primary bg-primary/10 px-1 rounded mx-0.5">src="..."</code>.
                                                    </p>
                                                    <div className="bg-black/40 p-2.5 md:p-3 rounded-lg text-[10px] font-mono mb-2 overflow-x-auto whitespace-nowrap border border-white/10 scrollbar-hide">
                                                        <span className="text-gray-500">&lt;iframe src="</span><span className="text-green-400">https://www.google.com/maps/embed?pb=...</span><span className="text-gray-500">" ...&gt;</span>
                                                    </div>
                                                    <a 
                                                        href="https://www.google.com/maps" 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold transition-all shadow-lg active:scale-95 mt-1 no-underline text-[10px] md:text-xs"
                                                    >
                                                        <ExternalLink size={12} className="md:w-3.5 md:h-3.5" /> Open Google Maps
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <iframe
                                    src={workingSettings.map?.embedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125181.43388055636!2d119.34637195647923!3d11.224378310234497!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33b7accd159567c7%3A0x64464a2a15c2823!2sEl%20Nido%2C%20Palawan!5e0!3m2!1sen!2sph!4v1709536251859!5m2!1sen!2sph"}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen={true}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Serenity Staycation Location"
                                    className={isEditing ? 'pointer-events-none' : ''}
                                ></iframe>
                            </div>
                        </RevealOnScroll>
                    </div>
                </section>


                <Footer
                    settings={workingSettings}
                    isEditing={isEditing}
                    onSettingChange={handleSettingChange}
                    onAdminEnter={onAdminEnter}
                />
                <AiChatWrapper />
            </div>

            {isEditing && (
                <BuilderToolbar
                    isEditing={isEditing}
                    onToggleEdit={() => setIsEditing(true)}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    hasChanges={hasChanges}
                    settings={workingSettings}
                    onUpdateSettings={handleSettingChange}
                    isMinimized={isBuilderMinimized}
                    onToggleMinimize={setIsBuilderMinimized}
                    onLogout={onExitAdmin}
                />
            )
            }
        </>
    );
};

export default LandingPage;
