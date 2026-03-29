import React, { useState } from 'react';
import { X, ChevronRight, Image as ImageIcon, CreditCard, Share2, Palette, Rocket, CheckCircle2, Circle, ArrowRight, MapPin, Sparkles } from 'lucide-react';

interface AdminOnboardingProps {
    onNavigate: (tab: string, targetId?: string) => void;
    onEnterVisualBuilder?: () => void;
}

const steps = [
    {
        id: 'payment',
        emoji: '💳',
        title: 'Payment Methods',
        subtitle: 'Add GCash, bank, or card details',
        tab: 'settings',
        targetId: 'settings-payment',
    },
    {
        id: 'photos',
        emoji: '🖼️',
        title: 'Add Room Photos',
        subtitle: 'Replace placeholder images',
        tab: 'rooms',
        targetId: undefined,
    },
    {
        id: 'social',
        emoji: '📲',
        title: 'Social Links',
        subtitle: 'Connect your Instagram, Facebook',
        tab: 'settings',
        targetId: 'settings-social',
    },
    {
        id: 'map',
        emoji: '📍',
        title: 'Set Your Location',
        subtitle: 'Add a Google Maps embed',
        tab: 'settings',
        targetId: 'settings-contact',
    },
    {
        id: 'design',
        emoji: '🎨',
        title: 'Customize Design',
        subtitle: 'Personalize colors and branding',
        tab: 'overview',
        targetId: undefined,
        isVisualBuilder: true,
    },
];

const AdminOnboarding: React.FC<AdminOnboardingProps> = ({ onNavigate, onEnterVisualBuilder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [completed, setCompleted] = useState<Set<string>>(new Set());

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
            onEnterVisualBuilder();
        } else {
            onNavigate(step.tab, step.targetId);
        }
        setIsOpen(false);
    };

    return (
        <>
            {/* ── Floating Beacon ── */}
            <div className="fixed bottom-6 right-6 z-[120] flex flex-col items-end gap-2 pointer-events-none">

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

                    {/* Panel — slides from right on md+, from bottom on mobile */}
                    <div className="fixed z-[118] inset-x-0 bottom-0 md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:w-[400px] flex flex-col shadow-2xl animate-slide-up md:animate-slide-in-right overflow-hidden rounded-t-3xl md:rounded-none md:rounded-l-3xl">

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
                                return (
                                    <div
                                        key={step.id}
                                        className={`group relative rounded-2xl border-2 transition-all duration-300 ${done
                                            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                                            : 'border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 p-4">
                                            {/* Step number / emoji */}
                                            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 transition-colors ${done ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-50 dark:bg-gray-700 group-hover:bg-primary/10'}`}>
                                                <span className="text-xl leading-none">{step.emoji}</span>
                                                <span className="text-[9px] font-black mt-0.5 text-gray-400 dark:text-gray-500">{String(idx + 1).padStart(2, '0')}</span>
                                            </div>

                                            {/* Text */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-bold text-sm leading-tight ${done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-secondary dark:text-white'}`}>
                                                    {step.title}
                                                </h4>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{step.subtitle}</p>
                                                {!done && (
                                                    <button
                                                        onClick={() => handleNavigate(step)}
                                                        className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
                                                    >
                                                        Go there <ArrowRight size={11} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Toggle checkbox */}
                                            <button
                                                onClick={() => toggleStep(step.id)}
                                                className="shrink-0 p-1 rounded-full transition-transform hover:scale-110 active:scale-95"
                                                aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                                            >
                                                {done
                                                    ? <CheckCircle2 size={22} className="text-green-500" />
                                                    : <Circle size={22} className="text-gray-300 dark:text-gray-600 hover:text-primary transition-colors" />
                                                }
                                            </button>
                                        </div>
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