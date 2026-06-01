import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Play, Pause, CreditCard, MapPin, Facebook, Instagram } from 'lucide-react';

interface AnimatedWalkthroughProps {
    onClose: () => void;
    onStartGuide: () => void;
}

const SLIDE_DURATION = 6000; // ms per slide

const slides = [
    {
        id: 'welcome',
        emoji: '🚀',
        title: 'Welcome to Your Dashboard',
        desc: 'This quick walkthrough shows you everything you need to launch your staycation website.',
        accent: 'from-primary to-blue-500',
    },
    {
        id: 'overview',
        emoji: '📊',
        title: 'Dashboard Overview',
        desc: 'Track revenue, occupancy, active guests, and pending bookings — all updated in real-time.',
        accent: 'from-blue-500 to-indigo-500',
    },
    {
        id: 'payments',
        emoji: '💰',
        title: 'Payment & Deposits',
        desc: 'Configure your GCash payout details and set security deposit percentages for guest bookings.',
        accent: 'from-emerald-500 to-teal-500',
    },
    {
        id: 'rooms',
        emoji: '🏠',
        title: 'Room Manager',
        desc: 'Add rooms with photo galleries, set nightly rates, day-use pricing, and guest capacity limits.',
        accent: 'from-amber-500 to-orange-500',
    },
    {
        id: 'workflow',
        emoji: '🔄',
        title: 'Booking Lifecycle',
        desc: 'Manage guest journeys: Pending → Confirmed → Checked-In → Checked-Out. Verify payments and handle deposits.',
        accent: 'from-violet-500 to-purple-500',
    },
    {
        id: 'builder',
        emoji: '🖥️',
        title: 'Website Builder',
        desc: 'Edit headlines inline, drag hero images to reposition, cycle through slides, and undo any changes.',
        accent: 'from-cyan-500 to-blue-500',
    },
    {
        id: 'branding',
        emoji: '🎨',
        title: 'Branding & Socials',
        desc: 'Pick from 18 luxury color presets, link your Facebook & Instagram, and embed your Google Map.',
        accent: 'from-pink-500 to-rose-500',
    },
    {
        id: 'ready',
        emoji: '🎉',
        title: 'You\'re All Set!',
        desc: 'Your website is ready to take bookings. Use the interactive guide for hands-on step-by-step setup.',
        accent: 'from-emerald-500 to-green-400',
    },
];

// ─── Individual slide illustrations ─────────────────────────────────────────
const SlideIllustration: React.FC<{ slideId: string }> = ({ slideId }) => {
    switch (slideId) {
        case 'welcome':
            return (
                <div className="relative w-full h-full flex items-center justify-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl wt-float ring-4 ring-white/20">
                        <span className="text-4xl">🚀</span>
                    </div>
                    <div className="absolute top-4 left-8 w-3 h-3 rounded-full bg-primary/40 wt-orbit" />
                    <div className="absolute bottom-6 right-10 w-2 h-2 rounded-full bg-blue-400/50 wt-orbit" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-8 right-14 w-2.5 h-2.5 rounded-full bg-indigo-400/40 wt-orbit" style={{ animationDelay: '0.5s' }} />
                </div>
            );
        case 'overview':
            return (
                <div className="relative w-full h-full flex items-center justify-center p-3">
                    <div className="w-full max-w-[220px] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 wt-slide-in">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[8px] font-black uppercase text-gray-400">Dashboard</span>
                            <span className="text-[7px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full">● Live</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                            {[
                                { label: 'Revenue', val: '₱48.5K', color: 'text-emerald-500' },
                                { label: 'Occupancy', val: '85%', color: 'text-blue-500' },
                                { label: 'Guests', val: '12', color: 'text-amber-500' },
                                { label: 'Pending', val: '3', color: 'text-red-500' },
                            ].map((m, i) => (
                                <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1.5 text-center wt-pop-in" style={{ animationDelay: `${0.3 + i * 0.15}s` }}>
                                    <div className="text-[5px] text-gray-400 font-bold uppercase">{m.label}</div>
                                    <div className={`text-[9px] font-black mt-0.5 ${m.color}`}>{m.val}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-1">
                            {[40, 65, 50, 80, 70, 90, 55].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-sm overflow-hidden" style={{ height: '24px' }}>
                                        <div className="w-full bg-gradient-to-t from-primary to-blue-400 rounded-sm wt-bar-grow" style={{ height: `${h}%`, animationDelay: `${0.5 + i * 0.1}s` }} />
                                    </div>
                                    <span className="text-[4px] text-gray-400 font-bold">{['M','T','W','T','F','S','S'][i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        case 'payments':
            return (
                <div className="relative w-full h-full flex items-center justify-center p-3">
                    <div className="relative w-44 h-24 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-2xl border border-white/20 p-3 flex flex-col justify-between text-white wt-float">
                        <div className="flex justify-between items-center">
                            <CreditCard size={14} className="text-white/80" />
                            <span className="text-[8px] font-black tracking-widest uppercase opacity-85">GCash Pay</span>
                        </div>
                        <div className="text-left leading-none">
                            <div className="text-[7px] opacity-60">Payout Account</div>
                            <div className="text-[11px] font-mono font-bold tracking-wider mt-0.5">0917 •••• 567</div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="text-[6px] opacity-50">Deposit: 50%</div>
                            <div className="text-[8px] font-black bg-white/20 px-2 py-0.5 rounded-full">Active ✓</div>
                        </div>
                    </div>
                    <span className="absolute text-yellow-400 text-lg left-10 top-3 wt-coin-float select-none">🪙</span>
                    <span className="absolute text-yellow-400 text-sm right-8 top-5 wt-coin-float select-none" style={{ animationDelay: '0.5s' }}>🪙</span>
                </div>
            );
        case 'rooms':
            return (
                <div className="relative w-full h-full flex items-center justify-center p-3 gap-2">
                    {[
                        { name: 'Deluxe Suite', price: '₱3,500', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=200&q=60' },
                        { name: 'Ocean View', price: '₱5,200', img: 'https://images.unsplash.com/photo-1590490360182-c33d955d6d3e?w=200&q=60' },
                    ].map((room, i) => (
                        <div key={i} className="w-24 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden wt-pop-in" style={{ animationDelay: `${0.3 + i * 0.25}s` }}>
                            <div className="h-14 overflow-hidden relative">
                                <img src={room.img} alt="" className="w-full h-full object-cover" />
                                <div className="absolute top-1 right-1 bg-amber-400 text-[5px] font-black text-white px-1 py-0.5 rounded-full shadow">★ 4.9</div>
                            </div>
                            <div className="p-1.5">
                                <div className="text-[7px] font-black text-gray-700 dark:text-white truncate">{room.name}</div>
                                <div className="text-[8px] font-bold text-primary">{room.price}<span className="text-gray-400 text-[6px]">/night</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        case 'workflow':
            return (
                <div className="relative w-full h-full flex items-center justify-center p-2">
                    <div className="flex items-center gap-1.5">
                        {[
                            { emoji: '📩', label: 'Pending', color: 'border-blue-500 bg-blue-500/10', delay: '0.2s' },
                            { emoji: '💳', label: 'Confirm', color: 'border-emerald-500 bg-emerald-500/10', delay: '0.5s' },
                            { emoji: '🔑', label: 'Check-in', color: 'border-indigo-500 bg-indigo-500/10', delay: '0.8s' },
                            { emoji: '🧹', label: 'Checkout', color: 'border-gray-400 bg-gray-500/10', delay: '1.1s' },
                        ].map((s, i) => (
                            <React.Fragment key={i}>
                                <div className="flex flex-col items-center text-center wt-pop-in" style={{ animationDelay: s.delay }}>
                                    <div className={`w-9 h-9 rounded-full border-2 ${s.color} flex items-center justify-center text-sm shadow`}>
                                        {s.emoji}
                                    </div>
                                    <span className="text-[6px] font-black uppercase text-gray-500 mt-1">{s.label}</span>
                                </div>
                                {i < 3 && <span className="text-gray-300 dark:text-gray-600 text-xs wt-arrow-pulse" style={{ animationDelay: `${0.4 + i * 0.3}s` }}>→</span>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            );
        case 'builder':
            return (
                <div className="relative w-full h-full flex items-center justify-center p-3">
                    <div className="w-full max-w-[200px] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2.5 wt-slide-in">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-1.5 mb-2">
                            <span className="text-[7px] font-black uppercase text-gray-400">Website Builder</span>
                            <div className="flex gap-1">
                                <span className="text-[7px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-bold text-gray-500">⟲</span>
                                <span className="text-[7px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-bold text-gray-500">⟳</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-dashed border-blue-300 flex items-center justify-between wt-pop-in" style={{ animationDelay: '0.4s' }}>
                                <span className="text-[7px] font-bold text-blue-600 dark:text-blue-400">✏️ Edit Headlines</span>
                                <span className="wt-cursor-blink text-blue-500 text-xs">|</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-dashed border-emerald-300 flex items-center justify-between wt-pop-in" style={{ animationDelay: '0.7s' }}>
                                <span className="text-[7px] font-bold text-emerald-600 dark:text-emerald-400">🖼️ Drag & Scale Hero</span>
                                <span className="text-[6px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 px-1 py-0.5 rounded font-bold">Adjust</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-dashed border-amber-300 flex items-center justify-between wt-pop-in" style={{ animationDelay: '1s' }}>
                                <span className="text-[7px] font-bold text-amber-600 dark:text-amber-400">🎠 Cycle Hero Slides</span>
                                <span className="text-[6px] bg-amber-100 dark:bg-amber-900/40 text-amber-600 px-1 py-0.5 rounded font-bold">← →</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        case 'branding':
            return (
                <div className="relative w-full h-full flex items-center justify-center p-3">
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex gap-2 items-end">
                            {[
                                'from-blue-900 to-amber-500',
                                'from-emerald-700 to-teal-400',
                                'from-rose-500 to-pink-400',
                                'from-violet-600 to-purple-400',
                                'from-orange-500 to-amber-300',
                            ].map((g, i) => (
                                <div key={i} className={`rounded-full bg-gradient-to-tr ${g} shadow-lg border border-white/30 wt-pop-in ${i === 1 ? 'w-10 h-10 ring-2 ring-white/50' : 'w-7 h-7'}`} style={{ animationDelay: `${0.2 + i * 0.12}s` }}>
                                    {i === 1 && <div className="w-full h-full flex items-center justify-center text-[5px] font-black text-white">LIVE</div>}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 items-center wt-pop-in" style={{ animationDelay: '1s' }}>
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow">
                                <Facebook size={14} className="text-blue-600" />
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow">
                                <Instagram size={14} className="text-pink-500" />
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow">
                                <MapPin size={14} className="text-red-500" />
                            </div>
                        </div>
                    </div>
                </div>
            );
        case 'ready':
            return (
                <div className="relative w-full h-full flex items-center justify-center">
                    <div className="text-5xl wt-bounce-in">🎉</div>
                    <div className="absolute w-4 h-4 rounded-full bg-emerald-400/60 wt-confetti-dot" style={{ top: '15%', left: '20%', animationDelay: '0s' }} />
                    <div className="absolute w-3 h-3 rounded-full bg-blue-400/60 wt-confetti-dot" style={{ top: '25%', right: '15%', animationDelay: '0.3s' }} />
                    <div className="absolute w-3.5 h-3.5 rounded-full bg-amber-400/60 wt-confetti-dot" style={{ bottom: '20%', left: '25%', animationDelay: '0.6s' }} />
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-pink-400/60 wt-confetti-dot" style={{ bottom: '30%', right: '20%', animationDelay: '0.9s' }} />
                    <div className="absolute w-3 h-3 rounded-full bg-primary/50 wt-confetti-dot" style={{ top: '40%', left: '10%', animationDelay: '0.4s' }} />
                </div>
            );
        default:
            return null;
    }
};

// ─── Main Component ─────────────────────────────────────────────────────────
const AnimatedWalkthrough: React.FC<AnimatedWalkthroughProps> = ({ onClose, onStartGuide }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef(Date.now());

    const advanceSlide = useCallback(() => {
        setCurrentSlide(prev => {
            if (prev >= slides.length - 1) {
                setIsPlaying(false);
                return prev;
            }
            return prev + 1;
        });
        setProgress(0);
        startTimeRef.current = Date.now();
    }, []);

    // Progress tick
    useEffect(() => {
        if (!isPlaying) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const pct = Math.min(100, (elapsed / SLIDE_DURATION) * 100);
            setProgress(pct);
            if (elapsed >= SLIDE_DURATION) {
                advanceSlide();
            }
        }, 50);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, currentSlide, advanceSlide]);

    const goToSlide = (idx: number) => {
        setCurrentSlide(idx);
        setProgress(0);
        startTimeRef.current = Date.now();
        if (!isPlaying && idx < slides.length - 1) setIsPlaying(true);
    };

    const slide = slides[currentSlide];

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-gray-950 rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden wt-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-white/50 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors z-20"
                >
                    <X size={16} />
                </button>

                {/* Segmented progress bar */}
                <div className="flex gap-1 px-4 pt-4">
                    {slides.map((_, i) => (
                        <div key={i} className="flex-1 h-[3px] bg-white/10 rounded-full overflow-hidden cursor-pointer" onClick={() => goToSlide(i)}>
                            <div
                                className="h-full rounded-full transition-all duration-100"
                                style={{
                                    width: i < currentSlide ? '100%' : i === currentSlide ? `${progress}%` : '0%',
                                    background: i <= currentSlide ? 'linear-gradient(90deg, var(--color-primary), #60a5fa)' : 'transparent',
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Slide counter */}
                <div className="flex justify-between items-center px-5 pt-2.5">
                    <span className="text-[9px] font-black tracking-widest uppercase text-gray-500 font-sans">{currentSlide + 1} / {slides.length}</span>
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="text-white/60 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
                    >
                        {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                    </button>
                </div>

                {/* Illustration area */}
                <div key={currentSlide} className="h-40 relative wt-fade-slide-in">
                    <SlideIllustration slideId={slide.id} />
                </div>

                {/* Text content */}
                <div key={`text-${currentSlide}`} className="px-6 pb-2 text-center wt-fade-slide-in">
                    <h3 className="text-base font-black text-white mb-1.5 font-sans tracking-tight flex items-center justify-center gap-2">
                        <span className="text-lg">{slide.emoji}</span> {slide.title}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-sans max-w-xs mx-auto">
                        {slide.desc}
                    </p>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between px-5 pb-5 pt-3 gap-2">
                    <button
                        onClick={() => goToSlide(Math.max(0, currentSlide - 1))}
                        disabled={currentSlide === 0}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-sans"
                    >
                        <ArrowLeft size={12} /> Back
                    </button>

                    {currentSlide === slides.length - 1 ? (
                        <button
                            onClick={() => { onClose(); onStartGuide(); }}
                            className="flex-1 max-w-[200px] py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                        >
                            Start Setup Guide <ArrowRight size={14} />
                        </button>
                    ) : (
                        <button
                            onClick={() => goToSlide(currentSlide + 1)}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1 font-sans"
                        >
                            Next <ArrowRight size={12} />
                        </button>
                    )}
                </div>

                {/* Walkthrough-specific animations */}
                <style>{`
                    .wt-scale-up {
                        animation: wt-scale-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                    @keyframes wt-scale-up {
                        from { transform: scale(0.92); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }

                    .wt-fade-slide-in {
                        animation: wt-fade-slide 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                    @keyframes wt-fade-slide {
                        from { transform: translateY(12px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }

                    .wt-float {
                        animation: wt-float 4s ease-in-out infinite;
                    }
                    @keyframes wt-float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-6px); }
                    }

                    .wt-orbit {
                        animation: wt-orbit 5s ease-in-out infinite;
                    }
                    @keyframes wt-orbit {
                        0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
                        25% { transform: translate(8px, -5px) scale(1.3); opacity: 1; }
                        50% { transform: translate(-4px, -10px) scale(0.8); opacity: 0.6; }
                        75% { transform: translate(-8px, 3px) scale(1.1); opacity: 0.9; }
                    }

                    .wt-pop-in {
                        animation: wt-pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                        opacity: 0;
                        transform: scale(0.6);
                    }
                    @keyframes wt-pop-in {
                        from { opacity: 0; transform: scale(0.6); }
                        to { opacity: 1; transform: scale(1); }
                    }

                    .wt-slide-in {
                        animation: wt-slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        opacity: 0;
                    }
                    @keyframes wt-slide-in {
                        from { opacity: 0; transform: translateY(15px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }

                    .wt-bar-grow {
                        animation: wt-bar-grow 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        transform-origin: bottom;
                        transform: scaleY(0);
                    }
                    @keyframes wt-bar-grow {
                        from { transform: scaleY(0); }
                        to { transform: scaleY(1); }
                    }

                    .wt-coin-float {
                        animation: wt-coin-float 2.5s ease-in-out infinite;
                    }
                    @keyframes wt-coin-float {
                        0%, 100% { transform: translateY(0) rotate(0deg); }
                        50% { transform: translateY(-8px) rotate(15deg); }
                    }

                    .wt-arrow-pulse {
                        animation: wt-arrow-pulse 1.5s ease-in-out infinite;
                    }
                    @keyframes wt-arrow-pulse {
                        0%, 100% { opacity: 0.3; transform: translateX(0); }
                        50% { opacity: 1; transform: translateX(2px); }
                    }

                    .wt-cursor-blink {
                        animation: wt-cursor-blink 1s step-end infinite;
                    }
                    @keyframes wt-cursor-blink {
                        0%, 50% { opacity: 1; }
                        51%, 100% { opacity: 0; }
                    }

                    .wt-bounce-in {
                        animation: wt-bounce-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    }
                    @keyframes wt-bounce-in {
                        0% { transform: scale(0); opacity: 0; }
                        60% { transform: scale(1.2); opacity: 1; }
                        100% { transform: scale(1); }
                    }

                    .wt-confetti-dot {
                        animation: wt-confetti-dot 2s ease-in-out infinite;
                    }
                    @keyframes wt-confetti-dot {
                        0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
                        25% { transform: translate(5px, -8px) scale(1.3); opacity: 1; }
                        50% { transform: translate(-3px, -4px) scale(0.8); opacity: 0.4; }
                        75% { transform: translate(4px, 2px) scale(1.1); opacity: 0.8; }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default AnimatedWalkthrough;
