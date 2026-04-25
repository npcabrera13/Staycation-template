import React, { useState, useRef, useEffect } from 'react';
import { Settings, Room } from '../types';
import { ChevronRight, ChevronLeft, Sparkles, PartyPopper, Check, MapPin, Phone, Mail, Home, MessageSquare } from 'lucide-react';

interface SetupWizardProps {
    settings: Settings;
    rooms: Room[];
    onUpdateSettings: (settings: Settings) => Promise<void>;
    onUpdateRoom?: (roomId: string, updates: Partial<Room>) => Promise<void>;
    onEnterAdmin: () => void;
}

// Curated color presets — each is a full theme
const COLOR_PRESETS = [
    { name: 'Ocean Blue', primary: '#1B6FA8', secondary: '#1B2A4A', accent: '#4ECDC4' },
    { name: 'Forest Green', primary: '#2D7D46', secondary: '#1A3A2A', accent: '#6BCB77' },
    { name: 'Sunset Gold', primary: '#D4A017', secondary: '#2A2520', accent: '#F5C542' },
    { name: 'Rose Pink', primary: '#C2185B', secondary: '#2A1A24', accent: '#F06292' },
    { name: 'Royal Purple', primary: '#6A1B9A', secondary: '#1E1A2E', accent: '#AB47BC' },
    { name: 'Coral Reef', primary: '#E85D3A', secondary: '#2A1E1A', accent: '#FF8A65' },
    { name: 'Slate Modern', primary: '#455A64', secondary: '#1A1E22', accent: '#78909C' },
    { name: 'Teal Fresh', primary: '#00838F', secondary: '#1A2A2E', accent: '#4DB6AC' },
    { name: 'Lavender Dreams', primary: '#7C3AED', secondary: '#1E1B4B', accent: '#DDD6FE' },
    { name: 'Midnight Slate', primary: '#0F172A', secondary: '#020617', accent: '#334155' },
    { name: 'Desert Mirage', primary: '#92400E', secondary: '#451A03', accent: '#FDE68A' },
    { name: 'Tropical Mint', primary: '#065F46', secondary: '#064E3B', accent: '#A7F3D0' },
    { name: 'Coffee Roast', primary: '#4B2C20', secondary: '#3E2723', accent: '#D7CCC8' },
    { name: 'Berry Blast', primary: '#831843', secondary: '#500724', accent: '#fce7f3' },
];

const SetupWizard: React.FC<SetupWizardProps> = ({
    settings,
    rooms,
    onUpdateSettings,
    onUpdateRoom,
    onEnterAdmin,
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState<'next' | 'prev'>('next');
    const [isAnimating, setIsAnimating] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Draft form state (doesn't save until "Next")
    const [businessName, setBusinessName] = useState(
        settings.siteName === 'Serenity Staycation' ? '' : settings.siteName
    );
    const [heroTagline, setHeroTagline] = useState(settings.hero?.tagline || '');
    const [heroSubtitle, setHeroSubtitle] = useState(settings.hero?.subtitle || '');
    const [selectedColorIdx, setSelectedColorIdx] = useState<number | null>(null);
    const [phone, setPhone] = useState(settings.contact?.phone || '');
    const [email, setEmail] = useState(settings.contact?.email || '');
    const [address, setAddress] = useState(settings.contact?.address || '');
    const [mapEmbedUrl, setMapEmbedUrl] = useState(settings.map?.embedUrl || '');
    const [roomNames, setRoomNames] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        rooms.forEach(r => { initial[r.id] = r.name; });
        return initial;
    });

    const inputRef = useRef<HTMLInputElement>(null);

    const TOTAL_STEPS = 6; // 0-5: Name, Message, Colors, Contact, Location, Success

    // Auto-focus inputs when step changes
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 400);
        return () => clearTimeout(timer);
    }, [currentStep]);

    // Trigger confetti on final step
    useEffect(() => {
        if (currentStep === 5) {
            setTimeout(() => setShowConfetti(true), 300);
        }
    }, [currentStep]);

    const goNext = async () => {
        if (isAnimating) return;

        // Only save to Firestore on the LAST data-entry step (Step 4 → "Finish")
        if (currentStep === 4) {
            // 1. Update Settings
            const updated = JSON.parse(JSON.stringify(settings)) as Settings;
            
            // Sync Branding
            if (businessName.trim()) {
                updated.siteName = businessName.trim();
                if (!updated.hero) updated.hero = {} as any;
                updated.hero.title = businessName.trim();
                
                // Sync "Why Choose [Resort Name]?" section
                if (!updated.about) updated.about = {} as any;
                updated.about.subtitle = `${businessName.trim()}?`;
            }
            if (heroTagline.trim()) updated.hero.tagline = heroTagline.trim();
            if (heroSubtitle.trim()) updated.hero.subtitle = heroSubtitle.trim();

            // Sync Colors
            if (selectedColorIdx !== null) {
                const preset = COLOR_PRESETS[selectedColorIdx];
                updated.theme = {
                    ...updated.theme,
                    primaryColor: preset.primary,
                    secondaryColor: preset.secondary,
                    accentColor: preset.accent,
                };
            }

            // Sync Contact
            updated.contact = {
                ...updated.contact,
                phone: phone.trim(),
                email: email.trim(),
                address: address.trim(),
            };

            // Sync Map
            if (!updated.map) updated.map = { embedUrl: '' };
            updated.map.embedUrl = mapEmbedUrl.trim();

            // Sync Email to Admin Notifications
            if (!updated.notifications) {
                updated.notifications = {
                    adminEmail: email.trim(),
                    sendUserConfirmation: true,
                    sendAdminAlert: true,
                    sendCheckInReminder: true,
                };
            } else {
                updated.notifications.adminEmail = email.trim();
            }

            // Enable Admin Onboarding (Rocket Icon) in the dashboard
            updated.setupComplete = true;

            // Save Settings
            await onUpdateSettings(updated);
            localStorage.setItem('justFinishedWizard', 'true');
            window.dispatchEvent(new Event('wizardCompleted'));

            // 2. Room Photos tutorial: In the Admin Panel, we tell them to head there.
            // Simplified: Removing Room naming from wizard to speed up onboarding.
        }

        if (currentStep < TOTAL_STEPS - 1) {
            setDirection('next');
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
                setIsAnimating(false);
            }, 300);
        }
    };

    const goBack = () => {
        if (isAnimating || currentStep === 0) return;
        setDirection('prev');
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentStep(prev => prev - 1);
            setIsAnimating(false);
        }, 300);
    };

    const canProceed = () => {
        if (currentStep === 0) return businessName.trim().length > 0;
        if (currentStep === 1) return heroTagline.trim().length > 0;
        if (currentStep === 2) return selectedColorIdx !== null;
        if (currentStep === 3) return phone.trim().length > 0 || email.trim().length > 0;
        if (currentStep === 4) return address.trim().length > 0;
        return true;
        return true;
    };

    // Render each step's content
    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="flex flex-col items-center text-center px-4">
                        <div className="text-5xl md:text-6xl mb-6 animate-bounce">👋</div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                            What's your business called?
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-8 max-w-md">
                            This will appear in your logo, navbar, and hero section.
                        </p>
                        <input
                            ref={inputRef}
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && canProceed() && goNext()}
                            placeholder="e.g. Paradise Beach Resort"
                            className="w-full max-w-md text-center text-xl md:text-2xl font-semibold py-4 px-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary outline-none transition-all placeholder:text-gray-300 shadow-sm"
                        />
                    </div>
                );

            case 1:
                return (
                    <div className="flex flex-col items-center text-center px-4">
                        <div className="text-5xl md:text-6xl mb-6">✨</div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                            Your Mission
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-8 max-w-md">
                            Set the mood of your landing page with a catchy tagline.
                        </p>
                        <div className="w-full max-w-md space-y-4">
                            <div className="text-left">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Short Tagline (e.g. Welcome to Paradise)</label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={heroTagline}
                                    onChange={(e) => setHeroTagline(e.target.value)}
                                    placeholder="Welcome to Paradise"
                                    className="w-full text-lg py-3 px-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="text-left">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Longer Subtitle</label>
                                <textarea
                                    value={heroSubtitle}
                                    onChange={(e) => setHeroSubtitle(e.target.value)}
                                    placeholder="Experience the peak of luxury and serenity at our premium staycation spots."
                                    className="w-full text-lg py-3 px-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary outline-none transition-all min-h-[100px] resize-none"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="flex flex-col items-center text-center px-4">
                        <div className="text-5xl md:text-6xl mb-6">🎨</div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                            Pick your vibe
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-8 max-w-md">
                            Choose a color theme that matches your brand.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
                            {COLOR_PRESETS.map((preset, idx) => (
                                <button
                                    key={preset.name}
                                    onClick={() => setSelectedColorIdx(idx)}
                                    className={`relative group flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 ${selectedColorIdx === idx
                                        ? 'border-primary shadow-lg shadow-primary/30 scale-[1.03] bg-primary/5 dark:bg-gray-800'
                                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 bg-white dark:bg-gray-800'
                                    }`}
                                >
                                    <div className="flex gap-1.5 mb-2.5">
                                        <div className="w-8 h-8 rounded-full border border-black/10" style={{ backgroundColor: preset.primary }} />
                                        <div className="w-8 h-8 rounded-full border border-black/10" style={{ backgroundColor: preset.secondary }} />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{preset.name}</span>
                                    {selectedColorIdx === idx && (
                                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                                            <Check size={14} className="text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="flex flex-col items-center text-center px-4">
                        <div className="text-5xl md:text-6xl mb-6">📱</div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                            How can guests reach you?
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-8 max-w-md">
                            Add your contact details for bookings and inquiries.
                        </p>
                        <div className="w-full max-w-md space-y-4">
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    ref={inputRef}
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Phone Number"
                                    className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary outline-none rounded-2xl transition-all shadow-sm"
                                />
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email Address"
                                    className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary outline-none rounded-2xl transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="flex flex-col items-center text-center px-4">
                        <div className="text-5xl md:text-6xl mb-6">📍</div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                            Where to find you
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-8 max-w-md">
                            Add your address so guests know exactly where to go.
                        </p>
                        <div className="w-full max-w-md">
                            <div className="text-left bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-2 text-primary">
                                    <MapPin size={14} />
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Full Address</label>
                                </div>
                                <textarea
                                    ref={inputRef as any}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="e.g. 123 Beach Road, El Nido, Palawan"
                                    className="w-full bg-transparent outline-none py-1 text-lg font-medium resize-none min-h-[100px]"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-4 text-center">You can set up your Google Maps embed later in the Admin Panel.</p>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="flex flex-col items-center text-center px-4 relative">
                        {showConfetti && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <style>{`
                                    @keyframes confetti-fall {
                                        0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
                                        100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
                                    }
                                    .confetti-piece { position: absolute; width: 10px; height: 10px; top: -10px; animation: confetti-fall 3s ease-out forwards; }
                                `}</style>
                                {Array.from({ length: 40 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="confetti-piece"
                                        style={{
                                            left: `${Math.random() * 100}%`,
                                            animationDelay: `${Math.random() * 1.5}s`,
                                            animationDuration: `${2 + Math.random() * 2}s`,
                                            backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F59E0B', '#34D399'][i % 6],
                                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                                            width: `${6 + Math.random() * 8}px`,
                                            height: `${6 + Math.random() * 8}px`,
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="text-6xl md:text-7xl mb-6 scale-110">🎉</div>
                        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 mb-4 animate-pop">
                            Congratulations! 🚀
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl mb-8 max-w-md leading-relaxed font-medium">
                            Your beautiful website for <strong className="text-gray-900 dark:text-white">{businessName || settings.siteName}</strong> is now live!
                            <br /><br />
                            <span className="text-sm text-gray-500 font-normal">Let's head over to the Admin Panel to finish setting up your payment methods and room photos.</span>
                        </p>

                        <div className="flex flex-col gap-3 w-full max-w-sm">
                            <button
                                onClick={onEnterAdmin}
                                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 text-lg"
                            >
                                Go to Admin Panel <ChevronRight size={20} />
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-4 px-6 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                            >
                                View My Site First
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
            {/* Backdrop — homepage visible behind */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />

            <style>{`
                @keyframes slide-in-right { from { transform: translateX(80px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slide-in-left { from { transform: translateX(-80px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slide-out-left { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-80px); opacity: 0; } }
                @keyframes slide-out-right { from { transform: translateX(0); opacity: 1; } to { transform: translateX(80px); opacity: 0; } }
                .wizard-enter-next { animation: slide-in-right 0.3s ease-out both; }
                .wizard-enter-prev { animation: slide-in-left 0.3s ease-out both; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
            `}</style>

            <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto mx-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/30 dark:border-gray-700/50">
                {/* Progress bars instead of dots for modern look */}
                <div className="flex gap-1.5 px-8 pt-8 pb-2">
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-700 ${i <= currentStep ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-800'}`}
                        />
                    ))}
                </div>
                <div className="flex justify-between px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Branding</span>
                    <span>Profile</span>
                    <span>Ready</span>
                </div>

                {/* Step content */}
                <div className="py-8 px-6 md:px-12 min-h-[420px] flex items-center justify-center">
                    <div
                        key={currentStep}
                        className={`w-full ${direction === 'next' ? 'wizard-enter-next' : 'wizard-enter-prev'}`}
                    >
                        {renderStep()}
                    </div>
                </div>

                {/* Navigation buttons */}
                {currentStep < 5 && (
                    <div className="px-8 pb-10 flex items-center justify-between gap-4">
                        <div className="w-1/4">
                            {currentStep > 0 && (
                                <button
                                    onClick={goBack}
                                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-all p-2 -ml-2"
                                >
                                    <ChevronLeft size={18} /> Back
                                </button>
                            )}
                        </div>
                        
                        <button
                            onClick={goNext}
                            disabled={!canProceed()}
                            className={`flex-1 max-w-[200px] py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${currentStep === 4 ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-200' : 'bg-gray-900 hover:bg-black text-white'} disabled:opacity-20 disabled:cursor-not-allowed`}
                        >
                            {currentStep === 4 ? 'Finish & Launch' : 'Continue'} <ChevronRight size={18} />
                        </button>

                        <div className="w-1/4 text-right text-[10px] text-gray-300 font-bold uppercase tracking-widest hidden sm:block">
                            Step {currentStep + 1} / {TOTAL_STEPS}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SetupWizard;
