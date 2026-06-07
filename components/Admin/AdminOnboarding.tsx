import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
    X, CreditCard, Palette, Rocket, CheckCircle2, ArrowRight, ArrowLeft, 
    MapPin, Sparkles, Trophy, Facebook, Instagram, Phone, Mail, Building, 
    Check, Info, ChevronRight, BedDouble, ChevronLeft, Image as ImageIcon,
    CircleDot, Circle, Volume2, VolumeX, Minus, Maximize2
} from 'lucide-react';
import { Settings, Room } from '../../types';
import AnimatedWalkthrough from './AnimatedWalkthrough';

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
        id: 'overview',
        emoji: '📊',
        title: 'Dashboard Overview',
        subtitle: 'Stats & Reservations',
        intro: 'Welcome! Your Admin Dashboard is the central control room. Let\'s see how it works.',
        actionLabel: 'Explore Dashboard Overview ➜',
        visualType: 'overview',
        substeps: [
            {
                id: 'overview-metrics',
                emoji: '📈',
                instruction: 'Monitor key metrics at the top',
                tip: 'Revenue, Occupancy, Active Guests, and Pending Bookings update in real-time as guests book.',
                validationKey: 'overview-metrics',
            },
            {
                id: 'overview-bookings',
                emoji: '📋',
                instruction: 'Manage bookings in the Recent Bookings list',
                tip: 'Shows detailed guest profiles, checkout choices, and status changes at a glance.',
                validationKey: 'overview-bookings',
            }
        ] as SubStep[]
    },
    {
        id: 'deposit',
        emoji: '🛡️',
        title: 'Security Deposits',
        subtitle: 'GCash & Damage Cover',
        intro: 'Protect your property and secure reservations by setting custom security deposit rates.',
        actionLabel: 'Go to Deposit Rules ➜',
        visualType: 'payment',
        substeps: [
            {
                id: 'deposit-why',
                emoji: '💡',
                instruction: 'Understand what the Deposit is for',
                tip: 'Deposits cover cleaning fees, accidental room damages, and deter fake bookings. Guests pay this to you directly via GCash.',
                validationKey: 'deposit-why',
            },
            {
                id: 'deposit-percentage',
                emoji: '⚙️',
                instruction: 'Configure your Global Deposit rule',
                tip: 'Set it as a fixed amount (e.g. ₱500) or a percentage (e.g. 50%) in the Rooms tab. Guests pay just this to secure dates.',
                validationKey: 'deposit-percentage',
            },
            {
                id: 'deposit-verify',
                emoji: '📱',
                instruction: 'Verify guest transfer slips',
                tip: 'After a guest books, they upload a GCash receipt. Review it on their booking card before confirming!',
                validationKey: 'deposit-verify',
            }
        ] as SubStep[]
    },
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
        title: 'Rooms Manager',
        subtitle: 'Add Listings & Photo Galleries',
        intro: 'Stunning rooms with rich photo galleries and accurate pricing get booked 60% faster.',
        actionLabel: 'Go to Rooms Manager ➜',
        visualType: 'photos',
        substeps: [
            {
                id: 'rooms-add',
                emoji: '➕',
                instruction: 'Tap Add Room to create a new listing',
                tip: 'Set occupancy limits, room description, and modern amenities (e.g. Pool, WiFi).',
                targetSelector: '[data-onboarding-target="add-room-btn"]',
                validationKey: 'rooms-add',
            },
            {
                id: 'rooms-edit-click',
                emoji: '✏️',
                instruction: 'Click the Edit button on your first room',
                tip: 'This opens the room editor where you can customize descriptions, amenities, and photos.',
                targetSelector: '[data-onboarding-target="first-room-edit"]',
                coachText: '👆 Click Edit to open the room editor',
                validationKey: 'rooms-edit-click',
            },
            {
                id: 'rooms-photo-upload',
                emoji: '📸',
                instruction: 'Upload high-quality room photos',
                tip: 'Add multiple photos showing different angles of the bed, bathroom, and views.',
                targetSelector: '[data-onboarding-target="first-room-card"]',
                coachText: '📷 Add a photo to your room gallery',
                validationKey: 'rooms-photo-upload',
            },
            {
                id: 'rooms-price-set',
                emoji: '💰',
                instruction: 'Set nightly and day-use rates',
                tip: 'Charge competitive rates for overnight stays, and set custom weekend markups if desired.',
                targetSelector: '[data-onboarding-target="first-room-card"]',
                coachText: '💰 Set your room\'s price per night',
                validationKey: 'rooms-price-set',
            }
        ] as SubStep[]
    },
    {
        id: 'passcode',
        emoji: '🔐',
        title: 'Admin Passcode',
        subtitle: 'Secure Dashboard Login',
        intro: 'Keep your booking statistics, payouts, and client contact lists secure by setting an admin passcode.',
        actionLabel: 'Open Security Settings ➜',
        visualType: 'security',
        substeps: [
            {
                id: 'passcode-find',
                emoji: '📂',
                instruction: 'Scroll to the Security section in settings',
                tip: 'Here you will find the 6-digit passcode option which controls panel access.',
                validationKey: 'passcode-find',
            },
            {
                id: 'passcode-set',
                emoji: '🔑',
                instruction: 'Set a custom 6-digit passcode',
                tip: 'Replace the default code with a secure custom combination. Make sure to remember it!',
                validationKey: 'passcode-set',
            },
            {
                id: 'passcode-test',
                emoji: '🔒',
                instruction: 'Test the automatic logout',
                tip: 'Logging out locks the panel with an encrypted passcode gate. Anyone visiting `/admin` must enter it to view stats.',
                validationKey: 'passcode-test',
            }
        ] as SubStep[]
    },
    {
        id: 'workflow',
        emoji: '🔄',
        title: 'Reservation Workflow',
        subtitle: 'Manage Guest Journeys',
        intro: 'Master the guest lifecycle workflow to deliver a perfect, stress-free hospitality experience.',
        actionLabel: 'View Recent Bookings ➜',
        visualType: 'workflow',
        substeps: [
            {
                id: 'workflow-pending',
                emoji: '📩',
                instruction: '1. Guest Submits Pending Request',
                tip: 'Bookings start as Pending. An email and dashboard alert warn you. The dates are temporarily held.',
                validationKey: 'workflow-pending',
                targetSelector: '#recent-bookings',
                coachText: '👀 Watch for new "Pending" rows to appear here!',
            },
            {
                id: 'workflow-confirm',
                emoji: '💳',
                instruction: '2. Verify Payment & Click Confirm',
                tip: 'Verify they paid the required deposit or full amount via GCash. Open their reservation card, check their screenshot, and click Confirm!',
                validationKey: 'workflow-confirm',
                targetSelector: '#recent-bookings',
                coachText: '✅ Click a booking to review the GCash slip and Confirm.',
            },
            {
                id: 'workflow-checkin',
                emoji: '🔑',
                instruction: '3. Welcome Guest & Mark Checked-In',
                tip: 'When guests arrive at your property, click "Check In" to update their status. Collect any remaining cash balances.',
                validationKey: 'workflow-checkin',
                targetSelector: '#recent-bookings',
                coachText: '🛎️ Check-in guests upon arrival.',
            },
            {
                id: 'workflow-checkout',
                emoji: '🧹',
                instruction: '4. Verify Room & Mark Checked-Out',
                tip: 'Upon departure, check the room for damages. Refund their security deposit, and click "Check Out" to open the dates for future guests!',
                validationKey: 'workflow-checkout',
                targetSelector: '#recent-bookings',
                coachText: '👋 Clear the booking to free up dates.',
            }
        ] as SubStep[]
    },
    {
        id: 'logo',
        emoji: '✨',
        title: 'Brand Identity',
        subtitle: 'Upload Your Logo',
        intro: 'A strong brand starts with a great logo! Let\'s upload yours to make the website officially yours.',
        actionLabel: 'Upload Website Logo ➜',
        visualType: 'builder',
        substeps: [
            {
                id: 'logo-find',
                emoji: '🔍',
                instruction: 'Locate the default logo in the top left corner',
                tip: 'Your logo appears in the navigation bar on every page.',
                validationKey: 'logo-find',
                targetSelector: '#onboarding-logo',
                coachText: '👀 Look up here!',
            },
            {
                id: 'logo-upload',
                emoji: '📤',
                instruction: 'Click the logo to open the media picker and upload yours',
                tip: 'Use a clear PNG with a transparent background for best results!',
                validationKey: 'logo-upload',
                targetSelector: '#onboarding-logo',
                coachText: '🖱️ Click to change it!',
            }
        ] as SubStep[]
    },
    {
        id: 'builder',
        emoji: '🖥️',
        title: 'Master Website Builder',
        subtitle: 'Hero Banner & Inline Editing',
        intro: 'Your website is fully customizable! Let\'s master the hero banner and inline editing tools.',
        actionLabel: 'Explore Website Builder ➜',
        visualType: 'builder',
        substeps: [
            {
                id: 'builder-text-edit',
                emoji: '✏️',
                instruction: 'Double-click any headline text to edit it inline',
                tip: 'Works on all headlines, taglines, descriptions, and button text throughout the entire page!',
                validationKey: 'builder-text-edit',
            },
            {
                id: 'builder-hero-upload',
                emoji: '🖼️',
                instruction: 'Open the Hero Section panel and upload your banner images',
                tip: 'Click the sidebar \'Hero Section\' accordion to add, replace, or remove hero slider images.',
                validationKey: 'builder-hero-upload',
            },
            {
                id: 'builder-hero-adjust',
                emoji: '🎯',
                instruction: 'Click \'Adjust Image\' to drag-reposition your hero photo',
                tip: 'Drag your hero image to frame the perfect crop. Use the zoom slider for close-ups!',
                validationKey: 'builder-hero-adjust',
            },
            {
                id: 'builder-hero-settings',
                emoji: '🌗',
                instruction: 'Set overlay opacity and text shadow for readability',
                tip: 'Darken the hero background so white text pops, and add soft or strong text shadows.',
                validationKey: 'builder-hero-settings',
            }
        ] as SubStep[]
    },
    {
        id: 'features',
        emoji: '🌟',
        title: 'Why Choose Us?',
        subtitle: 'Property Features & Amenities',
        intro: 'Highlight what makes your property special. Guests love seeing key amenities at a glance!',
        actionLabel: 'Edit Property Features ➜',
        visualType: 'features',
        substeps: [
            {
                id: 'features-find',
                emoji: '👀',
                instruction: 'Scroll to the "Why Choose Us" section',
                tip: 'It\'s right below the hero banner. Here you can highlight key selling points.',
                validationKey: 'features-find',
                targetSelector: '#feature-management-box',
                coachText: '🌟 Manage your features here!',
            },
            {
                id: 'features-add',
                emoji: '➕',
                instruction: 'Click "+ Add Point" to create a new feature',
                tip: 'Add things like "High-Speed WiFi", "Private Pool", or "Free Breakfast".',
                validationKey: 'features-add',
                targetSelector: '#feature-management-box',
                coachText: '➕ Click Add Point to add more!',
            },
            {
                id: 'features-icon',
                emoji: '🎨',
                instruction: 'Click any icon to change it',
                tip: 'Choose from a library of professional icons to match your feature.',
                validationKey: 'features-icon',
                targetSelector: '#feature-management-box',
                coachText: '🎨 Click an icon to swap it!',
            }
        ] as SubStep[]
    },
    {
        id: 'gallery',
        emoji: '🖼️',
        title: 'Gallery & Photos',
        subtitle: 'Property Photo Showcase',
        intro: 'Show off your property with a beautiful mosaic photo gallery visitors can browse.',
        actionLabel: 'Open Gallery Manager ➜',
        visualType: 'gallery',
        substeps: [
            {
                id: 'gallery-find',
                emoji: '👀',
                instruction: 'Scroll down to find the photo gallery section',
                tip: 'The gallery is in the \'About\' section — it shows a mosaic of your property photos.',
                validationKey: 'gallery-find',
            },
            {
                id: 'gallery-manage',
                emoji: '🎛️',
                instruction: 'Click any image or the \'Manage Gallery\' button to open the editor',
                tip: 'Choose from 5 different layouts: Classic Mosaic, 2-Column, 3-Column, Grid, or Panorama!',
                validationKey: 'gallery-manage',
            },
            {
                id: 'gallery-upload',
                emoji: '📸',
                instruction: 'Upload custom photos and reposition them',
                tip: 'Drag to reposition each photo, use zoom to adjust, or toggle \'Inherit from Rooms\' to auto-pull room photos.',
                validationKey: 'gallery-upload',
            }
        ] as SubStep[]
    },
    {
        id: 'social',
        emoji: '📲',
        title: 'Social Media Hotlinks',
        subtitle: 'Footer Contact & Social Links',
        intro: 'Connect your social profiles so guests can find and follow you on Facebook, Instagram, TikTok, and more.',
        actionLabel: 'Open Footer Socials ➜',
        visualType: 'social',
        substeps: [
            {
                id: 'social-panel-open',
                emoji: '📂',
                instruction: 'The Social & Links panel will auto-open in the sidebar',
                tip: 'This panel has toggle switches for Facebook, Instagram, TikTok, X, Airbnb, and custom links.',
                targetSelector: '[data-onboarding-target="social-accordion"]',
                coachText: '📂 This panel is auto-opened for you!',
                validationKey: 'social-panel-open',
            },
            {
                id: 'social-toggle',
                emoji: '🔘',
                instruction: 'Toggle ON/OFF which social icons appear in your footer',
                tip: 'Enable the platforms you use, disable the ones you don\'t — empty links are hidden from visitors.',
                targetSelector: '[data-onboarding-target="social-accordion"]',
                coachText: '🎚️ Toggle your social icons here',
                validationKey: 'social-toggle',
            },
            {
                id: 'social-url-set',
                emoji: '🔗',
                instruction: 'Scroll to the footer and click any social icon to paste your URL',
                tip: 'Click a social icon in the footer (e.g. Facebook) to open the URL editor popup.',
                targetSelector: '[data-onboarding-target="footer-facebook"]',
                coachText: '🔗 Click any icon to enter your profile URL',
                validationKey: 'social-url-set',
            }
        ] as SubStep[]
    },
    {
        id: 'map',
        emoji: '📍',
        title: 'Pin Location Map',
        subtitle: 'Google Map Navigation',
        intro: 'Help guests find your property with an interactive Google Maps embed.',
        actionLabel: 'Open Maps Section ➜',
        visualType: 'map',
        substeps: [
            {
                id: 'map-hover',
                emoji: '🗺️',
                instruction: 'Scroll to the \'Our Location\' section and hover over the map',
                tip: 'In edit mode, hovering the map reveals the location setup options.',
                targetSelector: '[data-onboarding-target="map-embed-container"]',
                coachText: '🗺️ Hover over the map to see editing options',
                validationKey: 'map-hover',
            },
            {
                id: 'map-search',
                emoji: '🔍',
                instruction: 'Click \'Search for Your Resort Location\' and type your address',
                tip: 'The built-in search will find your resort on Google Maps and auto-embed it!',
                validationKey: 'map-search',
            },
            {
                id: 'map-paste',
                emoji: '📋',
                instruction: 'Or paste a Google Maps embed code if search doesn\'t find your spot',
                tip: 'Go to maps.google.com → Share → Embed → Copy the iframe code and paste it here.',
                validationKey: 'map-paste',
            }
        ] as SubStep[]
    },
    {
        id: 'design',
        emoji: '🎨',
        title: 'Branding & Colors',
        subtitle: 'Theme & Typography',
        intro: 'Make your website uniquely yours with custom colors, fonts, and branding.',
        actionLabel: 'Open Theme Customizer ➜',
        visualType: 'design',
        substeps: [
            {
                id: 'design-panel-open',
                emoji: '🎨',
                instruction: 'The Theme & Colors panel will auto-open in the sidebar',
                tip: 'Browse through 18 luxury preset palettes or create your own custom brand.',
                targetSelector: '[data-onboarding-target="theme-accordion"]',
                coachText: '🎨 Theme panel is auto-opened!',
                validationKey: 'design-panel-open',
            },
            {
                id: 'design-preset',
                emoji: '🎭',
                instruction: 'Click any preset theme to instantly apply it',
                tip: 'Try \'Navy & Gold\' for a luxury feel, \'Ocean Breeze\' for tropical, or \'Emerald Luxe\' for nature vibes!',
                targetSelector: '[data-onboarding-target="theme-accordion"]',
                coachText: '🎨 Click any preset to apply it instantly',
                validationKey: 'design-preset',
            },
            {
                id: 'design-custom',
                emoji: '🖌️',
                instruction: 'Use the color pickers to set Primary, Hover, and Secondary colors',
                tip: 'Scroll below the presets to find individual color pickers for full custom control.',
                validationKey: 'design-custom',
            },
            {
                id: 'design-font',
                emoji: '🔤',
                instruction: 'Change the Global Font at the bottom of the theme panel',
                tip: 'Choose from Sans-Serif (modern), Serif (elegant), or Monospace (typewriter) typography.',
                validationKey: 'design-font',
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
        case 'overview':
            return (
                <div className="relative w-full h-20 md:h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex flex-col items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner p-2 select-none animate-fade-in">
                    <div className="w-[180px] bg-white dark:bg-gray-700 rounded-xl shadow-md border border-black/5 p-2 flex flex-col gap-1.5 scale-95 text-left">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-600 pb-1">
                            <span className="text-[5px] font-black uppercase text-gray-400">Occupancy & Revenue</span>
                            <span className="text-[5px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-1 py-0.2 rounded">Real-Time</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            <div className="bg-gray-50 dark:bg-gray-800/60 p-1 rounded border border-gray-100 dark:border-gray-700">
                                <div className="text-[4px] text-gray-400 font-bold">REVENUE</div>
                                <div className="text-[7px] font-black text-secondary dark:text-white mt-0.5">₱48,500</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/60 p-1 rounded border border-gray-100 dark:border-gray-700">
                                <div className="text-[4px] text-gray-400 font-bold">OCCUPANCY</div>
                                <div className="text-[7px] font-black text-secondary dark:text-white mt-0.5">85%</div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        case 'security':
            return (
                <div className="relative w-full h-20 md:h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex flex-col items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner p-2 select-none animate-fade-in">
                    <div className="w-[140px] bg-gray-900 rounded-xl shadow-lg border border-white/10 p-2 flex flex-col items-center gap-1 scale-95 text-center">
                        <div className="w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center mt-1 animate-pulse">
                            <span className="text-[10px] text-white">🔒</span>
                        </div>
                        <span className="text-[5px] font-bold text-gray-400 uppercase mt-0.5">Enter Admin Passcode</span>
                        <div className="flex gap-1.5 mt-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animationDelay: '0.2s' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                        </div>
                    </div>
                </div>
            );
        case 'workflow':
            return (
                <div className="relative w-full h-20 md:h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex flex-col items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner p-2 select-none animate-fade-in">
                    <div className="w-[190px] flex items-center justify-between gap-1 scale-[0.88] translate-y-0.5">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500 flex items-center justify-center text-[10px] text-blue-500 animate-pulse">📩</div>
                            <span className="text-[4px] font-black uppercase text-gray-500 mt-1">Pending</span>
                        </div>
                        <span className="text-gray-300 dark:text-gray-600 text-[8px] animate-pulse">➔</span>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center text-[10px] text-emerald-500">💳</div>
                            <span className="text-[4px] font-black uppercase text-gray-500 mt-1">Confirm</span>
                        </div>
                        <span className="text-gray-300 dark:text-gray-600 text-[8px] animate-pulse">➔</span>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500 flex items-center justify-center text-[10px] text-indigo-500">🔑</div>
                            <span className="text-[4px] font-black uppercase text-gray-500 mt-1">Check-in</span>
                        </div>
                        <span className="text-gray-300 dark:text-gray-600 text-[8px] animate-pulse">➔</span>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-6 h-6 rounded-full bg-gray-500/10 border border-gray-400 flex items-center justify-center text-[10px] text-gray-500">🧹</div>
                            <span className="text-[4px] font-black uppercase text-gray-500 mt-1">Checkout</span>
                        </div>
                    </div>
                </div>
            );
        case 'payment':
            return (
                <div className="relative w-full h-20 md:h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex flex-col items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner select-none animate-fade-in">
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
                <div className="relative w-full h-20 md:h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden p-3 shadow-inner animate-fade-in">
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
                <div className="relative w-full h-20 md:h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner p-2 animate-fade-in">
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
                <div className="relative w-full h-20 md:h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner p-4 animate-fade-in">
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
                <div className="relative w-full h-20 md:h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner animate-fade-in">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:14px_14px] opacity-30" />
                    <div className="absolute w-8 h-8 rounded-full border border-primary/40 bg-primary/10 animate-ripple flex items-center justify-center"></div>
                    <div className="relative z-10 animate-pin-drop">
                        <MapPin size={24} className="text-red-500 fill-red-500/20 drop-shadow-lg" />
                    </div>
                </div>
            );
        case 'design':
            return (
                <div className="relative w-full h-20 md:h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner animate-fade-in">
                    <div className="flex gap-3 items-center justify-center animate-phone-float">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-900 to-amber-500 shadow-md ring-2 ring-white/50 border border-black/10 scale-90" />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-400 shadow-lg ring-3 ring-white/70 border border-black/10 relative">
                            <span className="absolute -top-1 -right-1 bg-amber-400 text-[4px] font-black text-white px-1 py-0.5 rounded-full uppercase shadow animate-pulse">Live</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-300 shadow-md ring-2 ring-white/50 border border-black/10 scale-90" />
                    </div>
                </div>
            );
        case 'gallery':
            return (
                <div className="relative w-full h-20 md:h-24 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner p-2 animate-fade-in">
                    <div className="flex gap-1.5 items-center scale-[0.85]">
                        <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md border border-white/20 relative animate-phone-float">
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-cyan-300" />
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                <span className="text-white text-[8px] font-black uppercase tracking-wider">Photo 1</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="w-10 h-6 rounded-lg overflow-hidden shadow-sm border border-white/20 bg-gradient-to-br from-emerald-400 to-green-300 relative" style={{ animationDelay: '0.2s' }}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white text-[5px] font-black uppercase">Photo 2</span>
                                </div>
                            </div>
                            <div className="w-10 h-6 rounded-lg overflow-hidden shadow-sm border border-white/20 bg-gradient-to-br from-amber-400 to-orange-300 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white text-[5px] font-black uppercase">Photo 3</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-8 h-14 rounded-xl overflow-hidden shadow-md border border-white/20 bg-gradient-to-br from-purple-400 to-pink-300 relative animate-phone-float" style={{ animationDelay: '0.4s' }}>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white text-[5px] font-black uppercase tracking-wider rotate-90">Photo 4</span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-2 right-3 flex items-center gap-1">
                        <span className="text-[7px] font-black tracking-widest uppercase text-primary animate-pulse">Mosaic</span>
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
    const [isMinimized, setIsMinimized] = useState(false);
    const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1); // -1: Welcome Screen, 6: Celebration Screen
    const [direction, setDirection] = useState<'next' | 'prev'>('next');
    const [animationKey, setAnimationKey] = useState<number>(0);
    const [activeSubStepIdx, setActiveSubStepIdx] = useState<number>(0);
    const [showNiceBadge, setShowNiceBadge] = useState(false);
    const [phoneFlash, setPhoneFlash] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    
    // Micro-interactions state hooks
    const [isWiggling, setIsWiggling] = useState(false);
    const [activeToast, setActiveToast] = useState<{ stepId: string; title: string; emoji: string; } | null>(null);
    const [isHeroAdjustingActive, setIsHeroAdjustingActive] = useState(false);

    // Audio tracking references (retains active audio instance without triggering double-renders)
    const activeAudioRef = useRef<HTMLAudioElement | null>(null);

    // Voice Narrator Speak function (Hybrid Audio System)
    const speakText = useCallback((text: string, audioFile?: string) => {
        // 1. Cancel any active client-side speech synthesis
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        
        // 2. Pause and clear any currently active MP3 playback
        if (activeAudioRef.current) {
            activeAudioRef.current.pause();
            activeAudioRef.current = null;
        }

        // Helper: Upgraded premium neural Text-to-Speech fallback
        const speakWithFallback = (fallbackText: string) => {
            if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
            const utterance = new SpeechSynthesisUtterance(fallbackText);
            const voices = window.speechSynthesis.getVoices();
            
            // Aggressively prioritize ultra-realistic neural and online voice engines
            const preferredVoice = voices.find(v => {
                const nameLower = v.name.toLowerCase();
                const langLower = v.lang.toLowerCase();
                return langLower.startsWith('en') && (
                    nameLower.includes('natural') || 
                    nameLower.includes('neural') || 
                    nameLower.includes('online') || 
                    nameLower.includes('google us english') || 
                    nameLower.includes('samantha') ||
                    nameLower.includes('zira')
                );
            });
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            utterance.rate = 1.02; // Snappy and professional
            utterance.pitch = 1.02;
            window.speechSynthesis.speak(utterance);
        };

        // 3. Play pre-generated audio file if provided, otherwise run the natural speech engine
        if (audioFile) {
            const audioPath = `/audio/onboarding/${audioFile}`;
            const audio = new Audio(audioPath);
            activeAudioRef.current = audio;
            
            audio.play().catch((err) => {
                console.warn(`Premium audio ${audioFile} failed to play, falling back to speech synthesis:`, err);
                speakWithFallback(text);
            });
            
            audio.onerror = () => {
                console.warn(`Premium audio ${audioFile} was not found, falling back to speech synthesis.`);
                speakWithFallback(text);
            };
        } else {
            speakWithFallback(text);
        }
    }, []);

    // Clean up all audio/speech when modal is closed or component is unmounted
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            if (activeAudioRef.current) {
                activeAudioRef.current.pause();
                activeAudioRef.current = null;
            }
        };
    }, [isOpen]);

    // Speak welcome screen or celebration screen
    useEffect(() => {
        if (!voiceEnabled) {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            if (activeAudioRef.current) {
                activeAudioRef.current.pause();
                activeAudioRef.current = null;
            }
            return;
        }
        if (currentStepIdx === -1) {
            speakText("Welcome to Staycation! Let's configure your property. Click Let's Begin or Watch Video Guide to start.", "welcome.mp3");
        } else if (currentStepIdx === steps.length) {
            speakText("Congratulations! Your staycation website is fully set up, styled, and ready to take bookings. Great job!", "celebrate.mp3");
        }
    }, [currentStepIdx, voiceEnabled, speakText]);

    // Speak current step and sub-step
    useEffect(() => {
        if (!voiceEnabled || currentStepIdx < 0 || currentStepIdx >= steps.length) return;
        const step = steps[currentStepIdx];
        const subStep = step.substeps[activeSubStepIdx];
        if (subStep) {
            const speakString = `${subStep.instruction}. ${subStep.tip || ''}`;
            const audioFilename = `step-${currentStepIdx + 1}-sub-${activeSubStepIdx + 1}.mp3`;
            speakText(speakString, audioFilename);
        }
    }, [currentStepIdx, activeSubStepIdx, voiceEnabled, speakText]);

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
    // ─── Sub-Step Validation Engine ─────────────────────────────────────────
    const subStepValidation = useMemo(() => ({
        'overview-metrics': true,
        'overview-calendar': true,
        'overview-bookings': true,
        'deposit-why': true,
        'deposit-percentage': !!(settings?.reservationPolicy?.depositPercentage && settings?.reservationPolicy?.depositPercentage !== 50),
        'deposit-verify': true,
        'payment-gcash-name': !!(settings?.paymentMethods?.gcash?.accountName?.trim()),
        'payment-gcash-number': !!(settings?.paymentMethods?.gcash?.accountNumber?.trim()),
        'payment-saved': !!(
            settings?.paymentMethods?.gcash?.accountNumber?.trim() && 
            settings?.paymentMethods?.gcash?.accountName?.trim()
        ),
        'rooms-add': true, // Instructional
        'rooms-edit-click': true, // Instructional — always pass
        'rooms-photo-upload': !!(rooms && rooms.length > 0 && rooms.some(r => r.images && r.images.length > 0)),
        'rooms-price-set': !!(rooms && rooms.length > 0 && rooms.some(r => r.price > 0)),
        'passcode-find': true,
        'passcode-set': true, // Instructional
        'passcode-test': true,
        'workflow-pending': true,
        'workflow-confirm': true,
        'workflow-checkin': true,
        'workflow-checkout': true,
        // Logo
        'logo-find': true,
        'logo-upload': true,
        // Builder
        'builder-text-edit': true,
        'builder-hero-upload': true,
        'builder-hero-adjust': true,
        'builder-hero-settings': true,
        // Features
        'features-find': true,
        'features-add': true,
        'features-icon': true,
        // Gallery
        'gallery-find': true,
        'gallery-manage': true,
        'gallery-upload': true,
        // Social
        'social-panel-open': true,
        'social-toggle': true,
        'social-url': true,
        // Map
        'map-hover': true,
        'map-search': true,
        'map-paste': true,
        // Design
        'design-panel-open': true,
        'design-preset': true,
        'design-custom': true,
        'design-font': true,
    }), [settings, rooms]);

    // ─── Step-level completion (existing logic) ─────────────────────────────
    const stepCompletionMap = useMemo(() => {
        return {
            overview: true, // Educational — always complete
            deposit: !!(settings?.reservationPolicy?.depositPercentage && settings?.reservationPolicy?.depositPercentage !== 50),
            payment: !!(
                (settings?.paymentMethods?.gcash?.accountNumber?.trim() && settings?.paymentMethods?.gcash?.accountName?.trim()) ||
                (settings?.paymentMethods?.bankTransfer?.accountNumber?.trim() && settings?.paymentMethods?.bankTransfer?.accountName?.trim() && settings?.paymentMethods?.bankTransfer?.bankName?.trim())
            ),
            rooms: !!(
                rooms && rooms.length > 0 && 
                rooms.some(r => r.images && r.images.length > 0) &&
                rooms.some(r => r.price > 0)
            ),
            passcode: true, // Educational
            workflow: true, // Educational
            logo: true, // Educational
            builder: true, // Educational
            features: true, // Educational
            gallery: true, // Educational
            social: !!(
                (settings?.social?.facebook && settings?.social?.facebook !== 'facebook.com/serenitystay' && settings?.social?.facebook?.trim()?.length > 0) ||
                (settings?.social?.instagram && settings?.social?.instagram !== 'instagram.com/serenitystay' && settings?.social?.instagram?.trim()?.length > 0)
            ),
            map: !!(
                settings?.map?.embedUrl && 
                !settings?.map?.embedUrl?.includes('El%20Nido') &&
                settings?.map?.embedUrl?.trim()?.length > 0
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
            if (isStepDone(step.id) && !['overview', 'passcode', 'workflow', 'logo', 'builder', 'features', 'gallery', 'social', 'map', 'design'].includes(step.id)) {
                count++;
            }
        });
        return count;
    }, [stepCompletionMap]);

    const totalGoalSteps = 6;
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
        if (!isOpen || currentStepIdx < 0 || currentStepIdx >= steps.length) return;
        const stepId = steps[currentStepIdx].id;

        // Navigate to the correct admin tab or visual builder based on step ID
        switch (stepId) {
            case 'overview':
                onNavigate('overview');
                break;
            case 'deposit':
                onNavigate('rooms', 'global-deposit-rule');
                break;
            case 'payment':
                onNavigate('settings', 'settings-payment');
                break;
            case 'rooms':
                onNavigate('rooms');
                break;
            case 'passcode':
                onNavigate('settings', 'admin-passcode-section');
                break;
            case 'workflow':
                onNavigate('overview', 'recent-bookings');
                break;
            case 'logo':
            case 'builder':
                if (onEnterVisualBuilder) onEnterVisualBuilder();
                break;
            case 'features':
                if (onEnterVisualBuilder) onEnterVisualBuilder('about');
                break;
            case 'gallery':
                if (onEnterVisualBuilder) onEnterVisualBuilder('about');
                break;
            case 'social':
                if (onEnterVisualBuilder) onEnterVisualBuilder('footer');
                break;
            case 'map':
                if (onEnterVisualBuilder) onEnterVisualBuilder('contact');
                break;
            case 'design':
                if (onEnterVisualBuilder) onEnterVisualBuilder('theme');
                break;
            default:
                break;
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
        if (step.visualType === 'social' || step.visualType === 'map' || step.visualType === 'design' || step.visualType === 'builder' || step.visualType === 'gallery') {
            if (onEnterVisualBuilder) onEnterVisualBuilder(step.visualType === 'social' ? 'footer' : step.visualType === 'map' ? 'contact' : step.visualType === 'design' ? 'theme' : step.visualType === 'gallery' ? 'about' : undefined);
        } else {
            let tab = 'settings';
            let targetId: string | undefined = undefined;

            if (step.visualType === 'overview') {
                tab = 'overview';
            } else if (step.visualType === 'workflow') {
                tab = 'bookings';
            } else if (step.visualType === 'photos') {
                tab = 'rooms';
                if (step.id === 'rooms') {
                    targetId = 'first-room-edit';
                }
            } else if (step.id === 'deposit') {
                tab = 'settings';
                targetId = 'settings-payment';
            } else if (step.id === 'passcode') {
                tab = 'settings';
                targetId = 'admin-passcode-section';
            } else if (step.id === 'payment') {
                tab = 'settings';
                targetId = 'settings-payment';
            }

            onNavigate(tab, targetId);
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
                                // Toggle open — resume where we left off
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

            {/* ── Immersive Responsive Setup Wizard Modal ── */}
            {isOpen && (
                <>
                    {isMinimized ? (
                        /* Minimized Mobile Onboarding Dock */
                        <div className="fixed bottom-4 left-4 right-4 z-[120] bg-white/95 dark:bg-gray-950/95 rounded-2xl p-3 shadow-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between pointer-events-auto select-none gap-2 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                            {currentStepIdx >= 0 && currentStepIdx < steps.length ? (() => {
                                const step = steps[currentStepIdx];
                                const subStep = step.substeps[activeSubStepIdx];
                                const { completed, total } = getSubStepProgress(step);
                                return (
                                    <>
                                        <div className="flex-1 min-w-0 flex flex-col text-left px-1.5 py-0.5 font-sans">
                                            <div className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5 leading-none">
                                                <span>{step.emoji}</span>
                                                <span className="truncate max-w-[120px]">{step.title}</span>
                                                <span className="text-primary font-black">({completed}/{total})</span>
                                            </div>
                                            <p className="text-[11px] font-bold text-gray-850 dark:text-white truncate mt-1 leading-none">
                                                {subStep ? subStep.instruction : 'Setting up...'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 font-sans">
                                            <button 
                                                onClick={() => setVoiceEnabled(!voiceEnabled)} 
                                                className={`p-1.5 rounded-full transition-colors ${voiceEnabled ? 'text-primary bg-primary/5 hover:bg-primary/10' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                                title={voiceEnabled ? "Mute Narrator" : "Enable Narrator"}
                                            >
                                                {voiceEnabled ? <Volume2 size={13} className="animate-pulse" /> : <VolumeX size={13} />}
                                            </button>
                                            <button 
                                                onClick={goBack} 
                                                disabled={currentStepIdx === 0 && activeSubStepIdx === 0}
                                                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-primary transition-colors disabled:opacity-30"
                                                title="Previous step"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                            <button 
                                                onClick={goNext} 
                                                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-primary transition-colors"
                                                title="Next step"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                            <div className="w-[1px] h-4 bg-gray-250 dark:bg-gray-800 mx-0.5" />
                                            <button 
                                                onClick={() => setIsMinimized(false)} 
                                                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-primary hover:text-primary-hover transition-colors"
                                                title="Expand Guide"
                                            >
                                                <Maximize2 size={13} />
                                            </button>
                                            <button 
                                                onClick={() => { setIsOpen(false); setIsMinimized(false); }} 
                                                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-secondary dark:hover:text-white transition-colors"
                                                title="Close Guide"
                                            >
                                                <X size={13} />
                                            </button>
                                        </div>
                                    </>
                                );
                            })() : (
                                <>
                                    <div className="flex-1 text-left flex items-center gap-2 font-sans">
                                        <span className="text-sm">🚀</span>
                                        <span className="text-xs font-bold text-secondary dark:text-white">
                                            {currentStepIdx === -1 ? 'Get started with setup!' : 'All setup complete! 🎉'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 font-sans">
                                        <button 
                                            onClick={() => setIsMinimized(false)} 
                                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-primary hover:text-primary-hover transition-colors"
                                            title="Expand Guide"
                                        >
                                            <Maximize2 size={13} />
                                        </button>
                                        <button 
                                            onClick={() => { setIsOpen(false); setIsMinimized(false); }} 
                                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-secondary dark:hover:text-white transition-colors"
                                            title="Close Guide"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        /* Full Expanded Mobile & Desktop Onboarding Card */
                        <div className="fixed inset-0 pointer-events-none z-[115]">
                            <div className={`fixed bottom-4 left-4 right-4 w-auto h-auto max-h-[440px] md:max-h-none md:absolute md:fixed md:top-24 md:right-6 md:w-full md:max-w-[350px] md:h-[640px] bg-white/95 dark:bg-gray-950/95 md:bg-gray-950 rounded-3xl md:rounded-[48px] p-4 md:p-3.5 shadow-2xl md:shadow-[0_20px_50px_rgba(0,0,0,0.45)] border border-gray-200/80 dark:border-gray-800/80 md:border-4 md:border-gray-800/80 flex flex-col justify-center animate-slide-up select-none pointer-events-auto md:scale-95 z-[120] transition-shadow duration-300 ${phoneFlash ? 'green-flash-ring' : ''}`} onClick={(e) => e.stopPropagation()}>
                                <div className="hidden md:flex absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-[130] items-center justify-end px-2.5 pointer-events-none border border-white/5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-900 border border-gray-950 shrink-0"></span>
                                </div>
                                <div className="relative w-full h-full bg-white dark:bg-gray-900 md:rounded-[34px] rounded-2xl overflow-hidden flex flex-col md:border md:border-white/10 md:shadow-inner">
                                    <button 
                                        onClick={() => setIsMinimized(true)} 
                                        className="absolute top-2.5 right-[62px] text-gray-400 hover:text-secondary dark:hover:text-white transition-colors z-[130] p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                        title="Minimize Guide"
                                        aria-label="Minimize Guide"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <button 
                                        onClick={() => setVoiceEnabled(!voiceEnabled)} 
                                        className={`absolute top-2.5 right-9 transition-colors z-[130] p-1.5 rounded-full ${voiceEnabled ? 'text-primary hover:bg-primary/10 bg-primary/5' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                        title={voiceEnabled ? "Mute Voice Narrator" : "Enable Voice Narrator"}
                                        aria-label="Toggle Voice Assistant"
                                    >
                                        {voiceEnabled ? (
                                            <div className="relative">
                                                <Volume2 size={14} className="animate-pulse" />
                                                <span className="absolute -inset-1 rounded-full border border-primary/40 animate-ping opacity-60 pointer-events-none" />
                                            </div>
                                        ) : (
                                            <VolumeX size={14} />
                                        )}
                                    </button>
                                    <button onClick={() => setIsOpen(false)} className="absolute top-2.5 right-2.5 text-gray-400 hover:text-secondary dark:hover:text-white transition-colors z-[130] p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close Guide">
                                        <X size={14} />
                                    </button>
                                    <div className="hidden md:flex h-9 shrink-0 px-6 pt-3 justify-between items-center text-[10px] font-bold text-gray-400 dark:text-gray-500 pointer-events-none select-none z-[125]">
                                        <span>9:41 AM 📱</span>
                                        <div className="flex items-center gap-1.5 mr-6">
                                            <span>📶</span>
                                            <span>🔋 100%</span>
                                        </div>
                                    </div>
                                    {currentStepIdx >= 0 && currentStepIdx < steps.length && (
                                        <div className="px-6 pr-12 md:pr-6 py-2 shrink-0 flex justify-between items-center select-none z-[125]">
                                            <button onClick={goBack} className="text-gray-400 hover:text-primary transition-colors flex items-center text-[10px] font-black uppercase tracking-wider">
                                                <ArrowLeft size={10} className="mr-0.5" /> Back
                                            </button>
                                            <div className="flex gap-1.5">
                                                {steps.map((_, sIdx) => (
                                                    <span key={sIdx} className={`h-1.5 rounded-full transition-all duration-300 ${sIdx === currentStepIdx ? 'w-5 bg-primary' : isStepDone(steps[sIdx].id) ? 'w-2 bg-emerald-500' : 'w-1.5 bg-gray-250 dark:bg-gray-700'}`} />
                                                ))}
                                            </div>
                                            <button onClick={goNext} className="text-gray-400 hover:text-primary transition-colors flex items-center text-[10px] font-black uppercase tracking-wider">
                                                Skip <ArrowRight size={10} className="ml-0.5" />
                                            </button>
                                        </div>
                                    )}
                                    <div key={animationKey} className={`flex-1 flex flex-col justify-between p-4 md:p-5 overflow-y-auto ${direction === 'next' ? 'animate-slide-next' : 'animate-slide-prev'}`}>
                                        {currentStepIdx === -1 && (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center py-2 md:py-4">
                                                <div className="w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-[28px] bg-gradient-to-br from-primary via-blue-500 to-indigo-600 flex items-center justify-center text-2xl md:text-4xl shadow-2xl relative animate-phone-float mb-2 md:mb-5 ring-2 md:ring-4 ring-white dark:ring-gray-800 shrink-0">
                                                    <Rocket className="text-white w-6 h-6 md:w-9 md:h-9" />
                                                    <div className="absolute -top-1 -right-1 flex h-3 w-3 md:h-4 md:w-4 animate-ping rounded-full bg-primary/60" />
                                                </div>
                                                <h3 className="text-sm md:text-lg font-black text-secondary dark:text-white leading-tight tracking-tight px-1 font-sans">
                                                    Interactive Setup Guide!
                                                </h3>
                                                <p className="text-[10px] md:text-[11px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed max-w-[240px] mt-1 md:mt-3 font-sans">
                                                    I'll walk you through every single step of configuring your staycation website — from payment setup to custom branding.
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-2 w-full mt-3 md:mt-5 shrink-0">
                                                    <button onClick={() => setIsVideoOpen(true)} className="flex-1 py-2.5 md:py-3 rounded-xl md:rounded-2xl border-2 border-primary/20 hover:border-primary/45 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans">
                                                        📺 Watch Video Guide
                                                    </button>
                                                    <button onClick={goNext} className="flex-1 py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans">
                                                        Let's Begin! <ArrowRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {currentStepIdx >= 0 && currentStepIdx < steps.length && (() => {
                                            const step = steps[currentStepIdx];
                                            const done = isStepDone(step.id);
                                            const { completed, total } = getSubStepProgress(step);
                                            const progressPercent = Math.round((completed / total) * 100);
                                            return (
                                                <div className="flex-1 flex flex-col justify-between h-full gap-2 md:gap-3 font-sans">
                                                    <div className="space-y-2 md:space-y-3 flex-1">
                                                        <div className="text-center">
                                                            <h3 className="text-xs md:text-sm font-black text-secondary dark:text-white leading-tight flex items-center justify-center gap-1.5 font-sans">
                                                                <span className="text-base md:text-lg">{step.emoji}</span>
                                                                {step.title}
                                                                {done && !['overview', 'passcode', 'workflow', 'builder'].includes(step.id) && <CheckCircle2 size={13} className="text-emerald-500 md:w-3.5 md:h-3.5" />}
                                                            </h3>
                                                            <p className="text-[7px] md:text-[8px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5 font-sans">{step.subtitle}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-1">
                                                            <div className="flex-1 h-1 md:h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                                <div className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
                                                            </div>
                                                            <span className="text-[8px] md:text-[9px] font-black text-gray-400 shrink-0">{completed}/{total}</span>
                                                        </div>
                                                        <div className="w-full">
                                                            {renderVisualMockup(step.visualType)}
                                                        </div>
                                                        <div className="space-y-1 md:space-y-1.5">
                                                            {step.substeps.map((sub, subIdx) => {
                                                                const isSubDone = subStepValidation[sub.validationKey as keyof typeof subStepValidation];
                                                                const isActive = subIdx === activeSubStepIdx;
                                                                return (
                                                                    <button key={sub.id} onClick={() => setActiveSubStepIdx(subIdx)} className={`w-full text-left rounded-lg md:rounded-xl p-2 md:p-2.5 border transition-all duration-300 ${isActive ? 'bg-primary/5 dark:bg-primary/10 border-primary/30 substep-active-pulse' : isSubDone ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30' : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800'}`}>
                                                                        <div className="flex items-start gap-1.5 md:gap-2">
                                                                            <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${isSubDone ? 'bg-emerald-500 text-white substep-complete-bounce' : isActive ? 'bg-primary/20 border-2 border-primary' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                                                {isSubDone ? <Check size={9} strokeWidth={3} className="md:w-2.5 md:h-2.5" /> : <span className="text-[7px] md:text-[8px] font-black text-gray-500 dark:text-gray-400">{sub.emoji}</span>}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className={`text-[10px] md:text-[11px] font-bold leading-tight ${isSubDone ? 'text-emerald-600 dark:text-emerald-400 line-through opacity-70' : isActive ? 'text-secondary dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                                    {isActive && !isSubDone ? <TypewriterText text={sub.instruction} /> : sub.instruction}
                                                                                </div>
                                                                                {isActive && sub.tip && <p className="text-[8px] md:text-[9px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 leading-snug animate-fade-in">💡 {sub.tip}</p>}
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        {showNiceBadge && (
                                                            <div className="flex justify-center">
                                                                <div className="nice-badge-pop bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg border border-white/20 flex items-center gap-1">
                                                                    <Sparkles size={10} /> Nice work! ✨
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="shrink-0 pt-0.5">
                                                        <button onClick={goNext} className="w-full py-2 md:py-2.5 rounded-lg md:rounded-xl bg-primary hover:bg-primary-hover text-white text-[10px] md:text-xs font-black shadow-lg shadow-primary/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans">
                                                            Continue to Next Step <ChevronRight size={12} className="md:w-3.5 md:h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* 3. CELEBRATION SCREEN */}
                                        {currentStepIdx === steps.length && (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center py-2 md:py-6 h-full font-sans">
                                                
                                                <div className="relative w-full h-16 md:h-32 bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-blue-500/10 rounded-xl md:rounded-2xl flex flex-col items-center justify-center border border-emerald-500/20 overflow-hidden shadow-inner select-none mb-2 md:mb-4 animate-phone-float shrink-0">
                                                    <div className="absolute inset-0 flex items-center justify-center animate-rotate-sparkle pointer-events-none">
                                                        <Sparkles size={160} className="text-amber-400/15" />
                                                    </div>
                                                    <Trophy className="text-amber-500 fill-amber-500/10 drop-shadow-[0_10px_20px_rgba(245,158,11,0.25)] w-8 h-8 md:w-11 md:h-11" />
                                                    <div className="mt-1 md:mt-2 flex items-center gap-1 bg-emerald-500/15 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/25">
                                                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        <span className="text-[7px] md:text-[8px] font-black tracking-wide uppercase text-emerald-600 dark:text-emerald-400">All Set!</span>
                                                    </div>
                                                </div>

                                                <h3 className="text-sm md:text-lg font-black text-secondary dark:text-white leading-tight">
                                                    Your Website is Live!
                                                </h3>
                                                
                                                <p className="text-[10px] md:text-[11px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed max-w-[260px] mt-1 md:mt-2.5">
                                                    Congratulations! Your beautiful staycation villa is fully configured and ready to secure payouts directly to your account.
                                                </p>

                                                {/* Completed checklist summary */}
                                                <div className="hidden md:block w-full mt-4 space-y-1">
                                                    {steps.filter(s => s.id !== 'builder').map(step => (
                                                        <div key={step.id} className="flex items-center gap-2 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg px-3 py-1.5 border border-emerald-200/30 dark:border-emerald-800/20">
                                                            <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{step.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                <button
                                                    onClick={() => setIsOpen(false)}
                                                    className="w-full mt-3 md:mt-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 hover:scale-[1.02] transition-all flex items-center justify-center gap-1 cursor-pointer border border-white/10 shrink-0"
                                                >
                                                    Start Booking Manager 🚀
                                                </button>
                                            </div>
                                        )}

                                    </div>
                                </div>
                                
                                {/* Mock home indicator */}
                                <div className="hidden md:block absolute bottom-5 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-800 rounded-full z-[130] pointer-events-none"></div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Animated Video Walkthrough */}
            {isVideoOpen && (
                <AnimatedWalkthrough
                    onClose={() => setIsVideoOpen(false)}
                    onStartGuide={() => { setIsVideoOpen(false); goNext(); }}
                />
            )}

            {/* Custom Animations */}
            <style>{`
                @keyframes scale-up {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

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