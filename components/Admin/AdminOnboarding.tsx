import React, { useState } from 'react';
import { X, ChevronRight, ChevronDown, Image as ImageIcon, CreditCard, Share2, Palette, Rocket, CheckCircle2, Circle, ArrowRight, MapPin, Sparkles } from 'lucide-react';

interface AdminOnboardingProps {
    onNavigate: (tab: string, targetId?: string) => void;
    onEnterVisualBuilder?: (targetId?: string) => void;
}

const steps = [
    {
        id: 'payment',
        emoji: '💳',
        title: 'Payment Methods',
        subtitle: 'Add GCash, bank, or card details',
        tab: 'settings',
        targetId: 'settings-payment',
        instructions: 'Add GCash, bank transfer, or card details so guests can book directly. GCash is the most popular payment option in the Philippines.',
        guidelines: [
            'Go to the Settings Tab in the Admin Dashboard.',
            'Locate the "Payment Settings" section.',
            'Enter your GCash Number, Bank Name, Account Name, and Account Number.',
            'Toggle on GCash or Bank Transfer payments and click "Save Changes".'
        ],
        proTip: 'Keep GCash details accurate. Make sure your name matches your GCash registered account name to build guest trust!',
    },
    {
        id: 'photos',
        emoji: '🖼️',
        title: 'Add Room Photos',
        subtitle: 'Replace placeholder images',
        tab: 'rooms',
        targetId: undefined,
        instructions: 'High-quality photos increase bookings by up to 40%. Replace the placeholder images with your actual rooms.',
        guidelines: [
            'Navigate to the "Rooms" section in your sidebar.',
            'Select a room and click the "Edit Room" button.',
            'Scroll to the Gallery section, drag and drop or upload your room photos.',
            'Set a "Feature Image" as the main cover photo for the room card.'
        ],
        proTip: 'Capture images in landscape orientation during high daylight hours for natural, welcoming lighting.',
    },
    {
        id: 'social',
        emoji: '📲',
        title: 'Social Links',
        subtitle: 'Connect your Instagram, Facebook',
        tab: 'settings',
        targetId: 'footer',
        isVisualBuilder: true,
        instructions: 'Integrate your Facebook page, Instagram profile, and TikTok so guests can follow and tag your property.',
        guidelines: [
            'Click "Go there" to open the Visual Builder.',
            'Open the "Social & Links" accordion section in the builder toolbar.',
            'Enter the absolute URLs for Facebook, Instagram, Airbnb, and TikTok.',
            'Toggle the social icons you want to display in your website\'s footer.'
        ],
        proTip: 'Social proof is key! Link directly to pages with active reviews.',
    },
    {
        id: 'map',
        emoji: '📍',
        title: 'Set Your Location',
        subtitle: 'Add a Google Maps embed',
        tab: 'settings',
        targetId: 'contact',
        isVisualBuilder: true,
        instructions: 'Make it easy for guests to find your property by embedding a Google Maps panel directly on your contact page.',
        guidelines: [
            'Click the "Go there" button to scroll to the Contact Section in the Visual Builder.',
            'In the visual builder, locate the Google Maps input field.',
            'Go to Google Maps in a separate tab, search your property, click "Share" -> "Embed a map", and copy the source URL inside the src="..." attribute.',
            'Paste the copied link into the Google Maps Embed field in the builder.'
        ],
        proTip: 'Only paste the URL inside the src quotes (e.g. https://www.google.com/maps/embed?...), not the full <iframe> tag.',
    },
    {
        id: 'design',
        emoji: '🎨',
        title: 'Customize Design',
        subtitle: 'Personalize colors and branding',
        tab: 'overview',
        targetId: undefined,
        isVisualBuilder: true,
        instructions: 'Brand your staycation website by customizing colors, typography, and logo branding.',
        guidelines: [
            'Click "Go there" to open the Visual Builder.',
            'Open the "Theme & Colors" accordion section.',
            'Choose from our beautifully crafted color presets (like Navy & Gold or Emerald Luxe), or pick custom primary/secondary colors matching your brand.',
            'Customize the Global Font Family (Sans-Serif, Serif, Monospace).',
            'Press "Save & Publish" to go live instantly.'
        ],
        proTip: 'Keep colors high-contrast (e.g. dark colors for primary buttons) to ensure text remains highly readable.',
    },
];

const AdminOnboarding: React.FC<AdminOnboardingProps> = ({ onNavigate, onEnterVisualBuilder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [completed, setCompleted] = useState<Set<string>>(new Set());
    const [expandedStep, setExpandedStep] = useState<string | null>('payment');

    const remaining = steps.length - completed.size;
    const progress = Math.round((completed.size / steps.length) * 100);
    const allDone = completed.size === steps.length;

    const toggleStep = (id: string) => {
        setCompleted(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleNavigate = (step: typeof steps[number]) => {
        if (step.isVisualBuilder && onEnterVisualBuilder) {
            onEnterVisualBuilder(step.targetId);
        } else {
            onNavigate(step.tab, step.targetId);
        }
        setIsOpen(false);
    };

    return (
        <>
            {/* ── Floating Beacon ── */}
            <div className="fixed bottom-24 md:bottom-6 right-6 z-[120] flex flex-col items-end gap-2 pointer-events-none">

                {/* Tooltip bubble */}
                {!isOpen && (
                    <div className="pointer-events-auto animate-fade-in bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-primary/20 px-4 py-2 flex items-center gap-2">
                        <Sparkles size={13} className="text-primary shrink-0" />
                        <span className="text-xs font-bold text-secondary dark:text-white whitespace-nowrap">
                            {allDone ? '🎉 Your site is ready!' : `${remaining} setup step${remaining !== 1 ? 's' : ''} remaining`}
                        </span>
                    </div>
                )}

                {/* Main beacon button */}
                <button
                    onClick={() => setIsOpen(v => !v)}
                    aria-label="Open Setup Guide"
                    className="pointer-events-auto relative group focus:outline-none"
                >
                    {/* Pulsating ring — only when steps remain */}
                    {!allDone && !isOpen && (
                        <>
                            <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
                            <span className="absolute inset-1 rounded-full animate-ping animation-delay-300 bg-primary/20" />
                        </>
                    )}

                    {/* Badge */}
                    {!allDone && (
                        <span className="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black shadow-lg">
                            {remaining}
                        </span>
                    )}

                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary via-blue-500 to-secondary flex items-center justify-center shadow-2xl shadow-primary/40 transition-transform duration-300 group-hover:scale-110 group-active:scale-95 ring-4 ring-white dark:ring-gray-900">
                        {isOpen
                            ? <X size={22} className="text-white" />
                            : <span className="text-[26px] leading-none select-none">{allDone ? '🎉' : '🚀'}</span>
                        }
                    </div>
                </button>
            </div>

            {/* ── Slide-in Drawer Panel ── */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[115] animate-fade-in"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel ── slides from right on md+, from bottom on mobile */}
                    <div className="fixed z-[118] inset-x-0 bottom-0 md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:w-[420px] flex flex-col shadow-2xl animate-slide-up md:animate-slide-in-right overflow-hidden rounded-t-3xl md:rounded-none md:rounded-l-3xl">

                        {/* Header */}
                        <div className="relative bg-gradient-to-br from-primary via-blue-600 to-secondary px-6 pt-6 pb-8 text-white shrink-0">
                            {/* Decorative blobs */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl pointer-events-none" />

                            <div className="relative flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                                        🚀
                                    </div>
                                    <div>
                                        <h2 className="font-black text-xl leading-tight">Setup Guide</h2>
                                        <p className="text-white/70 text-[11px] font-medium tracking-wide uppercase mt-0.5">
                                            Launch your property
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Progress bar */}
                            <div>
                                <div className="flex justify-between text-xs text-white/70 mb-1.5 font-semibold">
                                    <span>{completed.size} of {steps.length} complete</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white rounded-full transition-all duration-700 ease-out shadow-sm"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step list */}
                        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 px-4 py-4 space-y-3 max-h-[60vh] md:max-h-none">
                            {steps.map((step, idx) => {
                                const done = completed.has(step.id);
                                const isExpanded = expandedStep === step.id;

                                return (
                                    <div
                                        key={step.id}
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('.checkbox-btn')) return;
                                            setExpandedStep(isExpanded ? null : step.id);
                                        }}
                                        className={`group relative rounded-2xl border-2 transition-all duration-350 cursor-pointer overflow-hidden ${done
                                            ? 'border-green-200 dark:border-green-800 bg-green-50/60 dark:bg-green-900/10'
                                            : isExpanded
                                                ? 'border-primary bg-primary/[0.02] dark:bg-primary/[0.04] shadow-md shadow-primary/5'
                                                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5'
                                        }`}
                                    >
                                        {/* Step Card Header */}
                                        <div className="flex items-center justify-between gap-3 p-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {/* Step number / emoji */}
                                                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 transition-colors ${done ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-800 group-hover:bg-primary/10'}`}>
                                                    <span className="text-xl leading-none">{step.emoji}</span>
                                                    <span className="text-[9px] font-black mt-0.5 text-gray-400 dark:text-gray-500">{String(idx + 1).padStart(2, '0')}</span>
                                                </div>

                                                {/* Text info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`font-bold text-sm leading-tight flex items-center gap-1.5 ${done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-secondary dark:text-white'}`}>
                                                        {step.title}
                                                    </h4>
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{step.subtitle}</p>
                                                </div>
                                            </div>

                                            {/* Expand Icon and Checkbox toggle */}
                                            <div className="flex items-center gap-2">
                                                {/* Toggle checkbox */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleStep(step.id);
                                                    }}
                                                    className="checkbox-btn shrink-0 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                    aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                                                >
                                                    {done
                                                        ? <CheckCircle2 size={22} className="text-green-500 shrink-0" />
                                                        : <Circle size={22} className="text-gray-300 dark:text-gray-600 hover:text-primary transition-colors shrink-0" />
                                                    }
                                                </button>
                                                
                                                <div className="text-gray-400 shrink-0">
                                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step Guidelines Accordion Content */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-3 animate-fade-in bg-white/50 dark:bg-gray-900/50">
                                                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                                                    {step.instructions}
                                                </p>

                                                {/* Step list box */}
                                                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 space-y-2 border border-gray-100 dark:border-gray-800/80">
                                                    <h5 className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">📋 Setup Steps Checklist:</h5>
                                                    <ul className="space-y-2 list-none">
                                                        {step.guidelines.map((line, lIdx) => (
                                                            <li key={lIdx} className="flex gap-2 text-xs text-gray-700 dark:text-gray-300 leading-tight items-start">
                                                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{lIdx + 1}</span>
                                                                <span className="pt-0.5">{line}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Pro Tip Callout Box */}
                                                {step.proTip && (
                                                    <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-3 border border-primary/10 flex gap-2">
                                                        <span className="text-sm select-none shrink-0">💡</span>
                                                        <p className="text-[11px] text-primary dark:text-primary-hover font-medium leading-normal">
                                                            <span className="font-bold">Pro Tip: </span>{step.proTip}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Go Launch Action Button */}
                                                {!done && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleNavigate(step);
                                                        }}
                                                        className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        Start Step {idx + 1} <ArrowRight size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className={`shrink-0 px-4 py-4 border-t border-gray-100 dark:border-gray-800 ${allDone ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-white dark:bg-gray-900'}`}>
                            {allDone ? (
                                <p className="text-white font-black text-center text-sm py-1">🎉 All done! Your property is live-ready.</p>
                            ) : (
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Continue later
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                @media (min-width: 768px) {
                    .md\\:animate-slide-in-right { animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                }
                .animate-fade-in { animation: fade-in 0.25s ease; }
                .animation-delay-300 { animation-delay: 300ms; }
            `}</style>
        </>
    );
};

export default AdminOnboarding;