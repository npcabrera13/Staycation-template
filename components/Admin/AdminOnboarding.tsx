import React, { useState } from 'react';
import { X, ChevronRight, ChevronDown, Image as ImageIcon, CreditCard, Share2, Palette, Rocket, CheckCircle2, Circle, ArrowRight, MapPin, Sparkles } from 'lucide-react';

interface AdminOnboardingProps {
    onNavigate: (tab: string, targetId?: string) => void;
    onEnterVisualBuilder?: (targetId?: string) => void;
}

const steps = [
    {
        id: 'payment',
        emoji: '💰',
        title: 'GCash & Bank Details',
        subtitle: 'Set up your payments piggy bank!',
        tab: 'settings',
        targetId: 'settings-payment',
        intro: 'When guests want to stay at your awesome property, they need a way to pay you! We will set up your GCash piggy bank and bank details so payments fly straight into your pocket! 💵',
        guidelines: [
            'Look at the left side of your screen. Find that button with the little gear icon ⚙️ labeled "Settings" and click it!',
            'Scroll down until you see the big card that says "Payment Settings" (look for the credit card icon 💳 next to it).',
            'Under the GCash Details box, type in your 11-digit GCash Mobile Number (like 09171234567).',
            'Type your full name in the "GCash Account Name" box. Make sure it matches your official GCash name exactly!',
            'If you want to receive bank transfers too, fill in your Bank Name (like BDO or BPI), Account Name, and Bank Account Number.',
            'Crucial Action! Find the toggle switch next to "Enable GCash" and tap it so it turns blue/green (ON)!',
            'Scroll to the bottom of the page and click the big green "Save Changes" button. You did it! 🎉'
        ],
        superTip: 'Double check your mobile phone number! Sending money to the wrong phone number is like dropping your delicious ice cream cone on the floor! 🍦',
        watchOut: 'Never share your GCash MPIN or OTP code with anyone! Those are secret keys only for your eyes! 🤫'
    },
    {
        id: 'photos',
        emoji: '🖼️',
        title: 'Add Room Photos',
        subtitle: 'Make your rooms look amazing!',
        tab: 'rooms',
        targetId: undefined,
        intro: 'Imagine looking at a toy catalog. You would want to see real, beautiful pictures of the cool toys, right? Guests want to see your cozy beds, sparkling pool, and clean bathrooms! 📸',
        guidelines: [
            'Click the button with the bed icon 🛏️ labeled "Rooms" on the left sidebar.',
            'You will see a list of your staycation rooms. Pick one (like the "Deluxe Suite") and click the blue "Edit Room" button.',
            'Scroll down to the "Room Gallery" section (look for the photo frame icon 🖼️).',
            'Click the "Upload Photo" button. Select a beautiful photo of your property from your phone or computer.',
            'Once the photo uploads, click the little Star icon ⭐ on your picture to make it the "Cover Photo" (the big main image guests see on the website first!).',
            'Add at least 3 to 4 photos showing the comfy bed, the view, and the clean bathroom.',
            'Click the green "Update Room" button to save. Repeat this for your other rooms!'
        ],
        superTip: 'Open all your curtains and turn on the lights before taking pictures! Bright, sunny rooms look bigger, happier, and much cleaner! ☀️',
        watchOut: 'Upload wide photos (horizontal 📺) rather than tall photos (vertical 📱). Wide photos fit the website boxes perfectly without getting cropped!'
    },
    {
        id: 'social',
        emoji: '📲',
        title: 'Social Media Links',
        subtitle: 'Connect with your friends!',
        tab: 'settings',
        targetId: 'footer',
        isVisualBuilder: true,
        intro: 'Let\'s put links to your Facebook and Instagram pages at the bottom of your website! That way, guests can click them to see your daily posts, beautiful stories, and send you direct messages! 💬',
        guidelines: [
            'Click the glowing blue "Go there" button below to launch the Website Builder Panel!',
            'In the builder sidebar on the left, find the section labeled "Social & Links" (look for the paperclip/link icon 🔗). Tap it to open.',
            'Open your Facebook app or Instagram page in another tab, copy your page\'s web address (e.g. https://facebook.com/yourstaycation), and paste it into the "Facebook URL" input field.',
            'Do the exact same thing for your "Instagram URL" and "Airbnb/Booking.com" links if you have them!',
            'Turn on the little toggle switches next to the links you want to show in the footer of your website.',
            'Click the big blue "Save & Publish" button at the top of the builder sidebar. Scroll to the bottom of your website—your social buttons are live!'
        ],
        superTip: 'If you don\'t have a business page yet, you can link to your personal profile or leave the fields blank until you create a dedicated page!',
        watchOut: 'Make sure your links start with https://! If you just write facebook.com, the buttons won\'t know how to navigate on the internet! 🌐'
    },
    {
        id: 'map',
        emoji: '📍',
        title: 'Set Your Map Location',
        subtitle: 'Help guests find your paradise!',
        tab: 'settings',
        targetId: 'contact',
        isVisualBuilder: true,
        intro: 'We\'re going to put a real, interactive map on your website. Guests can pinch, scroll, and zoom this map to see exactly where your property is and get driving directions! 🗺️',
        guidelines: [
            'Click the "Go there" button below. The page will automatically scroll you right to the "Contact & Map" section.',
            'In the builder sidebar on the left, find the accordion labeled "Contact & Map" and tap it open.',
            'Let\'s find your map embed link! Open a new tab in your web browser and go to Google Maps (maps.google.com).',
            'Search for your property name or address. Click the "Share" button (it looks like a paper airplane ✈️), then select the "Embed a map" tab.',
            'You will see a long HTML code starting with <iframe. Look closely! Only copy the web link inside the double quotes after src=". It looks like https://www.google.com/maps/embed?pb=...',
            'Paste this copied link directly into the "Google Maps Embed URL" text field in the builder sidebar.',
            'Click "Save & Publish"! The map will immediately update to show your property!'
        ],
        superTip: 'Make sure the link you copy contains /embed! If you copy a regular Google Maps share link (like https://goo.gl/maps/...), the map box will show an error.',
        watchOut: 'Do NOT paste the entire <iframe ...></iframe> code! Just the web link inside the quotes. 🕵️‍♂️'
    },
    {
        id: 'design',
        emoji: '🎨',
        title: 'Color & Design',
        subtitle: 'Paint your beautiful website!',
        tab: 'overview',
        targetId: undefined,
        isVisualBuilder: true,
        intro: 'Let\'s paint your website! You can pick from beautiful preset color boxes (like deep royal blue or luxurious green) or mix your own custom color palette to make your site look stunning! 🖌️',
        guidelines: [
            'Click the "Go there" button below to launch the Website Builder.',
            'Open the section labeled "Theme & Colors" (look for the paint palette icon 🎨).',
            'Look at the "Color Presets" row. Try clicking the different boxes: Navy & Gold 🌌, Emerald Luxe 🌲, Sunset Warmth 🌅, or Serene Teal 🌊.',
            'You can also pick a "Custom Primary Color" by clicking the color circle and sliding your mouse around the rainbow!',
            'Scroll down to "Typography" and select a font style: Sans-Serif (Modern), Serif (Elegant), or Monospace (Typewriter).',
            'Tap "Save & Publish" at the top to lock in your beautiful new design!'
        ],
        superTip: 'Choose a rich, dark primary color so white text on buttons stands out and is super easy for grandmas and grandpas to read! 👵👴',
        watchOut: 'Try not to use too many colors at once. Pick 2 primary colors and stick with them to keep your website looking extremely professional! 🛡️'
    }
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
                                            <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-4 animate-fade-in bg-white/50 dark:bg-gray-900/50">
                                                {/* Child-friendly Intro */}
                                                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed bg-primary/[0.03] dark:bg-primary/[0.05] p-3.5 rounded-2xl border border-primary/5">
                                                    {step.intro}
                                                </p>

                                                {/* Numbered Success Map Checklist */}
                                                <div className="bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl p-4 space-y-3 border border-gray-100 dark:border-gray-800/80">
                                                    <h5 className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                        <span>📋</span> Map to Success
                                                    </h5>
                                                    <ul className="space-y-3 list-none">
                                                        {step.guidelines.map((line, lIdx) => (
                                                            <li key={lIdx} className="flex gap-2.5 text-xs text-gray-705 dark:text-gray-300 leading-relaxed items-start">
                                                                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm mt-0.5">{lIdx + 1}</span>
                                                                <span className="pt-0.5">{line}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Super Power Tip Callout */}
                                                {step.superTip && (
                                                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl p-3.5 border border-emerald-500/10 flex gap-2.5 items-start">
                                                        <span className="text-base select-none shrink-0 mt-0.5">💡</span>
                                                        <div>
                                                            <h6 className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Super Power Tip!</h6>
                                                            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium leading-normal mt-0.5">
                                                                {step.superTip}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Watch Out! Warning Callout */}
                                                {step.watchOut && (
                                                    <div className="bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl p-3.5 border border-amber-500/10 flex gap-2.5 items-start">
                                                        <span className="text-base select-none shrink-0 mt-0.5">⚠️</span>
                                                        <div>
                                                            <h6 className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Watch Out!</h6>
                                                            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium leading-normal mt-0.5">
                                                                {step.watchOut}
                                                            </p>
                                                        </div>
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