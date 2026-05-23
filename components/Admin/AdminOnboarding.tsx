import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    X, Image as ImageIcon, CreditCard, Share2, Palette, Rocket, 
    CheckCircle2, Circle, ArrowRight, ArrowLeft, MapPin, Sparkles, Trophy, 
    Facebook, Instagram, Info, ChevronRight
} from 'lucide-react';

interface AdminOnboardingProps {
    onNavigate: (tab: string, targetId?: string) => void;
    onEnterVisualBuilder?: (targetId?: string) => void;
}

const steps = [
    {
        id: 'payment',
        emoji: '💰',
        title: 'GCash & Bank Details',
        subtitle: 'Payments piggy bank!',
        tab: 'settings',
        targetId: 'settings-payment',
        intro: 'Set up your GCash and bank details so guest bookings transfer directly to your wallet. 💵',
        actionLabel: 'Configure Payouts Now ➜',
        visualType: 'payment'
    },
    {
        id: 'photos',
        emoji: '📸',
        title: 'Upload Room Photos',
        subtitle: 'Make your rooms shine!',
        tab: 'rooms',
        targetId: undefined,
        intro: 'Replace placeholders with actual sunny landscape photos of your beds, pools, and views. 🖼️',
        actionLabel: 'Manage Room Photos ➜',
        visualType: 'photos'
    },
    {
        id: 'social',
        emoji: '📲',
        title: 'Social Media Links',
        subtitle: 'Connect with followers!',
        tab: 'settings',
        targetId: 'footer',
        isVisualBuilder: true,
        intro: 'Connect your Facebook and Instagram links in the footer so guests can follow and DM you. 💬',
        actionLabel: 'Link Social Accounts ➜',
        visualType: 'social'
    },
    {
        id: 'map',
        emoji: '📍',
        title: 'Pin Location Map',
        subtitle: 'Help guests navigate!',
        tab: 'settings',
        targetId: 'contact',
        isVisualBuilder: true,
        intro: 'Embed an interactive Google Maps card in your contact section for seamless driving navigation. 🗺️',
        actionLabel: 'Pin Location Map ➜',
        visualType: 'map'
    },
    {
        id: 'design',
        emoji: '🎨',
        title: 'Branding & Design',
        subtitle: 'Color theme customization!',
        tab: 'overview',
        targetId: undefined,
        isVisualBuilder: true,
        intro: 'Paint your site with luxury preset color palettes (Navy, Emerald, Sunset) or mix custom HSL hues. 🖌️',
        actionLabel: 'Style Theme Colors ➜',
        visualType: 'design'
    }
];

const AdminOnboarding: React.FC<AdminOnboardingProps> = ({ onNavigate, onEnterVisualBuilder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [completed, setCompleted] = useState<Set<string>>(new Set());
    const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1); // -1: Welcome Screen, 5: Celebration Screen
    const [direction, setDirection] = useState<'next' | 'prev'>('next');
    const [animationKey, setAnimationKey] = useState<number>(0);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const remaining = steps.length - completed.size;
    const progress = Math.round((completed.size / steps.length) * 100);
    const allDone = completed.size === steps.length;

    // Full-screen Canvas Confetti Animation Trigger
    useEffect(() => {
        if (isOpen && currentStepIdx === steps.length && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            let animationFrameId: number;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
            const particles = Array.from({ length: 150 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                r: Math.random() * 5 + 3,
                d: Math.random() * canvas.height,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.random() * 10 - 5,
                tiltAngleIncremental: Math.random() * 0.07 + 0.02,
                tiltAngle: 0
            }));

            const draw = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach((p, i) => {
                    p.tiltAngle += p.tiltAngleIncremental;
                    p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2.2;
                    p.x += Math.sin(p.tiltAngle);
                    p.tilt = Math.sin(p.tiltAngle - i / 3) * 15;

                    ctx.beginPath();
                    ctx.lineWidth = p.r;
                    ctx.strokeStyle = p.color;
                    ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
                    ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
                    ctx.stroke();

                    if (p.y > canvas.height) {
                        particles[i] = {
                            x: Math.random() * canvas.width,
                            y: -20,
                            r: p.r,
                            d: p.d,
                            color: p.color,
                            tilt: p.tilt,
                            tiltAngleIncremental: p.tiltAngleIncremental,
                            tiltAngle: p.tiltAngle
                        };
                    }
                });
                animationFrameId = requestAnimationFrame(draw);
            };

            draw();

            const handleResize = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };
            window.addEventListener('resize', handleResize);

            return () => {
                cancelAnimationFrame(animationFrameId);
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [isOpen, currentStepIdx]);

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

    const markCompleteAndNext = (id: string) => {
        setCompleted(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
        goNext();
    };

    // Render interactive CSS mockup graphics based on slide type
    const renderVisualMockup = (type: string) => {
        switch (type) {
            case 'payment':
                return (
                    <div className="relative w-full h-32 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex flex-col items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner select-none">
                        <div className="absolute top-2 right-3 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            <span className="text-[7px] font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-400">Live Payouts</span>
                        </div>
                        <div className="relative w-36 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg border border-white/20 p-2.5 flex flex-col justify-between text-white scale-95 animate-phone-float">
                            <div className="flex justify-between items-center">
                                <CreditCard size={16} className="text-white/80" />
                                <span className="text-[8px] font-black tracking-widest uppercase opacity-85">GCash Pay</span>
                            </div>
                            <div className="text-left">
                                <div className="text-[7px] opacity-60">Payout Number</div>
                                <div className="text-xs font-mono font-bold leading-none tracking-wider">0917 •••• 567</div>
                            </div>
                        </div>
                        {/* Falling coins drops */}
                        <span className="absolute text-yellow-500 text-lg left-12 top-4 animate-coin-drop-1 select-none">🪙</span>
                        <span className="absolute text-yellow-500 text-sm right-12 top-2 animate-coin-drop-1 select-none" style={{ animationDelay: '0.4s' }}>🪙</span>
                        <span className="absolute text-yellow-500 text-base left-1/2 top-3 animate-coin-drop-1 select-none" style={{ animationDelay: '0.8s' }}>🪙</span>
                    </div>
                );
            case 'photos':
                return (
                    <div className="relative w-full h-32 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden p-3 shadow-inner">
                        {/* Slide-out old photo card */}
                        <div className="absolute left-3 w-24 h-16 bg-gray-200 dark:bg-gray-750 rounded-xl border border-gray-300 dark:border-gray-700 flex items-center justify-center animate-pulse opacity-25">
                            <span className="text-[9px] text-gray-400">Old</span>
                        </div>
                        {/* Slide-in beautiful photo card */}
                        <div className="w-36 h-22 bg-white dark:bg-gray-700 rounded-xl shadow-md border border-primary/10 p-1 flex flex-col gap-1 z-10 transition-all hover:scale-105 duration-300">
                            <div className="h-14 rounded-lg overflow-hidden relative">
                                <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" alt="" className="w-full h-full object-cover" />
                                <div className="absolute top-1 right-1 bg-amber-400 text-[6px] font-black text-white p-0.5 rounded-full shadow animate-bounce">
                                    ★
                                </div>
                            </div>
                            <div className="flex justify-between items-center px-1 text-[8px] font-black uppercase text-gray-500 dark:text-gray-300">
                                <span>Deluxe Villa</span>
                                <span className="text-emerald-500">Perfect</span>
                            </div>
                        </div>
                    </div>
                );
            case 'social':
                return (
                    <div className="relative w-full h-32 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner p-4">
                        {/* Staycation Logo */}
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg animate-phone-float relative z-10">
                            🏝️
                        </div>
                        {/* Left Social bubble */}
                        <div className="absolute left-6 w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-750 flex items-center justify-center shadow-md animate-logo-shake z-10" style={{ animationDelay: '0.5s' }}>
                            <Facebook size={20} className="text-blue-600" />
                        </div>
                        {/* Right Social bubble */}
                        <div className="absolute right-6 w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-750 flex items-center justify-center shadow-md animate-logo-shake z-10">
                            <Instagram size={20} className="text-pink-500" />
                        </div>
                        {/* Dotted paths */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 350 128">
                            <path d="M 64 64 L 175 64" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,4" className="animate-social-pulse" />
                            <path d="M 286 64 L 175 64" stroke="#ec4899" strokeWidth="2" strokeDasharray="4,4" className="animate-social-pulse" />
                        </svg>
                    </div>
                );
            case 'map':
                return (
                    <div className="relative w-full h-32 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:14px_14px] opacity-30" />
                        <div className="absolute w-10 h-10 rounded-full border border-primary/40 bg-primary/10 animate-ripple flex items-center justify-center"></div>
                        <div className="absolute w-10 h-10 rounded-full border border-primary/20 bg-primary/5 animate-ripple flex items-center justify-center" style={{ animationDelay: '1s' }}></div>
                        <div className="relative z-10 animate-pin-drop">
                            <MapPin size={34} className="text-red-500 fill-red-500/20 drop-shadow-lg" />
                            <div className="w-2 h-0.5 bg-black/30 rounded-full blur-[1px] absolute -bottom-0.5 left-1/2 -translate-x-1/2"></div>
                        </div>
                    </div>
                );
            case 'design':
                return (
                    <div className="relative w-full h-32 bg-gray-50 dark:bg-gray-800/40 rounded-2xl flex items-center justify-center border border-gray-150 dark:border-gray-700/50 overflow-hidden shadow-inner">
                        <div className="flex gap-4 items-center justify-center animate-phone-float">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-900 to-amber-500 shadow-md ring-2 ring-white/50 border border-black/10 scale-90" title="Navy & Gold" />
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-400 shadow-lg ring-4 ring-white/70 border border-black/10 hover:scale-110 transition-transform cursor-pointer relative" title="Emerald Luxe">
                                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-[5px] font-black text-white px-1 py-0.5 rounded-full uppercase tracking-wider shadow animate-pulse">Live</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-300 shadow-md ring-2 ring-white/50 border border-black/10 scale-90" title="Sunset Warmth" />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {/* Confetti Explosion Canvas */}
            {isOpen && currentStepIdx === steps.length && (
                <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[200] w-screen h-screen" />
            )}

            {/* ── Floating Rocket Beacon ── */}
            <div className="fixed bottom-24 md:bottom-6 right-6 z-[120] flex flex-col items-end gap-2 pointer-events-none select-none">
                {!isOpen && (
                    <div className="pointer-events-auto animate-fade-in bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-primary/20 px-4 py-2 flex items-center gap-2">
                        <Sparkles size={13} className="text-primary shrink-0" />
                        <span className="text-xs font-bold text-secondary dark:text-white whitespace-nowrap">
                            {allDone ? '🎉 Your site is live!' : `${remaining} setup step${remaining !== 1 ? 's' : ''} left`}
                        </span>
                    </div>
                )}

                <button
                    onClick={() => {
                        setIsOpen(true);
                        setCurrentStepIdx(-1);
                    }}
                    aria-label="Open Setup Guide"
                    className="pointer-events-auto relative group focus:outline-none"
                >
                    {!allDone && !isOpen && (
                        <>
                            <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
                            <span className="absolute inset-1 rounded-full animate-ping bg-primary/20" />
                        </>
                    )}
                    {!allDone && (
                        <span className="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black shadow-lg animate-bounce">
                            {remaining}
                        </span>
                    )}
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary via-blue-500 to-secondary flex items-center justify-center shadow-2xl shadow-primary/40 transition-transform duration-300 group-hover:scale-110 group-active:scale-95 ring-4 ring-white dark:ring-gray-900">
                        <span className="text-[26px] leading-none select-none">{allDone ? '🎉' : '🚀'}</span>
                    </div>
                </button>
            </div>

            {/* ── Immersive Phone Setup Wizard Modal ── */}
            {isOpen && (
                <>
                    {/* Backdrop blur overlay */}
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[115] animate-fade-in flex items-center justify-center p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        {/* ── Smartphone Chassis Wrapper ── */}
                        <div 
                            className="relative w-full max-w-[380px] h-[660px] bg-gray-950 rounded-[48px] p-3.5 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)] border-4 border-gray-800/80 flex flex-col justify-center animate-slide-up select-none ring-8 ring-black/30 md:scale-100 scale-95"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Smartphone notch / Dynamic Island camera sensor */}
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

                                {/* Step Progress Track (Subtle dots at top) */}
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
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${sIdx === currentStepIdx ? 'w-5 bg-primary' : completed.has(steps[sIdx].id) ? 'w-2.5 bg-emerald-500' : 'w-1.5 bg-gray-250 dark:bg-gray-700'}`}
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

                                {/* Slide Content Body with smooth React Key animation */}
                                <div key={animationKey} className={`flex-1 flex flex-col justify-between p-6 overflow-y-auto ${direction === 'next' ? 'animate-slide-next' : 'animate-slide-prev'}`}>
                                    
                                    {/* 1. WELCOME SCREEN (Step = -1) */}
                                    {currentStepIdx === -1 && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                                            <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-primary via-blue-500 to-indigo-600 flex items-center justify-center text-4xl shadow-2xl relative animate-phone-float mb-6 ring-4 ring-white dark:ring-gray-800">
                                                <Rocket size={38} className="text-white" />
                                                <div className="absolute -top-1 -right-1 flex h-4 w-4 animate-ping rounded-full bg-primary/60" />
                                            </div>
                                            <h3 className="text-xl font-black text-secondary dark:text-white leading-tight tracking-tight">
                                                Welcome to Your Staycation Site!
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-[240px] mt-3">
                                                Let\'s launch your beautiful paradise in 5 quick, visual steps. Takes under 3 minutes!
                                            </p>
                                            
                                            <button
                                                onClick={goNext}
                                                className="w-full mt-10 py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                Start Setup Wizard <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {/* 2. ACTIVE STEPS (Steps 0 to 4) */}
                                    {currentStepIdx >= 0 && currentStepIdx < steps.length && (() => {
                                        const step = steps[currentStepIdx];
                                        const done = completed.has(step.id);
                                        return (
                                            <div className="flex-1 flex flex-col justify-between h-full">
                                                <div className="space-y-4">
                                                    {/* Visual Mockup Card */}
                                                    {renderVisualMockup(step.visualType)}

                                                    {/* Headers */}
                                                    <div className="text-center">
                                                        <span className="text-[26px] block mb-1 leading-none">{step.emoji}</span>
                                                        <h3 className="text-base font-black text-secondary dark:text-white leading-tight flex items-center justify-center gap-1.5">
                                                            {step.title}
                                                            {done && <CheckCircle2 size={16} className="text-emerald-500" />}
                                                        </h3>
                                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">{step.subtitle}</p>
                                                    </div>

                                                    {/* Friendly Simple Description */}
                                                    <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold leading-relaxed text-center bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-850 p-3 rounded-xl">
                                                        {step.intro}
                                                    </p>
                                                </div>

                                                {/* Slide Actions */}
                                                <div className="space-y-2 mt-6">
                                                    {/* Primary Setup Trigger */}
                                                    <button
                                                        onClick={() => handleNavigate(step)}
                                                        className="w-full py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-lg shadow-primary/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        {step.actionLabel}
                                                    </button>
                                                    
                                                    {/* Mark complete toggler */}
                                                    <button
                                                        onClick={() => markCompleteAndNext(step.id)}
                                                        className="w-full py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1"
                                                    >
                                                        <CheckCircle2 size={14} /> {done ? 'Step Completed ✓' : 'Mark Done & Next'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* 3. CELEBRATION SCREEN (Step = 5) */}
                                    {currentStepIdx === steps.length && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 h-full">
                                            
                                            {/* Rotating trophy mockup */}
                                            <div className="relative w-full h-36 bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-blue-500/10 rounded-2xl flex flex-col items-center justify-center border border-emerald-500/20 overflow-hidden shadow-inner select-none mb-4 animate-phone-float">
                                                <div className="absolute inset-0 flex items-center justify-center animate-rotate-sparkle pointer-events-none">
                                                    <Sparkles size={160} className="text-amber-400/15" />
                                                </div>
                                                <Trophy size={48} className="text-amber-500 fill-amber-500/10 drop-shadow-[0_10px_20px_rgba(245,158,11,0.25)]" />
                                                <div className="mt-2.5 flex items-center gap-1.5 bg-emerald-500/15 backdrop-blur-md px-3 py-0.5 rounded-full border border-emerald-500/25">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    <span className="text-[9px] font-black tracking-wide uppercase text-emerald-600 dark:text-emerald-400">All Set!</span>
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-black text-secondary dark:text-white leading-tight">
                                                Your Website is Live!
                                            </h3>
                                            
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-[260px] mt-2.5">
                                                Congratulations! Your beautiful staycation villa is fully configured and ready to secure payouts directly to your account.
                                            </p>
                                            
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                className="w-full mt-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 hover:scale-[1.02] transition-all flex items-center justify-center gap-1 cursor-pointer border border-white/10"
                                            >
                                                Launch Public Site 🚀
                                            </button>
                                        </div>
                                    )}

                                </div>
                            </div>
                            
                            {/* Mock home indicator swipe bar */}
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-800 rounded-full z-[130] pointer-events-none"></div>
                        </div>
                    </div>
                </>
            )}

            {/* Custom Animations injection block */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-6px) rotate(1.5deg); }
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
                    from { transform: translateX(35px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slide-prev-in {
                    from { transform: translateX(-35px); opacity: 0; }
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
            `}</style>
        </>
    );
};

export default AdminOnboarding;