import React from 'react';
import { CheckCircle, Circle, Sparkles, ArrowRight, Palette, BedDouble, CreditCard, Phone, Image, Globe, MapPin, X, PartyPopper } from 'lucide-react';
import { Settings } from '../../types';
import { Room } from '../../types';

interface QuickStartStep {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    tab: 'settings' | 'rooms' | 'visual';
    scrollTarget?: string;
    isComplete: (settings: Settings, rooms: Room[]) => boolean;
}

interface QuickStartGuideProps {
    settings: Settings;
    rooms: Room[];
    onNavigate: (tab: 'settings' | 'rooms' | 'visual', scrollTarget?: string) => void;
    onDismiss: () => void;
}

const STEPS: QuickStartStep[] = [
    {
        id: 'site-name',
        icon: Globe,
        title: 'Set your business name',
        description: 'Give your site its own identity.',
        tab: 'settings',
        scrollTarget: 'settings-brand',
        isComplete: (s) => !!s.siteName && s.siteName !== 'Serenity Staycation',
    },
    {
        id: 'hero-image',
        icon: Image,
        title: 'Upload hero photos',
        description: 'Show off your beautiful property.',
        tab: 'visual',
        isComplete: (s) =>
            !!(s.hero?.image && !s.hero.image.includes('photo-1542314831-068cd1dbfeeb')),
    },
    {
        id: 'theme',
        icon: Palette,
        title: 'Pick your brand colors',
        description: 'Match your unique brand vibe.',
        tab: 'visual',
        isComplete: (s) =>
            !!(s.theme?.primaryColor && s.theme.primaryColor !== '#1B2A4A'),
    },
    {
        id: 'rooms',
        icon: BedDouble,
        title: 'Add your first room',
        description: 'Create a listing with photos & pricing.',
        tab: 'rooms',
        isComplete: (_, rooms) => rooms.length > 0,
    },
    {
        id: 'payment',
        icon: CreditCard,
        title: 'Set up payments',
        description: 'Add your e-wallet or bank details.',
        tab: 'settings',
        scrollTarget: 'settings-payment',
        isComplete: (s) =>
            !!(s.paymentMethods?.gcash?.qrImage || s.paymentMethods?.bankTransfer?.accountNumber),
    },
    {
        id: 'contact',
        icon: Phone,
        title: 'Add contact info',
        description: 'Let guests reach you easily.',
        tab: 'settings',
        scrollTarget: 'settings-contact',
        isComplete: (s) => !!(s.contact?.phone || s.contact?.email),
    },
    {
        id: 'social',
        icon: Globe,
        title: 'Connect social media',
        description: 'Link Facebook, Instagram & more.',
        tab: 'settings',
        scrollTarget: 'settings-social',
        isComplete: (s) =>
            !!(s.social?.facebook || s.social?.instagram || s.social?.tiktok),
    },
    {
        id: 'map',
        icon: MapPin,
        title: 'Pin your location',
        description: 'Help guests find you on the map.',
        tab: 'settings',
        scrollTarget: 'settings-map',
        isComplete: (s) =>
            !!(s.map?.embedUrl && !s.map.embedUrl.includes('El%20Nido')),
    },
];

const QuickStartGuide: React.FC<QuickStartGuideProps> = ({
    settings,
    rooms,
    onNavigate,
    onDismiss,
}) => {
    const completedSteps = STEPS.filter((step) => step.isComplete(settings, rooms));
    const completedCount = completedSteps.length;
    const totalCount = STEPS.length;
    const progress = Math.round((completedCount / totalCount) * 100);
    const allDone = completedCount === totalCount;

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 md:p-8 animate-fade-in">
            {/* Backdrop — lets the homescreen shine through */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onClick={onDismiss} />

            {/* Floating sparkle particles (CSS-only) */}
            <style>{`
                @keyframes float-up {
                    0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(-120px) scale(0.3) rotate(180deg); opacity: 0; }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .sparkle-particle {
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    animation: float-up 3s ease-out infinite;
                }
                .sparkle-particle:nth-child(1) { left: 10%; bottom: 20%; animation-delay: 0s; background: #FFD700; }
                .sparkle-particle:nth-child(2) { left: 25%; bottom: 30%; animation-delay: 0.5s; background: #FF6B6B; }
                .sparkle-particle:nth-child(3) { left: 50%; bottom: 15%; animation-delay: 1s; background: #4ECDC4; }
                .sparkle-particle:nth-child(4) { left: 70%; bottom: 25%; animation-delay: 1.5s; background: #FFD700; }
                .sparkle-particle:nth-child(5) { left: 85%; bottom: 35%; animation-delay: 2s; background: #FF6B6B; }
                .sparkle-particle:nth-child(6) { left: 40%; bottom: 40%; animation-delay: 0.3s; background: #A78BFA; }
                .shimmer-text {
                    background: linear-gradient(90deg, #FFD700, #FF8C00, #FFD700, #FF6B6B, #FFD700);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 3s linear infinite;
                }
            `}</style>

            {/* The main glassmorphism card */}
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50">
                
                {/* Sparkle particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
                    <div className="sparkle-particle"></div>
                    <div className="sparkle-particle"></div>
                    <div className="sparkle-particle"></div>
                    <div className="sparkle-particle"></div>
                    <div className="sparkle-particle"></div>
                    <div className="sparkle-particle"></div>
                </div>

                {/* Close button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-all"
                    title="Skip for now"
                >
                    <X size={18} />
                </button>

                {/* Header — Celebration Zone */}
                <div className="relative px-6 md:px-10 pt-8 md:pt-10 pb-6 text-center overflow-hidden">
                    {/* Gradient glow behind the header */}
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-50/80 via-transparent to-transparent dark:from-amber-900/20 pointer-events-none" />

                    <div className="relative">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border border-amber-200/60 dark:border-amber-700/40 mb-4">
                            <Sparkles size={14} className="text-amber-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
                                {allDone ? 'All Done!' : 'Almost There'}
                            </span>
                            <Sparkles size={14} className="text-amber-500" />
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                            {allDone ? (
                                <span className="shimmer-text">You're all set! Time to go live 🚀</span>
                            ) : (
                                <>
                                    Your dream staycation site is
                                    <br />
                                    <span className="shimmer-text">almost ready!</span> ✨
                                </>
                            )}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-lg mx-auto">
                            {allDone
                                ? "Every step is complete. Your booking site is fully configured and ready to welcome guests."
                                : "Just a few quick steps to launch your beautiful new booking site. Each one takes under a minute!"}
                        </p>

                        {/* Progress bar */}
                        <div className="mt-5 max-w-sm mx-auto">
                            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                                <span className="text-gray-500 dark:text-gray-400">{completedCount} of {totalCount} complete</span>
                                <span className={`${allDone ? 'text-green-500' : 'text-amber-500'} font-bold`}>{progress}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${allDone
                                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                        : 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400'
                                    }`}
                                    style={{ width: `${Math.max(progress, 3)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step Grid */}
                <div className="px-4 md:px-8 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {STEPS.map((step) => {
                            const done = step.isComplete(settings, rooms);
                            const Icon = step.icon;
                            return (
                                <button
                                    key={step.id}
                                    onClick={() => !done && onNavigate(step.tab, step.scrollTarget)}
                                    className={`relative flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-200 group border ${done
                                        ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200/60 dark:border-green-800/40 cursor-default'
                                        : 'bg-white dark:bg-gray-800/60 border-gray-200/80 dark:border-gray-700/60 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-lg hover:shadow-amber-100/50 dark:hover:shadow-amber-900/20 hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]'
                                    }`}
                                >
                                    {/* Icon */}
                                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${done
                                        ? 'bg-green-100 dark:bg-green-800/40'
                                        : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-orange-500 group-hover:shadow-md'
                                    } transition-all duration-200`}>
                                        {done ? (
                                            <CheckCircle size={18} className="text-green-500" />
                                        ) : (
                                            <Icon size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                                        )}
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-sm font-bold leading-tight ${done ? 'text-green-700 dark:text-green-400 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
                                            {step.title}
                                        </h3>
                                        <p className={`text-xs mt-0.5 ${done ? 'text-green-500/70 dark:text-green-500/60' : 'text-gray-400 dark:text-gray-500'}`}>
                                            {step.description}
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    {!done && (
                                        <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                                            <ArrowRight size={16} className="text-amber-500" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 md:px-10 pb-6 md:pb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    {allDone ? (
                        <button
                            onClick={onDismiss}
                            className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all active:scale-95"
                        >
                            🎉 Launch My Site
                        </button>
                    ) : (
                        <button
                            onClick={onDismiss}
                            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium transition-colors underline underline-offset-2 decoration-dashed"
                        >
                            Skip for now, I'll set up later
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuickStartGuide;
