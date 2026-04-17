import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface AdminPasscodeGateProps {
    children: React.ReactNode;
    onBack: () => void;
}

const PASSCODE_LENGTH = 6;

const AdminPasscodeGate: React.FC<AdminPasscodeGateProps> = ({ children, onBack }) => {
    const [adminPasscode, setAdminPasscode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [digits, setDigits] = useState<string[]>(Array(PASSCODE_LENGTH).fill(''));
    const [showPasscode, setShowPasscode] = useState(false);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Load admin passcode from Firestore and check cookies (localStorage)
    useEffect(() => {
        const load = async () => {
            try {
                const snap = await getDoc(doc(db, '_superadmin', 'settings'));
                if (snap.exists() && snap.data().adminPasscode) {
                    const dbPasscode = snap.data().adminPasscode;
                    setAdminPasscode(dbPasscode);
                    
                    // Auto-login if localstorage matches the active passcode
                    const savedPasscode = window.localStorage.getItem('staycation_admin_passcode');
                    if (savedPasscode === dbPasscode) {
                        setIsAuthenticated(true);
                    }
                } else {
                    setAdminPasscode(''); // empty string means bypassed
                }
            } catch (err: any) {
                setAdminPasscode('');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Auto-focus first input
    useEffect(() => {
        if (!isLoading && adminPasscode && !isAuthenticated) {
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [isLoading, adminPasscode, isAuthenticated]);

    const handleDigitChange = (index: number, value: string) => {
        if (error) setError('');

        // Handle multiple digits (for fast typing or partial paste)
        const cleaned = value.replace(/\D/g, '');
        if (!cleaned) {
            const newDigits = [...digits];
            newDigits[index] = '';
            setDigits(newDigits);
            return;
        }

        const newDigits = [...digits];
        let nextIndex = index;

        // Spread the digits across the boxes starting from current index
        for (let i = 0; i < cleaned.length && nextIndex < PASSCODE_LENGTH; i++) {
            newDigits[nextIndex] = cleaned[i];
            nextIndex++;
        }
        
        setDigits(newDigits);

        // Move focus to the next empty box or the last used box
        const focusTarget = nextIndex < PASSCODE_LENGTH ? nextIndex : PASSCODE_LENGTH - 1;
        if (focusTarget !== index) {
            inputRefs.current[focusTarget]?.focus();
        }

        // Check if all digits are now entered
        const code = newDigits.join('');
        if (code.length === PASSCODE_LENGTH) {
            if (code === adminPasscode) {
                setIsAuthenticated(true);
                window.localStorage.setItem('staycation_admin_passcode', code);
            } else {
                setError('Incorrect passcode');
                setShake(true);
                setTimeout(() => {
                    setShake(false);
                    setDigits(Array(PASSCODE_LENGTH).fill(''));
                    inputRefs.current[0]?.focus();
                }, 600);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            const newDigits = [...digits];
            newDigits[index - 1] = '';
            setDigits(newDigits);
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PASSCODE_LENGTH);
        if (pastedData) {
            const newDigits = Array(PASSCODE_LENGTH).fill('');
            pastedData.split('').forEach((d, i) => { newDigits[i] = d; });
            setDigits(newDigits);
            if (pastedData.length === PASSCODE_LENGTH) {
                if (pastedData === adminPasscode) {
                    setIsAuthenticated(true);
                    window.localStorage.setItem('staycation_admin_passcode', pastedData);
                } else {
                    setError('Incorrect passcode');
                    setShake(true);
                    setTimeout(() => {
                        setShake(false);
                        setDigits(Array(PASSCODE_LENGTH).fill(''));
                        inputRefs.current[0]?.focus();
                    }, 600);
                }
            } else {
                inputRefs.current[pastedData.length]?.focus();
            }
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
                <div className="w-48 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full"
                        style={{
                            animation: 'loadingSlide 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                        }}
                    />
                </div>
                <style>{`
                    @keyframes loadingSlide {
                        0% { width: 0%; margin-left: 0%; }
                        50% { width: 60%; margin-left: 20%; }
                        100% { width: 0%; margin-left: 100%; }
                    }
                `}</style>
            </div>
        );
    }

    // No passcode set — pass through directly
    if (!adminPasscode) {
        return <>{children}</>;
    }

    // Authenticated — show admin panel
    if (isAuthenticated) {
        return <>{children}</>;
    }

    // Passcode entry screen
    return (
        <div className="relative min-h-screen">
            {/* The actual admin dashboard, disabled and blurred out */}
            <div className="pointer-events-none select-none filter blur-sm">
                {children}
            </div>

            {/* The transparent glassmorphism gate overlay */}
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" style={{ backdropFilter: 'blur(8px)' }}>
                <div className="absolute inset-0 bg-black/60 dark:bg-black/70" />
                <div className="relative w-full max-w-sm">

                    <div className="bg-white/10 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                        {/* Decorative subtle gradient */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

                        {/* Back button */}
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
                        >
                            <ArrowLeft size={16} />
                            Back to website
                        </button>

                        {/* Lock icon */}
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto bg-white/10 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                                <Lock className="text-white/80" size={28} />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 tracking-tight">Admin Panel</h1>
                            <p className="text-gray-400 text-sm">Enter your {PASSCODE_LENGTH}-digit passcode</p>
                        </div>

                        {/* Passcode input boxes */}
                        <div
                            className={`flex justify-center gap-2 sm:gap-3 mb-6 transition-transform ${shake ? 'animate-shake' : ''}`}
                        >
                            {digits.map((digit, i) => (
                    <input
                                key={i}
                                ref={el => { inputRefs.current[i] = el; }}
                                type={showPasscode ? 'text' : 'tel'}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="one-time-code"
                                maxLength={PASSCODE_LENGTH}
                                value={digit}
                                onChange={e => handleDigitChange(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                onPaste={i === 0 ? handlePaste : undefined}
                                className={`w-10 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border-2 transition-all duration-200 outline-none
                                ${digit
                                        ? 'bg-white/10 border-primary text-white shadow-[0_0_15px_rgba(var(--color-primary),0.3)]'
                                        : 'bg-white/5 border-white/10 text-white hover:border-white/20 hover:bg-white/10'
                                    }
                                focus:border-primary focus:bg-white/15 focus:ring-4 focus:ring-primary/20
                                ${error ? 'border-red-500/60 bg-red-500/10' : ''}
                            `}
                                style={{
                                    caretColor: 'transparent',
                                    // Visually mask digits when showPasscode is off, without type=password
                                    // This avoids password manager interference on HTTPS (Vercel)
                                    WebkitTextSecurity: showPasscode ? 'none' : 'disc',
                                    fontFamily: showPasscode ? 'inherit' : 'text-security-disc'
                                } as React.CSSProperties}
                            />
                            ))}
                        </div>

                        {/* Show/hide toggle */}
                        <div className="flex justify-center mb-4">
                            <button
                                onClick={() => setShowPasscode(!showPasscode)}
                                className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/5"
                            >
                                {showPasscode ? <EyeOff size={14} /> : <Eye size={14} />}
                                {showPasscode ? 'Hide passcode' : 'Show passcode'}
                            </button>
                        </div>

                        {/* Error message */}
                        <div className="h-6 flex items-center justify-center">
                            {error && (
                                <p className="text-center text-red-400 text-sm font-medium animate-fade-in bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">{error}</p>
                            )}
                        </div>
                    </div>

                    {/* Subtle hint outside the card */}
                    <p className="text-center text-gray-500 dark:text-gray-400 text-xs mt-6 px-4">
                        Contact your administrator if you forgot the passcode
                    </p>
                </div>

                <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.5s ease-in-out; }
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
                    40% { transform: scale(1); opacity: 1; }
                }
            `}</style>
            </div>
        </div>
    );
};

export default AdminPasscodeGate;
