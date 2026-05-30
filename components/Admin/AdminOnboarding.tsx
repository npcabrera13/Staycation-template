import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
    X, CreditCard, Palette, Rocket, CheckCircle2, ArrowRight, ArrowLeft, 
    MapPin, Sparkles, Trophy, Facebook, Instagram, Phone, Mail, Building, 
    Check, Info, ChevronRight, BedDouble, ChevronLeft, Image as ImageIcon,
    CircleDot, Circle
} from 'lucide-react';
import { Settings, Room } from '../../types';

// ─── Sub-Step Definition ────────────────────────────────────────────────────
interface SubStep {
    id: string;
    emoji: string;
    instruction: string;
    tip?: string;
    targetSelector?: string;
    coachText?: string;
    validationKey?: string;
}

interface AdminOnboardingProps {
    onNavigate: (tab: string, targetId?: string) => void;
    onEnterVisualBuilder?: (targetId?: string) => void;
    settings?: Settings;
    rooms?: Room[];
    onUpdateSettings?: (settings: Settings) => Promise<void>;
    onUpdateRoom?: (roomId: string, updates: Partial<Room>) => Promise<void>;
    onStepChange?: (stepId: string | null) => void;
}

// ─── Step Definitions with Rich Sub-Steps ───────────────────────────────────
const steps = [
    {
        id: 'payment',
        emoji: '💰',
        title: 'Configure Payouts',
        subtitle: 'GCash & Bank Settings',
        intro: 'Let\'s set up your payment details so guests can pay you directly.',
        actionLabel: 'Go to Payouts Form ➜',
        visualType: 'payment',
        substeps: [
            {
                id: 'payment-gcash-name',
                emoji: '1️⃣',
                instruction: 'Enter your GCash Account Name',
                tip: 'The registered name on your GCash account (e.g., Juan Dela Cruz)',
                targetSelector: '[data-onboarding-target="gcash-account-name"]',
                coachText: '✏️ Type your account name here',
                validationKey: 'payment-gcash-name',
            },
            {
                id: 'payment-gcash-number',
                emoji: '2️⃣',
                instruction: 'Enter your GCash Account Number',
                tip: 'Your 11-digit GCash number (e.g., 09171234567)',
                targetSelector: '[data-onboarding-target="gcash-account-number"]',
                coachText: '✏️ Type your GCash number here',
                validationKey: 'payment-gcash-number',
            },
            {
                id: 'payment-saved',
                emoji: '3️⃣',
                instruction: 'Scroll down and hit Save to lock in your payout details',
                tip: 'Your payment info will be shown to guests after they book',
                targetSelector: '[data-onboarding-target="payment-section"]',
                coachText: '💾 Don\'t forget to save!',
                validationKey: 'payment-saved',
            }
        ] as SubStep[]
    },
    {
        id: 'rooms',
        emoji: '📸',
        title: 'Upload Room Photos',
        subtitle: 'Add galleries & pricing',
        intro: 'Time to make your rooms look stunning! Let\'s add photos and set prices.',
        actionLabel: 'Go to Rooms Manager ➜',
        visualType: 'photos',
        substeps: [
            {
                id: 'rooms-edit-click',
                emoji: '1️⃣',
                instruction: 'Click the Edit button on your first room',
                tip: 'This opens the room editor where you can customize everything',
                targetSelector: '[data-onboarding-target="first-room-edit"]',
                coachText: '👆 Click Edit to open the room editor',
                validationKey: 'rooms-edit-click',
            },
            {
                id: 'rooms-photo-upload',
                emoji: '2️⃣',
                instruction: 'Upload at least one beautiful room photo',
                tip: 'High-quality photos increase bookings by 60%!',
                targetSelector: '[data-onboarding-target="first-room-card"]',
                coachText: '📷 Add a photo to your room gallery',
                validationKey: 'rooms-photo-upload',
            },
            {
                id: 'rooms-price-set',
                emoji: '3️⃣',
                instruction: 'Set a nightly rate for your room',
                tip: 'Research similar properties in your area for competitive pricing',
                targetSelector: '[data-onboarding-target="first-room-card"]',
                coachText: '💰 Set your room\'s price per night',
                validationKey: 'rooms-price-set',
            }
        ] as SubStep[]
    },
    {
        id: 'builder',
        emoji: '🖥️',
        title: 'Master Website Builder',
        subtitle: 'Direct In-Page Editing',
        intro: 'Your website is fully customizable! Here\'s how to edit everything.',
        actionLabel: 'Explore Website Builder ➜',
        visualType: 'builder',
        substeps: [
            {
                id: 'builder-text-edit',
                emoji: '1️⃣',
                instruction: 'Double-click any headline text to edit it inline',
                tip: 'Works on all headlines, taglines, and button text throughout the page',
                validationKey: 'builder-text-edit',
            },
            {
                id: 'builder-image-adjust',
                emoji: '2️⃣',
                instruction: 'Click directly on the hero image to drag and reposition it',
                tip: 'You can click and drag anywhere on the hero banner to find the perfect crop!',
                validationKey: 'builder-image-adjust',
            },
            {
                id: 'builder-slide-cycle',
                emoji: '3️⃣',
                instruction: 'Use the ← → arrows to cycle through hero slides',
                tip: 'Autoplay pauses during editing so you can focus',
                validationKey: 'builder-slide-cycle',
            },
            {
                id: 'builder-undo-redo',
                emoji: '4️⃣',
                instruction: 'Try the Undo/Redo buttons in the sidebar toolbar',
                tip: 'Made a mistake? No worries — just undo and try again!',
                validationKey: 'builder-undo-redo',
            }
        ] as SubStep[]
    },
    {
        id: 'social',
        emoji: '📲',
        title: 'Link Social Accounts',
        subtitle: 'Footer contact links',
        intro: 'Connect your social profiles so guests can find and follow you.',
        actionLabel: 'Open Footer Socials ➜',
        visualType: 'social',
        substeps: [
            {
                id: 'social-panel-open',
                emoji: '1️⃣',
                instruction: 'The Social & Links panel will auto-open in the sidebar',
                tip: 'This panel controls all your footer links and contact info',
                targetSelector: '[data-onboarding-target="social-accordion"]',
                coachText: '📂 This panel is auto-opened for you!',
                validationKey: 'social-panel-open',
            },
            {
                id: 'social-url-set',
                emoji: '2️⃣',
                instruction: 'Paste your Facebook or Instagram profile URL',
                tip: 'e.g., facebook.com/yourpage or instagram.com/youraccount',
                targetSelector: '[data-onboarding-target="footer-facebook"]',
                coachText: '🔗 Paste your social media link',
                validationKey: 'social-url-set',
            }
        ] as SubStep[]
    },
    {
        id: 'map',
        emoji: '📍',
        title: 'Pin Location Map',
        subtitle: 'Google Map Navigation',
        intro: 'Help guests find your property with an interactive map embed.',
        actionLabel: 'Open Maps Builder ➜',
        visualType: 'map',
        substeps: [
            {
                id: 'map-step-1',
                emoji: '1️⃣',
                instruction: 'Go to maps.google.com and search your property name',
                tip: 'Use your exact address for the most accurate pin',
                validationKey: 'map-step-1',
            },
            {
                id: 'map-step-2',
                emoji: '2️⃣',
                instruction: 'Click Share → Embed a map → Copy HTML',
                tip: 'Look for the "</>" embed tab in the share dialog',
                validationKey: 'map-step-2',
            },
            {
                id: 'map-step-3',
                emoji: '3️⃣',
                instruction: 'Paste the embed code in the Map URL field on the left',
                tip: 'The map preview will update automatically once pasted',
                targetSelector: '[data-onboarding-target="map-embed-container"]',
                coachText: '📋 Paste your Google Maps embed code here',
                validationKey: 'map-embed-set',
            }
        ] as SubStep[]
    },
    {
        id: 'design',
        emoji: '🎨',
        title: 'Branding & Colors',
        subtitle: 'Style custom brand themes',
        intro: 'Make your website uniquely yours with custom colors and branding.',
        actionLabel: 'Open Theme Customizer ➜',
        visualType: 'design',
        substeps: [
            {
                id: 'design-panel-open',
                emoji: '1️⃣',
                instruction: 'The Theme & Colors panel will auto-open in the sidebar',
                tip: 'Browse through 18 luxury preset palettes or mix your own',
                targetSelector: '[data-onboarding-target="theme-accordion"]',
                coachText: '🎨 Theme panel is auto-opened!',
                validationKey: 'design-panel-open',
            },
            {
                id: 'design-color-set',
                emoji: '2️⃣',
                instruction: 'Pick a preset palette or create your own custom color',
                tip: 'Try Navy & Gold for a luxury feel, or Ocean Breeze for a tropical vibe',
                targetSelector: '[data-onboarding-target="theme-accordion"]',
                coachText: '🎨 Click any color to apply it instantly',
                validationKey: 'design-color-set',
            }
        ] as SubStep[]
    }
];

// ─── TypewriterText Component ───────────────────────────────────────────────
const TypewriterText: React.FC<{ text: string; speed?: number; className?: string }> = ({ text, speed = 22, className = '' }) => {
    const [displayed, setDisplayed] = useState('');
    useEffect(() => {
        setDisplayed('');
        let i = 0;
        const timer = setInterval(() => {
            setDisplayed(text.slice(0, ++i));
            if (i >= text.length) clearInterval(timer);
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);
    return <span className={className}>{displayed}<span className="typewriter-cursor">|</span></span>;
};

// ─── SpotlightOverlay Component ─────────────────────────────────────────────
const SpotlightOverlay: React.FC<{ targetSelector: string; coachText: string }> = ({ targetSelector, coachText }) => {
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const findAndMeasure = () => {
            const el = document.querySelector(targetSelector);
            if (el) {
                setRect(el.getBoundingClientRect());
                return true;
            }
            return false;
        };

        // Try immediately then retry a few times with delay
        if (!findAndMeasure()) {
            const retryTimer = setInterval(() => {
                if (findAndMeasure()) clearInterval(retryTimer);
            }, 300);
            const cleanup = setTimeout(() => clearInterval(retryTimer), 5000);
            return () => { clearInterval(retryTimer); clearTimeout(cleanup); };
        }

        const handleUpdate = () => {
            const el = document.querySelector(targetSelector);
            if (el) setRect(el.getBoundingClientRect());
        };

        window.addEventListener('scroll', handleUpdate, true);
        window.addEventListener('resize', handleUpdate);
        const observer = new MutationObserver(handleUpdate);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });

        return () => {
            window.removeEventListener('scroll', handleUpdate, true);
            window.removeEventListener('resize', handleUpdate);
            observer.disconnect();
        };
    }, [targetSelector]);

    if (!rect) return null;

    const pad = 8;
    const x1 = Math.max(0, rect.left - pad);
    const y1 = Math.max(0, rect.top - pad);
    const x2 = rect.right + pad;
    const y2 = rect.bottom + pad;

    return (
        <div className="fixed inset-0 z-[108] pointer-events-none spotlight-overlay">
            {/* Dark overlay with rectangular cutout */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'rgba(0,0,0,0.35)',
                    clipPath: `polygon(
                        0% 0%, 0% 100%, ${x1}px 100%, ${x1}px ${y1}px,
                        ${x2}px ${y1}px, ${x2}px ${y2}px, ${x1}px ${y2}px,
                        ${x1}px 100%, 100% 100%, 100% 0%
                    )`
                }}
            />
            {/* Glowing border around the cutout */}
            <div
                className="absolute rounded-xl onboarding-highlight-glow"
                style={{
                    left: x1,
                    top: y1,
                    width: x2 - x1,
                    height: y2 - y1,
                    pointerEvents: 'none',
                }}
            />
            {/* Coach mark arrow + tooltip above the target */}
            <div
                className="absolute coach-mark-enter onboarding-arrow-indicator flex flex-col items-center"
                style={{
                    left: Math.min(x1 + (x2 - x1) / 2, window.innerWidth - 160),
                    top: Math.max(4, y1 - 52),
                    transform: 'translateX(-50%)',
                }}
            >
                <div className="bg-primary text-white px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-2xl whitespace-nowrap border border-white/20 flex items-center gap-1.5">
                    {coachText}
                </div>
                <div className="w-2.5 h-2.5 bg-primary rotate-45 -mt-1.5 shadow-lg" />
            </div>
        </div>
    );
};

// ─── Visual preview mockups ─────────────────────────────────────────────────
const renderVisualMockup = (type: string) => {
    switch (type) {
        case 'payment':
            return (
                <div className="relative w-full h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex flex-col items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner select-none animate-fade-in">
                    <div className="absolute top-2 right-3 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="text-[7px] font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-400">Live Payouts</span>
                    </div>
                    <div className="relative w-32 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg border border-white/20 p-2 flex flex-col justify-between text-white scale-95 animate-phone-float">
                        <div className="flex justify-between items-center">
                            <CreditCard size={10} className="text-white/80" />
                            <span className="text-[6px] font-black tracking-widest uppercase opacity-85">GCash Pay</span>
                        </div>
                        <div className="text-left leading-none">
                            <div className="text-[5px] opacity-60">Payout Number</div>
                            <div className="text-[7px] font-mono font-bold leading-none tracking-wider mt-0.5">0917 •••• 567</div>
                        </div>
                    </div>
                    <span className="absolute text-yellow-500 text-xs left-12 top-4 animate-coin-drop-1 select-none">🪙</span>
                    <span className="absolute text-yellow-500 text-[10px] right-12 top-2 animate-coin-drop-1 select-none" style={{ animationDelay: '0.4s' }}>🪙</span>
                </div>
            );
        case 'photos':
            return (
                <div className="relative w-full h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden p-3 shadow-inner animate-fade-in">
                    <div className="w-32 h-16 bg-white dark:bg-gray-700 rounded-xl shadow-md border border-primary/10 p-1 flex flex-col gap-1 z-10 text-left">
                        <div className="h-9 rounded-lg overflow-hidden relative">
                            <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" alt="" className="w-full h-full object-cover" />
                            <div className="absolute top-1 right-1 bg-amber-400 text-[5px] font-black text-white p-0.5 rounded-full shadow animate-bounce">★</div>
                        </div>
                        <div className="flex justify-between items-center px-1 text-[6px] font-black uppercase text-gray-500 dark:text-gray-300">
                            <span>Deluxe Villa</span>
                            <span className="text-emerald-500">Perfect</span>
                        </div>
                    </div>
                </div>
            );
        case 'builder':
            return (
                <div className="relative w-full h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner p-2 animate-fade-in">
                    <div className="w-[180px] bg-white dark:bg-gray-700 rounded-xl shadow-md border border-black/5 p-2 flex flex-col gap-1 scale-95 text-left">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-600 pb-1">
                            <span className="text-[6px] font-black uppercase text-gray-400">Website Builder</span>
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center text-[4px] font-black text-gray-500">⟲</span>
                                <span className="w-2 h-2 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center text-[4px] font-black text-gray-500">⟳</span>
                            </div>
                        </div>
                        <div className="p-1 rounded bg-blue-50/50 dark:bg-blue-900/10 border border-dashed border-blue-200 flex items-center justify-between text-[5px]">
                            <span className="font-bold text-blue-600 dark:text-blue-400 truncate max-w-[90px]">Headline: Click to edit</span>
                            <span className="text-[4px] font-bold text-blue-500 uppercase bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">Edit</span>
                        </div>
                        <div className="p-1 rounded bg-emerald-50/50 dark:bg-emerald-900/10 border border-dashed border-emerald-200 flex items-center justify-between text-[5px]">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[90px]">Hero: Drag & scale</span>
                            <span className="text-[4px] font-bold text-emerald-500 uppercase bg-emerald-100 dark:bg-emerald-900/40 px-1 py-0.5 rounded">Adjust</span>
                        </div>
                    </div>
                </div>
            );
        case 'social':
            return (
                <div className="relative w-full h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner p-4 animate-fade-in">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-base shadow-lg animate-phone-float relative z-10">🏝️</div>
                    <div className="absolute left-8 w-8 h-8 rounded-xl bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-750 flex items-center justify-center shadow-md animate-logo-shake z-10" style={{ animationDelay: '0.5s' }}>
                        <Facebook size={16} className="text-blue-600" />
                    </div>
                    <div className="absolute right-8 w-8 h-8 rounded-xl bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-750 flex items-center justify-center shadow-md animate-logo-shake z-10">
                        <Instagram size={16} className="text-pink-500" />
                    </div>
                </div>
            );
        case 'map':
            return (
                <div className="relative w-full h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner animate-fade-in">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:14px_14px] opacity-30" />
                    <div className="absolute w-8 h-8 rounded-full border border-primary/40 bg-primary/10 animate-ripple flex items-center justify-center"></div>
                    <div className="relative z-10 animate-pin-drop">
                        <MapPin size={24} className="text-red-500 fill-red-500/20 drop-shadow-lg" />
                    </div>
                </div>
            );
        case 'design':
            return (
                <div className="relative w-full h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner animate-fade-in">
                    <div className="flex gap-3 items-center justify-center animate-phone-float">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-900 to-amber-500 shadow-md ring-2 ring-white/50 border border-black/10 scale-90" />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-400 shadow-lg ring-3 ring-white/70 border border-black/10 relative">
                            <span className="absolute -top-1 -right-1 bg-amber-400 text-[4px] font-black text-white px-1 py-0.5 rounded-full uppercase shadow animate-pulse">Live</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-300 shadow-md ring-2 ring-white/50 border border-black/10 scale-90" />
                    </div>
                </div>
            );
        default:
            return null;
    }
};

// ─── Main Component ─────────────────────────────────────────────────────────
const AdminOnboarding: React.FC<AdminOnboardingProps> = ({ 
    onNavigate, onEnterVisualBuilder, settings, rooms, onUpdateSettings, onUpdateRoom, onStepChange 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1); // -1: Welcome Screen, 6: Celebration Screen
    const [direction, setDirection] = useState<'next' | 'prev'>('next');
    const [animationKey, setAnimationKey] = useState<number>(0);
    const [activeSubStepIdx, setActiveSubStepIdx] = useState<number>(0);
    const [showNiceBadge, setShowNiceBadge] = useState(false);
    const [phoneFlash, setPhoneFlash] = useState(false);
    
    // Micro-interactions state hooks
    const [isWiggling, setIsWiggling] = useState(false);
    const [activeToast, setActiveToast] = useState<{ stepId: string; title: string; emoji: string; } | null>(null);
    const [isHeroAdjustingActive, setIsHeroAdjustingActive] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const prevCompletedRef = useRef<Record<string, boolean>>({});
    const prevSubStepRef = useRef<Record<string, boolean>>({});

    // Poll for the active hero image repositioning state to hide/show the floating rocket beacon dynamically
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const checkHeroAdjusting = () => {
            const el = document.getElementById('hero-done-adjusting');
            setIsHeroAdjustingActive(!!el);
        };
        
        checkHeroAdjusting();
        const interval = setInterval(checkHeroAdjusting, 250);
        return () => clearInterval(interval);
    }, []);

    // ─── Sub-Step Validation Engine ─────────────────────────────────────────
    const subStepValidation = useMemo(() => ({
        'payment-gcash-name': !!(settings?.paymentMethods?.gcash?.accountName?.trim()),
        'payment-gcash-number': !!(settings?.paymentMethods?.gcash?.accountNumber?.trim()),
        'payment-saved': !!(
            settings?.paymentMethods?.gcash?.accountNumber?.trim() && 
            settings?.paymentMethods?.gcash?.accountName?.trim()
        ),
        'rooms-edit-click': true, // Instructional — always pass
        'rooms-photo-upload': !!(rooms && rooms.length > 0 && rooms.some(r => r.images && r.images.length > 0)),
        'rooms-price-set': !!(rooms && rooms.length > 0 && rooms.some(r => r.price > 0)),
        'builder-text-edit': true,
        'builder-image-adjust': true,
        'builder-slide-cycle': true,
        'builder-undo-redo': true,
        'social-panel-open': true, // Auto-opened by accordion logic
        'social-url-set': !!(
            settings?.social?.facebook && 
            settings.social.facebook !== 'facebook.com/serenitystay' && 
            settings.social.facebook.trim().length > 0
        ),
        'map-step-1': true, // Instructional
        'map-step-2': true, // Instructional
        'map-embed-set': !!(
            settings?.map?.embedUrl && 
            !settings.map.embedUrl.includes('El%20Nido') && 
            settings.map.embedUrl.trim().length > 0
        ),
        'design-panel-open': true, // Auto-opened
        'design-color-set': !!(
            settings?.theme?.primaryColor && 
            settings.theme.primaryColor !== '#1B2A4A'
        ),
    }), [settings, rooms]);

    // ─── Step-level completion (existing logic) ─────────────────────────────
    const stepCompletionMap = useMemo(() => {
        return {
            payment: !!(
                (settings?.paymentMethods?.gcash?.accountNumber?.trim() && settings?.paymentMethods?.gcash?.accountName?.trim()) ||
                (settings?.paymentMethods?.bankTransfer?.accountNumber?.trim() && settings?.paymentMethods?.bankTransfer?.accountName?.trim() && settings?.paymentMethods?.bankTransfer?.bankName?.trim())
            ),
            rooms: !!(
                rooms && rooms.length > 0 && 
                rooms.some(r => r.images && r.images.length > 0) &&
                rooms.some(r => r.price > 0)
            ),
            builder: true,
            social: !!(
                (settings?.social?.facebook && settings?.social?.facebook !== 'facebook.com/serenitystay' && settings?.social?.facebook.trim().length > 0) ||
                (settings?.social?.instagram && settings?.social?.instagram !== 'instagram.com/serenitystay' && settings?.social?.instagram.trim().length > 0)
            ),
            map: !!(
                settings?.map?.embedUrl && 
                !settings?.map?.embedUrl.includes('El%20Nido') &&
                settings.map.embedUrl.trim().length > 0
            ),
            design: !!(
                settings?.theme?.primaryColor && 
                settings?.theme?.primaryColor !== '#1B2A4A'
            )
        };
    }, [settings, rooms]);

    const isStepDone = (stepId: string) => {
        return !!stepCompletionMap[stepId as keyof typeof stepCompletionMap];
    };

    const completedCount = useMemo(() => {
        let count = 0;
        steps.forEach(step => {
            if (isStepDone(step.id) && step.id !== 'builder') {
                count++;
            }
        });
        return count;
    }, [stepCompletionMap]);

    const totalGoalSteps = 5;
    const remaining = Math.max(0, totalGoalSteps - completedCount);
    const allDone = completedCount >= totalGoalSteps;

    // ─── Reset activeSubStepIdx when main step changes ──────────────────────
    useEffect(() => {
        if (currentStepIdx >= 0 && currentStepIdx < steps.length) {
            const step = steps[currentStepIdx];
            // Find the first incomplete sub-step
            const firstIncomplete = step.substeps.findIndex(
                sub => !subStepValidation[sub.validationKey as keyof typeof subStepValidation]
            );
            setActiveSubStepIdx(firstIncomplete >= 0 ? firstIncomplete : 0);
        } else {
            setActiveSubStepIdx(0);
        }
    }, [currentStepIdx]);

    // ─── Auto-advance sub-steps when validation changes ─────────────────────
    useEffect(() => {
        if (currentStepIdx < 0 || currentStepIdx >= steps.length) return;
        
        const step = steps[currentStepIdx];
        const currentSub = step.substeps[activeSubStepIdx];
        if (!currentSub) return;

        const isCurrentDone = subStepValidation[currentSub.validationKey as keyof typeof subStepValidation];
        const wasCurrentDone = prevSubStepRef.current[currentSub.id];

        // Detect newly completed sub-step
        if (isCurrentDone && !wasCurrentDone) {
            // Celebration micro-animation
            setShowNiceBadge(true);
            setPhoneFlash(true);
            setTimeout(() => setShowNiceBadge(false), 1500);
            setTimeout(() => setPhoneFlash(false), 800);

            // Auto-advance to next incomplete sub-step after a small delay
            setTimeout(() => {
                const nextIncomplete = step.substeps.findIndex(
                    (sub, idx) => idx > activeSubStepIdx && !subStepValidation[sub.validationKey as keyof typeof subStepValidation]
                );
                if (nextIncomplete >= 0) {
                    setActiveSubStepIdx(nextIncomplete);
                }
            }, 600);
        }

        // Update ref for all sub-steps
        const newRef: Record<string, boolean> = {};
        step.substeps.forEach(sub => {
            newRef[sub.id] = !!subStepValidation[sub.validationKey as keyof typeof subStepValidation];
        });
        prevSubStepRef.current = newRef;
    }, [subStepValidation, activeSubStepIdx, currentStepIdx]);

    // ─── Sync active onboarding step to parent ──────────────────────────────
    useEffect(() => {
        if (onStepChange) {
            if (!isOpen || currentStepIdx < 0 || currentStepIdx >= steps.length) {
                onStepChange(null);
            } else {
                onStepChange(steps[currentStepIdx].id);
            }
        }
    }, [currentStepIdx, isOpen, onStepChange]);

    // ─── Active synchronization navigations on slide change ─────────────────
    useEffect(() => {
        if (!isOpen) return;

        if (currentStepIdx === 0) {
            onNavigate('settings', 'settings-payment');
        } else if (currentStepIdx === 1) {
            onNavigate('rooms');
        } else if (currentStepIdx === 2) {
            if (onEnterVisualBuilder) onEnterVisualBuilder();
        } else if (currentStepIdx === 3) {
            if (onEnterVisualBuilder) onEnterVisualBuilder('footer');
        } else if (currentStepIdx === 4) {
            if (onEnterVisualBuilder) onEnterVisualBuilder('contact');
        } else if (currentStepIdx === 5) {
            if (onEnterVisualBuilder) onEnterVisualBuilder('theme');
        }
    }, [currentStepIdx, isOpen]);

    // ─── Real-Time Background Save Detector & Auto-Advancer ─────────────────
    useEffect(() => {
        if (!settings && (!rooms || rooms.length === 0)) return;

        const currentMap = {
            payment: stepCompletionMap.payment,
            rooms: stepCompletionMap.rooms,
            social: stepCompletionMap.social,
            map: stepCompletionMap.map,
            design: stepCompletionMap.design
        };

        const isFirstRun = Object.keys(prevCompletedRef.current).length === 0;
        let newlyCompletedStepId: string | null = null;

        Object.entries(currentMap).forEach(([stepId, isDone]) => {
            const wasDone = prevCompletedRef.current[stepId];
            if (isDone && wasDone === false) {
                newlyCompletedStepId = stepId;
            }
        });

        prevCompletedRef.current = currentMap;

        if (!isFirstRun && newlyCompletedStepId) {
            const stepObj = steps.find(s => s.id === newlyCompletedStepId);
            if (stepObj) {
                setActiveToast({
                    stepId: newlyCompletedStepId,
                    title: stepObj.title,
                    emoji: stepObj.emoji
                });

                setIsWiggling(true);
                const wiggleTimer = setTimeout(() => setIsWiggling(false), 1200);
                const toastTimer = setTimeout(() => setActiveToast(null), 5000);

                const allStepsNowCompleted = Object.values(currentMap).every(val => val);
                if (allStepsNowCompleted) {
                    const autoOpenTimer = setTimeout(() => {
                        setIsOpen(true);
                        setCurrentStepIdx(steps.length);
                    }, 1600);
                    return () => {
                        clearTimeout(wiggleTimer);
                        clearTimeout(toastTimer);
                        clearTimeout(autoOpenTimer);
                    };
                }

                const autoOpenTimer = setTimeout(() => {
                    const completedIdx = steps.findIndex(s => s.id === newlyCompletedStepId);
                    const nextIdx = Math.min(steps.length - 1, completedIdx + 1);
                    
                    setIsOpen(true);
                    setDirection('next');
                    setAnimationKey(prev => prev + 1);
                    setCurrentStepIdx(nextIdx);
                }, 1800);

                return () => {
                    clearTimeout(wiggleTimer);
                    clearTimeout(toastTimer);
                    clearTimeout(autoOpenTimer);
                };
            }
        }
    }, [stepCompletionMap, settings, rooms]);

    const goNext = () => {
        setDirection('next');
        setAnimationKey(prev => prev + 1);
        setCurrentStepIdx(prev => Math.min(steps.length, prev + 1));
    };

    const goBack = () => {
        setDirection('prev');
        setAnimationKey(prev => prev + 1);
        setCurrentStepIdx(prev => Math.max(-1, prev - 1));
    };

    const handleNavigate = (step: typeof steps[number]) => {
        if (step.visualType === 'social' || step.visualType === 'map' || step.visualType === 'design' || step.visualType === 'builder') {
            if (onEnterVisualBuilder) onEnterVisualBuilder(step.visualType === 'social' ? 'footer' : step.visualType === 'map' ? 'contact' : step.visualType === 'design' ? 'theme' : undefined);
        } else {
            onNavigate(step.visualType === 'photos' ? 'rooms' : 'settings', step.visualType === 'payment' ? 'settings-payment' : undefined);
        }
    };

    // ─── Get active spotlight data ──────────────────────────────────────────
    const activeSpotlight = useMemo(() => {
        if (currentStepIdx < 0 || currentStepIdx >= steps.length || !isOpen) return null;
        const step = steps[currentStepIdx];
        const sub = step.substeps[activeSubStepIdx];
        if (sub?.targetSelector && sub?.coachText) {
            return { selector: sub.targetSelector, text: sub.coachText };
        }
        return null;
    }, [currentStepIdx, activeSubStepIdx, isOpen]);

    // ─── Count completed sub-steps for current step ─────────────────────────
    const getSubStepProgress = useCallback((step: typeof steps[number]) => {
        const completed = step.substeps.filter(
            sub => subStepValidation[sub.validationKey as keyof typeof subStepValidation]
        ).length;
        return { completed, total: step.substeps.length };
    }, [subStepValidation]);

    return (
        <>
            {/* Confetti Explosion Canvas */}
            {isOpen && currentStepIdx === steps.length && (
                <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[200] w-screen h-screen" />
            )}

            {/* Spotlight Overlay (renders behind the phone panel, above content) */}
            {activeSpotlight && (
                <SpotlightOverlay 
                    targetSelector={activeSpotlight.selector} 
                    coachText={activeSpotlight.text} 
                />
            )}

            {/* ── Floating Rocket Beacon ── */}
            {!isHeroAdjustingActive && (
                <div className="fixed bottom-16 md:bottom-6 right-6 z-[120] flex flex-col items-end gap-2 pointer-events-none select-none">
                    {activeToast && !isOpen && (
                        <div className="pointer-events-auto animate-slide-up bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 max-w-[280px] border border-white/20 relative group overflow-hidden">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="absolute -left-4 -top-4 w-12 h-12 bg-white/10 rounded-full blur-xl pointer-events-none" />
                            
                            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg shrink-0 shadow animate-bounce">
                                {activeToast.emoji}
                            </div>
                            <div className="flex-1 flex flex-col text-left">
                                <span className="text-[9px] font-black tracking-widest uppercase opacity-75">Auto-Completed!</span>
                                <span className="text-xs font-bold leading-tight mt-0.5">{activeToast.title}</span>
                                <span className="text-[9px] font-semibold opacity-90 leading-tight mt-0.5">Setup progress: {completedCount}/{totalGoalSteps} done</span>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveToast(null); }}
                                className="text-white/70 hover:text-white shrink-0 ml-1 hover:scale-110 active:scale-95 transition-transform"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {!activeToast && !isOpen && (
                        <div className="hidden md:flex pointer-events-auto animate-fade-in bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-primary/20 px-4 py-2 items-center gap-2">
                            <Sparkles size={13} className="text-primary shrink-0" />
                            <span className="text-xs font-bold text-secondary dark:text-white whitespace-nowrap font-sans">
                                {allDone ? '🎉 Your site is live!' : `${remaining} setup step${remaining !== 1 ? 's' : ''} left`}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            if (isOpen) {
                                // Toggle close — preserve step position
                                setIsOpen(false);
                            } else {
                                // Toggle open — resume where we left off (BUG FIX: no longer resets to -1)
                                setIsOpen(true);
                                // Only go to welcome if we haven't started yet
                                if (currentStepIdx < 0 || currentStepIdx >= steps.length) {
                                    setCurrentStepIdx(-1);
                                }
                            }
                        }}
                        aria-label="Open Setup Guide"
                        className={`pointer-events-auto relative group focus:outline-none ${isWiggling ? 'animate-rocket-wiggle' : ''}`}
                    >
                        {!allDone && !isOpen && (
                            <>
                                <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
                                <span className="absolute inset-1 rounded-full animate-ping bg-primary/20" />
                            </>
                        )}
                        {!allDone && (
                            <span className="absolute -top-1 -right-1 z-10 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-500 text-white text-[8px] md:text-[9px] font-black shadow-lg animate-bounce">
                                {remaining}
                            </span>
                        )}
                        <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary via-blue-500 to-secondary flex items-center justify-center shadow-2xl shadow-primary/40 transition-transform duration-300 group-hover:scale-110 group-active:scale-95 ring-2 md:ring-4 ring-white dark:ring-gray-900">
                            <span className="text-[20px] md:text-[26px] leading-none select-none">{allDone ? '🎉' : '🚀'}</span>
                        </div>
                    </button>
                </div>
            )}

            {/* ── Immersive Phone Setup Wizard Modal ── */}
            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none z-[115] animate-fade-in flex items-center justify-center p-4 pointer-events-auto md:pointer-events-none"
                        onClick={() => setIsOpen(false)}
                    >
                        <div 
                            className={`relative w-full max-w-[350px] h-[640px] md:fixed md:top-24 md:right-6 md:translate-x-0 md:translate-y-0 bg-gray-950 rounded-[48px] p-3.5 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)] md:shadow-[0_20px_50px_rgba(0,0,0,0.45)] border-4 border-gray-800/80 flex flex-col justify-center animate-slide-up select-none pointer-events-auto md:scale-95 z-[120] transition-shadow duration-300 ${phoneFlash ? 'green-flash-ring' : ''}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Smartphone notch */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-[130] flex items-center justify-end px-2.5 pointer-events-none border border-white/5">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-900 border border-gray-950 shrink-0"></span>
                            </div>

                            {/* Inner Screen Panel */}
                            <div className="relative w-full h-full bg-white dark:bg-gray-900 rounded-[34px] overflow-hidden flex flex-col border border-white/10 shadow-inner">
                                
                                {/* Top mock status bar */}
                                <div className="h-9 shrink-0 px-6 pt-3 flex justify-between items-center text-[10px] font-bold text-gray-400 dark:text-gray-500 pointer-events-none select-none z-[125]">
                                    <span>9:41 AM 📱</span>
                                    <div className="flex items-center gap-1.5">
                                        <span>📶</span>
                                        <span>🔋 100%</span>
                                    </div>
                                </div>

                                {/* Step Progress Track */}
                                {currentStepIdx >= 0 && currentStepIdx < steps.length && (
                                    <div className="px-6 py-2 shrink-0 flex justify-between items-center select-none z-[125]">
                                        <button 
                                            onClick={goBack}
                                            className="text-gray-400 hover:text-primary transition-colors flex items-center text-[10px] font-black uppercase tracking-wider"
                                        >
                                            <ArrowLeft size={10} className="mr-0.5" /> Back
                                        </button>
                                        <div className="flex gap-1.5">
                                            {steps.map((_, sIdx) => (
                                                <span 
                                                    key={sIdx} 
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${sIdx === currentStepIdx ? 'w-5 bg-primary' : isStepDone(steps[sIdx].id) ? 'w-2 bg-emerald-500' : 'w-1.5 bg-gray-250 dark:bg-gray-700'}`}
                                                />
                                            ))}
                                        </div>
                                        <button 
                                            onClick={goNext}
                                            className="text-gray-400 hover:text-primary transition-colors flex items-center text-[10px] font-black uppercase tracking-wider"
                                        >
                                            Skip <ArrowRight size={10} className="ml-0.5" />
                                        </button>
                                    </div>
                                )}

                                {/* Slide Content Body */}
                                <div key={animationKey} className={`flex-1 flex flex-col justify-between p-5 overflow-y-auto ${direction === 'next' ? 'animate-slide-next' : 'animate-slide-prev'}`}>
                                    
                                    {/* 1. WELCOME SCREEN */}
                                    {currentStepIdx === -1 && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                                            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-primary via-blue-500 to-indigo-600 flex items-center justify-center text-4xl shadow-2xl relative animate-phone-float mb-5 ring-4 ring-white dark:ring-gray-800">
                                                <Rocket size={34} className="text-white" />
                                                <div className="absolute -top-1 -right-1 flex h-4 w-4 animate-ping rounded-full bg-primary/60" />
                                            </div>
                                            <h3 className="text-lg font-black text-secondary dark:text-white leading-tight tracking-tight px-1 font-sans">
                                                Interactive Setup Guide!
                                            </h3>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed max-w-[240px] mt-3 font-sans">
                                                I'll walk you through every single step of configuring your staycation website — from payment setup to custom branding. Just follow along!
                                            </p>
                                            
                                            {/* Quick overview of what we'll cover */}
                                            <div className="w-full mt-5 space-y-1.5 text-left">
                                                {steps.map((step, idx) => (
                                                    <div key={idx} className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2 border border-gray-100 dark:border-gray-800">
                                                        <span className="text-base">{step.emoji}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-[10px] font-bold text-secondary dark:text-white block leading-tight">{step.title}</span>
                                                            <span className="text-[8px] text-gray-400 font-semibold">{step.substeps.length} tasks</span>
                                                        </div>
                                                        {isStepDone(step.id) && step.id !== 'builder' ? (
                                                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                                        ) : (
                                                            <Circle size={14} className="text-gray-300 dark:text-gray-600 shrink-0" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                onClick={goNext}
                                                className="w-full mt-5 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                                            >
                                                Let's Begin! <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {/* 2. ACTIVE STEPS with Sub-Step Checklist */}
                                    {currentStepIdx >= 0 && currentStepIdx < steps.length && (() => {
                                        const step = steps[currentStepIdx];
                                        const done = isStepDone(step.id);
                                        const { completed, total } = getSubStepProgress(step);
                                        const progressPercent = Math.round((completed / total) * 100);
                                        
                                        return (
                                            <div className="flex-1 flex flex-col justify-between h-full gap-3">
                                                <div className="space-y-3 flex-1">
                                                    {/* Visual Preview */}
                                                    {renderVisualMockup(step.visualType)}

                                                    {/* Step Header */}
                                                    <div className="text-center">
                                                        <h3 className="text-sm font-black text-secondary dark:text-white leading-tight flex items-center justify-center gap-1.5 font-sans">
                                                            <span className="text-lg">{step.emoji}</span>
                                                            {step.title}
                                                            {done && step.id !== 'builder' && <CheckCircle2 size={15} className="text-emerald-500" />}
                                                        </h3>
                                                        <p className="text-[8px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5 font-sans">{step.subtitle}</p>
                                                    </div>

                                                    {/* Sub-step Progress Bar */}
                                                    <div className="flex items-center gap-2 px-1">
                                                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500 ease-out"
                                                                style={{ width: `${progressPercent}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[9px] font-black text-gray-400 shrink-0">{completed}/{total}</span>
                                                    </div>

                                                    {/* ── Interactive Sub-Step Checklist ── */}
                                                    <div className="space-y-1.5">
                                                        {step.substeps.map((sub, subIdx) => {
                                                            const isSubDone = subStepValidation[sub.validationKey as keyof typeof subStepValidation];
                                                            const isActive = subIdx === activeSubStepIdx;
                                                            
                                                            return (
                                                                <button
                                                                    key={sub.id}
                                                                    onClick={() => setActiveSubStepIdx(subIdx)}
                                                                    className={`w-full text-left rounded-xl p-2.5 border transition-all duration-300 ${
                                                                        isActive 
                                                                            ? 'bg-primary/5 dark:bg-primary/10 border-primary/30 substep-active-pulse' 
                                                                            : isSubDone 
                                                                                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30' 
                                                                                : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start gap-2">
                                                                        {/* Status indicator */}
                                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                                                            isSubDone 
                                                                                ? 'bg-emerald-500 text-white substep-complete-bounce' 
                                                                                : isActive 
                                                                                    ? 'bg-primary/20 border-2 border-primary' 
                                                                                    : 'bg-gray-200 dark:bg-gray-700'
                                                                        }`}>
                                                                            {isSubDone ? (
                                                                                <Check size={11} strokeWidth={3} />
                                                                            ) : (
                                                                                <span className="text-[8px] font-black text-gray-500 dark:text-gray-400">{sub.emoji}</span>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        <div className="flex-1 min-w-0">
                                                                            {/* Instruction text — typewriter for active, static for others */}
                                                                            <div className={`text-[11px] font-bold leading-tight ${
                                                                                isSubDone 
                                                                                    ? 'text-emerald-600 dark:text-emerald-400 line-through opacity-70' 
                                                                                    : isActive 
                                                                                        ? 'text-secondary dark:text-white' 
                                                                                        : 'text-gray-500 dark:text-gray-400'
                                                                            }`}>
                                                                                {isActive && !isSubDone ? (
                                                                                    <TypewriterText text={sub.instruction} />
                                                                                ) : (
                                                                                    sub.instruction
                                                                                )}
                                                                            </div>
                                                                            {/* Tip text */}
                                                                            {isActive && sub.tip && (
                                                                                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium mt-1 leading-snug animate-fade-in">
                                                                                    💡 {sub.tip}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Nice! celebration badge */}
                                                    {showNiceBadge && (
                                                        <div className="flex justify-center">
                                                            <div className="nice-badge-pop bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border border-white/20 flex items-center gap-1">
                                                                <Sparkles size={12} /> Nice work! ✨
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Continue Button */}
                                                <div className="shrink-0 pt-1">
                                                    <button
                                                        onClick={goNext}
                                                        className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-lg shadow-primary/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                                                    >
                                                        Continue to Next Step <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* 3. CELEBRATION SCREEN */}
                                    {currentStepIdx === steps.length && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 h-full font-sans">
                                            
                                            <div className="relative w-full h-32 bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-blue-500/10 rounded-2xl flex flex-col items-center justify-center border border-emerald-500/20 overflow-hidden shadow-inner select-none mb-4 animate-phone-float">
                                                <div className="absolute inset-0 flex items-center justify-center animate-rotate-sparkle pointer-events-none">
                                                    <Sparkles size={160} className="text-amber-400/15" />
                                                </div>
                                                <Trophy size={42} className="text-amber-500 fill-amber-500/10 drop-shadow-[0_10px_20px_rgba(245,158,11,0.25)]" />
                                                <div className="mt-2 flex items-center gap-1.5 bg-emerald-500/15 backdrop-blur-md px-3 py-0.5 rounded-full border border-emerald-500/25">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    <span className="text-[8px] font-black tracking-wide uppercase text-emerald-600 dark:text-emerald-400">All Set!</span>
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-black text-secondary dark:text-white leading-tight">
                                                Your Website is Live!
                                            </h3>
                                            
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed max-w-[260px] mt-2.5">
                                                Congratulations! Your beautiful staycation villa is fully configured and ready to secure payouts directly to your account.
                                            </p>

                                            {/* Completed checklist summary */}
                                            <div className="w-full mt-4 space-y-1">
                                                {steps.filter(s => s.id !== 'builder').map(step => (
                                                    <div key={step.id} className="flex items-center gap-2 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg px-3 py-1.5 border border-emerald-200/30 dark:border-emerald-800/20">
                                                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{step.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                className="w-full mt-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 hover:scale-[1.02] transition-all flex items-center justify-center gap-1 cursor-pointer border border-white/10"
                                            >
                                                Start Booking Manager 🚀
                                            </button>
                                        </div>
                                    )}

                                </div>
                            </div>
                            
                            {/* Mock home indicator */}
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-800 rounded-full z-[130] pointer-events-none"></div>
                        </div>
                    </div>
                </>
            )}

            {/* Custom Animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-5px) rotate(1deg); }
                }
                .animate-phone-float { animation: float 4.5s ease-in-out infinite; }

                @keyframes coin-drop-1 {
                    0% { transform: translateY(-40px) scale(0); opacity: 0; }
                    50% { transform: translateY(0px) scale(1); opacity: 1; }
                    75% { transform: translateY(-5px) scale(1); }
                    100% { transform: translateY(0px) scale(1); opacity: 1; }
                }
                .animate-coin-drop-1 { animation: coin-drop-1 1.4s cubic-bezier(0.175, 0.885, 0.32, 1.2) infinite; }

                @keyframes ripple {
                    0% { transform: scale(0.6); opacity: 1; }
                    100% { transform: scale(2.2); opacity: 0; }
                }
                .animate-ripple { animation: ripple 2.2s cubic-bezier(0.2, 0.6, 0.4, 1) infinite; }

                @keyframes pin-drop {
                    0% { transform: translateY(-50px); opacity: 0; }
                    55% { transform: translateY(0px); opacity: 1; }
                    75% { transform: translateY(-8px); }
                    100% { transform: translateY(0px); opacity: 1; }
                }
                .animate-pin-drop { animation: pin-drop 1.1s cubic-bezier(0.175, 0.885, 0.32, 1.15) infinite; }

                @keyframes logo-shake {
                    0%, 100% { transform: rotate(-4deg); }
                    50% { transform: rotate(4deg); }
                }
                .animate-logo-shake { animation: logo-shake 2.8s ease-in-out infinite; }

                @keyframes rotate-sparkle {
                    0% { transform: rotate(0deg) scale(0.9); }
                    50% { transform: rotate(180deg) scale(1.05); }
                    100% { transform: rotate(360deg) scale(0.9); }
                }
                .animate-rotate-sparkle { animation: rotate-sparkle 7s linear infinite; }

                @keyframes slide-next-in {
                    from { transform: translateX(30px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slide-prev-in {
                    from { transform: translateX(-30px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-next { animation: slide-next-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-slide-prev { animation: slide-prev-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

                @keyframes social-pulse {
                    0% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: -20; }
                }
                .animate-social-pulse { animation: social-pulse 2s linear infinite; }

                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.25s ease forwards; }

                @keyframes slide-up {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

                @keyframes rocket-wiggle {
                    0%, 100% { transform: rotate(0deg) scale(1); }
                    15% { transform: rotate(-15deg) scale(1.1); }
                    30% { transform: rotate(12deg) scale(1.1); }
                    45% { transform: rotate(-10deg) scale(1.1); }
                    60% { transform: rotate(8deg) scale(1.1); }
                    75% { transform: rotate(-4deg) scale(1.1); }
                    90% { transform: rotate(2deg) scale(1.1); }
                }
                .animate-rocket-wiggle { animation: rocket-wiggle 1.2s ease-in-out; }
            `}</style>
        </>
    );
};

export default AdminOnboarding;