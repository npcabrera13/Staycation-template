import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import Navbar from './Navbar';
import Footer from './Footer';
import RoomCard from './RoomCard';
import AIChat from './AIChat';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import RevealOnScroll from './RevealOnScroll';
import SearchBar from './SearchBar';
import { Room, Booking, Settings } from '../types';
import { ChevronLeft, ChevronRight, MapPin, AlertCircle, Loader, Phone, Mail, Facebook, Instagram, Music } from 'lucide-react';
import { COMPANY_INFO } from '../constants';
import InlineText from './Builder/InlineText';
import InlineImage from './Builder/InlineImage';
import BuilderToolbar from './Builder/BuilderToolbar';

// Wrapper that only shows AI chat when enabled in SuperAdmin settings
const AiChatWrapper: React.FC = () => {
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        const check = async () => {
            try {
                const snap = await getDoc(doc(db, '_superadmin', 'settings'));
                if (snap.exists() && snap.data().enableAiChat === true) setEnabled(true);
            } catch { }
        };
        check();
    }, []);
    if (!enabled) return null;
    return <AIChat />;
};
import { DEFAULT_SETTINGS } from '../services/settingsService';

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
    onEditingStarted
}) => {
    const [activeRoomIndex, setActiveRoomIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Builder State
    const [isEditing, setIsEditing] = useState(false);
    const [workingSettings, setWorkingSettings] = useState<Settings>(settings || DEFAULT_SETTINGS);
    const [hasChanges, setHasChanges] = useState(false);
    const [activeHeroSlide, setActiveHeroSlide] = useState(0);
    const [activeAboutSlide, setActiveAboutSlide] = useState(0);
    const [showAboutLightbox, setShowAboutLightbox] = useState(false);
    const [isBuilderMinimized, setIsBuilderMinimized] = useState(false);
    const { showConfirm } = useNotification();

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

    const handleSettingChange = (section: keyof Settings, field: string, value: any) => {
        setWorkingSettings(prev => {
            const updated = { ...prev };
            if (typeof updated[section] === 'object' && updated[section] !== null) {
                (updated[section] as any)[field] = value;
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
                const roomBookings = bookings.filter(b => b.roomId === room.id && b.status !== 'cancelled');

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
        // Small timeout ensures that if we were dragging, we clear the state,
        // but we don't block immediate clicks if we weren't dragging.
        setTimeout(() => setIsDragging(false), 50);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDown.current || !scrollContainerRef.current) return;
        e.preventDefault();
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
                    onSettingChange={handleSettingChange}
                />
                {/* Hero Section */}
                <div id="hero" className="relative h-[100vh] min-h-[600px] bg-secondary text-white overflow-hidden scroll-mt-20">
                    <div className="absolute inset-0">
                        {/* Get valid images array */}
                        {(() => {
                            const validImages = (workingSettings.hero?.images || [workingSettings.hero?.image]).filter(img => img && img.trim() !== '' && img.includes('http'));

                            if (validImages.length === 0) {
                                // No valid images - show default
                                return (
                                    <div className="absolute inset-0">
                                        <InlineImage
                                            src={DEFAULT_SETTINGS.hero.image}
                                            alt="Hero Background"
                                            isEditing={false}
                                            className="w-full h-full object-cover"
                                            style={{ objectPosition: 'center' }}
                                        />
                                    </div>
                                );
                            }

                            if (validImages.length === 1) {
                                // Single image - no carousel
                                return (
                                    <div className="absolute inset-0">
                                        <InlineImage
                                            src={validImages[0]}
                                            alt="Hero Background"
                                            isEditing={false}
                                            className="w-full h-full object-cover"
                                            style={{ objectPosition: workingSettings.hero?.imagePosition || 'center' }}
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
                                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                    >
                                        <InlineImage
                                            src={img}
                                            alt={`Hero Background ${index + 1}`}
                                            isEditing={false}
                                            className="w-full h-full object-cover"
                                            style={{ objectPosition: workingSettings.hero?.imagePosition || 'center' }}
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
                                {settings?.siteName || "Welcome to Paradise"}
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
                            {isEditing ? (
                                <div className="inline-flex items-center bg-accent text-secondary px-10 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-primary transition-all duration-300 transform hover:scale-105 shadow-2xl group cursor-default">
                                    <InlineText
                                        value={workingSettings.hero?.ctaText ?? ""}
                                        placeholder="Explore Rooms"
                                        isEditing={isEditing}
                                        onChange={(val) => handleSettingChange('hero', 'ctaText', val)}
                                        className="whitespace-nowrap"
                                    />
                                    <span className="ml-2 group-hover:translate-y-1 transition-transform">↓</span>
                                </div>
                            ) : (
                                <a
                                    href="#rooms"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="inline-flex items-center bg-accent text-secondary px-10 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-primary transition-all duration-300 transform hover:scale-105 shadow-2xl group cursor-pointer"
                                >
                                    {workingSettings.hero?.ctaText || "Explore Rooms"}
                                    <span className="ml-2 group-hover:translate-y-1 transition-transform">↓</span>
                                </a>
                            )}
                        </RevealOnScroll>
                    </div>
                </div>

                {/* Rooms Section */}
                <section id="rooms" className="py-24 md:py-32 bg-surface dark:bg-gray-900 relative overflow-hidden scroll-mt-10">
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
                                <h2 className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-6">
                                    <InlineText
                                        value={workingSettings.roomsSection?.title ?? ""}
                                        placeholder="Our Exclusive Rooms"
                                        isEditing={isEditing}
                                        onChange={(val) => handleSettingChange('roomsSection', 'title', val)}
                                    />
                                </h2>
                                <div className="w-24 h-1 bg-accent mx-auto mb-8 rounded-full"></div>

                                {searchCriteria ? (
                                    <div className="flex flex-col items-center animate-fade-in">
                                        <p className="text-gray-600 text-lg mb-4">
                                            Showing {filteredRooms.length} room{filteredRooms.length !== 1 && 's'} available for{' '}
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
                                    <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-light">
                                        <InlineText
                                            value={workingSettings.features?.description ?? ""}
                                            placeholder="From beachfront villas to cozy mountain cabins, each property is designed to provide the ultimate relaxation experience."
                                            isEditing={isEditing}
                                            onChange={(val) => handleSettingChange('features', 'description', val)}
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
                                            onClick={() => scroll('left')}
                                            className="absolute left-2 md:-left-6 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-white text-secondary p-3 rounded-full shadow-xl border border-gray-100 transition-all active:scale-95 md:opacity-0 md:group-hover:opacity-100 duration-300"
                                            aria-label="Scroll Left"
                                        >
                                            <ChevronLeft size={24} className="relative -left-0.5" />
                                        </button>

                                        <button
                                            onClick={() => scroll('right')}
                                            className="absolute right-2 md:-right-6 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-white text-secondary p-3 rounded-full shadow-xl border border-gray-100 transition-all active:scale-95 md:opacity-0 md:group-hover:opacity-100 duration-300"
                                            aria-label="Scroll Right"
                                        >
                                            <ChevronRight size={24} className="relative -right-0.5" />
                                        </button>
                                    </>
                                )}

                                <div
                                    ref={scrollContainerRef}
                                    className={`flex items-stretch overflow-x-auto snap-x snap-mandatory gap-6 py-8 px-[7.5vw] md:px-4 -mx-4 md:mx-0 scroll-smooth touch-pan-y scrollbar-hide ${isDragging ? 'cursor-grabbing snap-none' : 'cursor-grab'}`}
                                    onScroll={handleScroll}
                                    onMouseDown={handleMouseDown}
                                    onMouseLeave={handleMouseLeave}
                                    onMouseUp={handleMouseUp}
                                    onMouseMove={handleMouseMove}
                                >
                                    {filteredRooms.map((room, index) => (
                                        <div key={room.id} className="w-[85vw] max-w-[340px] md:w-[45%] md:max-w-none lg:w-[32%] flex-shrink-0 snap-center h-full flex flex-col">
                                            {/* Pointer events none only applied when actively dragging to prevent accidental clicks */}
                                            <div className={`h-full ${isDragging ? "pointer-events-none" : ""}`}>
                                                <RoomCard room={room} onSelect={onRoomSelect} />
                                            </div>
                                        </div>
                                    ))}

                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                                <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
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
                                        className={`h-2 rounded-full transition-all duration-300 ${idx === activeRoomIndex
                                            ? 'w-8 bg-secondary'
                                            : 'w-2 bg-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Search Bar - Below Room Cards */}
                        <div className="mt-16">
                            <SearchBar rooms={rooms} onSearch={setSearchCriteria} />
                        </div>

                    </div>
                </section>

                {/* About/Promo Section */}
                <section id="about" className="py-24 md:py-32 bg-white dark:bg-gray-800 overflow-hidden scroll-mt-10">
                    <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2">
                            <RevealOnScroll>
                                <h2 className="text-4xl md:text-5xl font-serif font-bold text-secondary dark:text-white mb-8 leading-tight">
                                    <InlineText
                                        value={workingSettings.about?.title ?? ""}
                                        placeholder="Why Choose"
                                        isEditing={isEditing}
                                        onChange={(val) => handleSettingChange('about', 'title', val)}
                                    /> <br />
                                    <span className="text-primary">
                                        <InlineText
                                            value={workingSettings.about?.subtitle ?? ""}
                                            placeholder="Serenity?"
                                            isEditing={isEditing}
                                            onChange={(val) => handleSettingChange('about', 'subtitle', val)}
                                        />
                                    </span>
                                </h2>
                            </RevealOnScroll>

                            <div className="space-y-10">
                                {(workingSettings.about?.features || [
                                    { title: "Handpicked Locations", description: "Every house is verified for quality, view, and comfort to ensure a magical stay." },
                                    { title: "Seamless Booking", description: "Real-time availability calendar, instant confirmation, and secure payments." },
                                    { title: "24/7 Concierge", description: "Our AI concierge and support team are always here to help you plan your trip." }
                                ]).map((feature, index) => (
                                    <RevealOnScroll key={index} delay={200 * (index + 1)}>
                                        <div className="flex items-start group">
                                            <div className="bg-surface dark:bg-gray-700 p-4 rounded-2xl mr-6 text-primary font-bold text-xl group-hover:bg-primary group-hover:text-white transition-colors duration-500 shadow-sm">0{index + 1}</div>
                                            <div>
                                                <h4 className="font-bold text-secondary dark:text-white text-xl mb-2">
                                                    <InlineText
                                                        value={feature.title}
                                                        isEditing={isEditing}
                                                        onChange={(val) => {
                                                            const newFeatures = [...(workingSettings.about?.features || [])];
                                                            if (!newFeatures[index]) newFeatures[index] = { title: feature.title, description: feature.description };
                                                            newFeatures[index].title = val;
                                                            handleSettingChange('about', 'features', newFeatures);
                                                        }}
                                                    />
                                                </h4>
                                                <p className="text-gray-500 dark:text-gray-300 leading-relaxed">
                                                    <InlineText
                                                        value={feature.description}
                                                        isEditing={isEditing}
                                                        onChange={(val) => {
                                                            const newFeatures = [...(workingSettings.about?.features || [])];
                                                            if (!newFeatures[index]) newFeatures[index] = { title: feature.title, description: feature.description };
                                                            newFeatures[index].description = val;
                                                            handleSettingChange('about', 'features', newFeatures);
                                                        }}
                                                        multiline
                                                    />
                                                </p>
                                            </div>
                                        </div>
                                    </RevealOnScroll>
                                ))}
                            </div>
                        </div>

                        <div className="md:w-1/2 relative w-full h-96 md:h-[600px] mt-12 md:mt-0">
                            <RevealOnScroll delay={300} className="h-full w-full">
                                <div className="absolute -inset-4 bg-accent/20 rounded-full blur-3xl z-0 animate-pulse-slow"></div>

                                {/* About Image Carousel */}
                                {(() => {
                                    const aboutImages = [
                                        workingSettings.about?.image,
                                        ...(workingSettings.about?.images || [])
                                    ].filter(img => img && img.trim() !== '');

                                    if (aboutImages.length === 0) {
                                        return (
                                            <InlineImage
                                                src="https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                                alt="About Section"
                                                isEditing={isEditing}
                                                onChange={(url) => handleSettingChange('about', 'image', url)}
                                                className="w-full h-full object-cover rounded-3xl shadow-2xl relative z-10"
                                            />
                                        );
                                    }

                                    return (
                                        <div className="relative w-full h-full group">
                                            {/* Main Image */}
                                            <div
                                                className="w-full h-full cursor-pointer relative overflow-hidden rounded-3xl shadow-2xl z-10"
                                                onClick={() => !isEditing && setShowAboutLightbox(true)}
                                            >
                                                {aboutImages.map((img, index) => (
                                                    <div
                                                        key={index}
                                                        className={`absolute inset-0 transition-opacity duration-500 ${index === activeAboutSlide ? 'opacity-100' : 'opacity-0'}`}
                                                    >
                                                        {isEditing && index === 0 ? (
                                                            <InlineImage
                                                                src={img}
                                                                alt={`About ${index + 1}`}
                                                                isEditing={isEditing}
                                                                onChange={(url) => handleSettingChange('about', 'image', url)}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <img
                                                                src={img}
                                                                alt={`About ${index + 1}`}
                                                                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-1000"
                                                            />
                                                        )}
                                                    </div>
                                                ))}

                                                {/* Zoom hint overlay */}
                                                {!isEditing && aboutImages.length > 0 && (
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <span className="bg-white/90 text-gray-800 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                                                            🔍 Click to Zoom
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Carousel Arrows */}
                                            {aboutImages.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveAboutSlide(prev => (prev - 1 + aboutImages.length) % aboutImages.length);
                                                        }}
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <ChevronLeft size={24} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveAboutSlide(prev => (prev + 1) % aboutImages.length);
                                                        }}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <ChevronRight size={24} />
                                                    </button>
                                                </>
                                            )}

                                            {/* Dots Indicator */}
                                            {aboutImages.length > 1 && (
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                                                    {aboutImages.map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveAboutSlide(idx);
                                                            }}
                                                            className={`h-2 rounded-full transition-all ${idx === activeAboutSlide ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </RevealOnScroll>
                        </div>
                    </div>

                    {/* About Lightbox Modal */}
                    {showAboutLightbox && (() => {
                        const aboutImages = [
                            workingSettings.about?.image,
                            ...(workingSettings.about?.images || [])
                        ].filter(img => img && img.trim() !== '');

                        return (
                            <div
                                className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-fade-in"
                                onClick={() => setShowAboutLightbox(false)}
                            >
                                <button
                                    onClick={() => setShowAboutLightbox(false)}
                                    className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-10"
                                >
                                    ✕
                                </button>

                                {/* Navigation arrows */}
                                {aboutImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveAboutSlide(prev => (prev - 1 + aboutImages.length) % aboutImages.length);
                                            }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
                                        >
                                            <ChevronLeft size={32} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveAboutSlide(prev => (prev + 1) % aboutImages.length);
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
                                        >
                                            <ChevronRight size={32} />
                                        </button>
                                    </>
                                )}

                                <img
                                    src={aboutImages[activeAboutSlide]}
                                    alt="About Full Size"
                                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                />

                                {/* Image counter */}
                                {aboutImages.length > 1 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 bg-black/50 px-4 py-2 rounded-full text-sm">
                                        {activeAboutSlide + 1} / {aboutImages.length}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </section>

                {/* Location Section with Google Maps Embed */}
                <section id="contact" className="py-20 bg-gray-50 dark:bg-gray-900 scroll-mt-10">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <RevealOnScroll>
                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary dark:text-white mb-4">
                                <InlineText
                                    value={workingSettings.contact?.title ?? ""}
                                    placeholder="Find Us in Paradise"
                                    isEditing={isEditing}
                                    onChange={(val) => handleSettingChange('contact', 'title', val)}
                                />
                            </h2>
                            <p className="text-gray-500 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                                <InlineText
                                    value={workingSettings.contact?.description ?? ""}
                                    placeholder="Located in the heart of the Philippines' most beautiful islands. Visit our main office or book a stay at one of our exclusive properties."
                                    isEditing={isEditing}
                                    onChange={(val) => handleSettingChange('contact', 'description', val)}
                                    multiline
                                />
                            </p>
                        </RevealOnScroll>

                        <RevealOnScroll delay={200}>
                            <div className="w-full h-96 md:h-[500px] rounded-3xl overflow-hidden shadow-xl border-4 border-white relative">
                                <iframe
                                    src={settings?.map?.embedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125181.43388055636!2d119.34637195647923!3d11.224378310234497!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33b7accd159567c7%3A0x64464a2a15c2823!2sEl%20Nido%2C%20Palawan!5e0!3m2!1sen!2sph!4v1709536251859!5m2!1sen!2sph"}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen={true}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Serenity Staycation Location"
                                ></iframe>
                            </div>
                        </RevealOnScroll>
                    </div>
                </section >

                <Footer
                    settings={workingSettings}
                    isEditing={isEditing}
                    onSettingChange={handleSettingChange}
                    onAdminEnter={onAdminEnter}
                />
                <AiChatWrapper />
            </div >

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
