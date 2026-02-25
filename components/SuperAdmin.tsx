import React, { useState, useEffect } from 'react';
import { Lock, Power, User, Save, Loader, CheckCircle, AlertCircle, Shield, LogOut, Database, Copy, RefreshCw, ExternalLink, Globe, Monitor, Clock, Plus, Settings, Trash2, Edit, Key, Eye, EyeOff, Mail, Phone, MessageSquare } from 'lucide-react';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type LockMode = 'none' | 'homepage' | 'admin' | 'both';

interface SubscriptionData {
    lockMode: LockMode;
    expiresAt: string;
    clientName: string;
    plan: string;
    notes: string;
    lastModified: string;
}

const DEFAULT_SUBSCRIPTION: SubscriptionData = {
    lockMode: 'none',
    expiresAt: '',
    clientName: '',
    plan: 'monthly',
    notes: '',
    lastModified: ''
};

const RENEWAL_OPTIONS = [
    { days: 30, label: '30 days' },
    { days: 60, label: '60 days' },
    { days: 90, label: '90 days' },
    { days: 120, label: '120 days' },
    { days: 365, label: '1 year' },
];

const SUPERADMIN_PASSWORD = 'wellington'; // fallback default

const SuperAdmin: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [subscription, setSubscription] = useState<SubscriptionData>(DEFAULT_SUBSCRIPTION);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [showRenewOptions, setShowRenewOptions] = useState(false);
    const [customDays, setCustomDays] = useState('');

    // Firebase SDK State
    const [activeSection, setActiveSection] = useState<'subscription' | 'firebase' | 'settings'>('subscription');
    const [firebaseSnippet, setFirebaseSnippet] = useState('');
    const [firebaseForm, setFirebaseForm] = useState({
        apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: ''
    });
    const [firebaseStatus, setFirebaseStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'testing' | 'connected'>('idle');
    const [firebaseError, setFirebaseError] = useState('');

    // Password change state
    const [storedPassword, setStoredPassword] = useState(SUPERADMIN_PASSWORD);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwStatus, setPwStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [pwError, setPwError] = useState('');
    const [showLoginPw, setShowLoginPw] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    // Contact info state
    const [contactInfo, setContactInfo] = useState({ providerName: '', email: '', phone: '' });
    const [contactStatus, setContactStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // AI Chat toggle
    const [enableAiChat, setEnableAiChat] = useState(false);

    // Admin passcode (read-only in SuperAdmin)
    const [adminPasscode, setAdminPasscode] = useState('');
    const [showAdminPasscode, setShowAdminPasscode] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            loadSubscription();
            loadFirebaseConfig();
        }
    }, [isAuthenticated]);

    // Load password from Firestore on mount
    useEffect(() => {
        const loadPassword = async () => {
            try {
                const snap = await getDoc(doc(db, '_superadmin', 'settings'));
                if (snap.exists()) {
                    if (snap.data().password) setStoredPassword(snap.data().password);
                    if (snap.data().contactInfo) setContactInfo(snap.data().contactInfo);
                    if (typeof snap.data().enableAiChat === 'boolean') setEnableAiChat(snap.data().enableAiChat);
                    if (snap.data().adminPasscode) setAdminPasscode(snap.data().adminPasscode);
                }
            } catch { }
        };
        loadPassword();
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === storedPassword) {
            setIsAuthenticated(true);
            setAuthError('');
        } else {
            setAuthError('Invalid password');
        }
    };

    const loadSubscription = async () => {
        setIsLoading(true);
        try {
            const docRef = doc(db, '_superadmin', 'subscription');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Backward compat: convert old `active` boolean to lockMode
                if ('active' in data && !('lockMode' in data)) {
                    data.lockMode = data.active ? 'none' : 'both';
                }
                setSubscription({ ...DEFAULT_SUBSCRIPTION, ...data } as SubscriptionData);
            }
        } catch (error) {
            console.error('Failed to load subscription:', error);
            setStatusMessage('Failed to load subscription data');
        }
        setIsLoading(false);
    };

    const saveSubscription = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        try {
            const data = { ...subscription, lastModified: new Date().toISOString() };
            await setDoc(doc(db, '_superadmin', 'subscription'), data);
            setSubscription(data);
            setSaveStatus('saved');
            setStatusMessage('Subscription updated successfully!');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error: any) {
            setSaveStatus('error');
            setStatusMessage(`Failed to save: ${error.message}`);
        }
        setIsSaving(false);
    };

    // Calculate days remaining
    const getDaysRemaining = (): number | null => {
        if (!subscription.expiresAt) return null;
        const diff = new Date(subscription.expiresAt).getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const handleRenew = (days: number) => {
        // Add days to current expiry (or from today if already expired / not set)
        const base = subscription.expiresAt && new Date(subscription.expiresAt) > new Date()
            ? new Date(subscription.expiresAt)
            : new Date();
        const newExpiry = new Date(base);
        newExpiry.setDate(newExpiry.getDate() + days);
        setSubscription({
            ...subscription,
            expiresAt: newExpiry.toISOString().split('T')[0]
        });
        setShowRenewOptions(false);
        setStatusMessage(`Added ${days} days — don't forget to Save!`);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
    };

    const daysRemaining = getDaysRemaining();

    // Firebase SDK functions
    const loadFirebaseConfig = async () => {
        try {
            const res = await fetch('/api/firebase-config');
            if (res.ok) {
                const data = await res.json();
                if (data && data.projectId) {
                    setFirebaseForm(data);
                    setFirebaseStatus('connected');
                }
            }
        } catch { }
    };

    const parseFirebaseSnippet = (snippet: string) => {
        const extract = (key: string) => {
            const regex = new RegExp(`${key}:\\s*["']([^"']*)["']`);
            const match = snippet.match(regex);
            return match ? match[1] : '';
        };
        const parsed = {
            apiKey: extract('apiKey'), authDomain: extract('authDomain'),
            projectId: extract('projectId'), storageBucket: extract('storageBucket'),
            messagingSenderId: extract('messagingSenderId'), appId: extract('appId')
        };
        if (parsed.apiKey || parsed.projectId) {
            setFirebaseForm(parsed);
            setFirebaseError('');
        } else {
            setFirebaseError('Could not parse config. Paste the full Firebase config object.');
        }
    };

    const saveFirebaseConfig = async () => {
        setFirebaseStatus('saving');
        setFirebaseError('');
        try {
            const res = await fetch('/api/save-firebase-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(firebaseForm)
            });
            if (!res.ok) throw new Error('Failed to save');
            setFirebaseStatus('saved');
            setTimeout(() => {
                if (firebaseForm.projectId) setFirebaseStatus('connected');
                else setFirebaseStatus('idle');
            }, 2000);
        } catch (e: any) {
            setFirebaseStatus('error');
            setFirebaseError(e.message || 'Failed to save');
        }
    };

    const testFirebaseConnection = async () => {
        setFirebaseStatus('testing');
        try {
            const { initializeApp, deleteApp } = await import('firebase/app');
            const { getFirestore, collection, getDocs } = await import('firebase/firestore');
            const testApp = initializeApp(firebaseForm, 'test-connection');
            const testDb = getFirestore(testApp);
            await getDocs(collection(testDb, '__test__'));
            await deleteApp(testApp);
            setFirebaseStatus('connected');
        } catch (e: any) {
            if (e.code === 'permission-denied' || e.code === 'unavailable') {
                setFirebaseStatus('connected');
            } else {
                setFirebaseStatus('error');
                setFirebaseError(`Connection failed: ${e.message}`);
            }
        }
    };

    // Password Gate
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 flex items-center justify-center p-4">
                <div className="max-w-sm w-full">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-2xl flex items-center justify-center mb-4">
                            <Shield className="text-amber-400" size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Super Admin</h1>
                        <p className="text-gray-400 text-sm mt-1">Authorized access only</p>
                    </div>
                    <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showLoginPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
                                    className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="Enter master password"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowLoginPw(!showLoginPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showLoginPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        {authError && (
                            <p className="text-red-400 text-sm mb-4 flex items-center">
                                <AlertCircle size={14} className="mr-1" /> {authError}
                            </p>
                        )}
                        <button type="submit" className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors">
                            <Lock size={16} className="inline mr-2" />Access Panel
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 flex items-center justify-center">
                <Loader className="animate-spin text-amber-400" size={40} />
            </div>
        );
    }

    // Derive toggle states from lockMode
    const isHomepageLocked = subscription.lockMode === 'homepage' || subscription.lockMode === 'both';
    const isAdminLocked = subscription.lockMode === 'admin' || subscription.lockMode === 'both';

    const toggleHomepageLock = () => {
        const newHomepage = !isHomepageLocked;
        const mode: LockMode = newHomepage && isAdminLocked ? 'both' : newHomepage ? 'homepage' : isAdminLocked ? 'admin' : 'none';
        setSubscription({ ...subscription, lockMode: mode });
    };
    const toggleAdminLock = () => {
        const newAdmin = !isAdminLocked;
        const mode: LockMode = isHomepageLocked && newAdmin ? 'both' : isHomepageLocked ? 'homepage' : newAdmin ? 'admin' : 'none';
        setSubscription({ ...subscription, lockMode: mode });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center mr-3">
                            <Shield className="text-amber-400" size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Super Admin</h1>
                            <p className="text-gray-400 text-xs">Site Management</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setIsAuthenticated(false); setPassword(''); }}
                        className="flex items-center px-3 py-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
                    >
                        <LogOut size={16} className="mr-1" /> Logout
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex mb-6 bg-white/5 rounded-xl p-1 border border-white/10">
                    <button
                        onClick={() => setActiveSection('subscription')}
                        className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === 'subscription' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Power size={16} className="mr-2" /> Subscription
                    </button>
                    <button
                        onClick={() => setActiveSection('firebase')}
                        className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === 'firebase' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Database size={16} className="mr-2" /> Firebase
                        {firebaseStatus === 'connected' && <span className="ml-2 w-2 h-2 bg-green-400 rounded-full"></span>}
                    </button>
                    <button
                        onClick={() => setActiveSection('settings')}
                        className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === 'settings' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Settings size={16} className="mr-2" /> Settings
                    </button>
                </div>

                {/* Status Messages */}
                {saveStatus === 'saved' && (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6 flex items-center">
                        <CheckCircle className="text-green-400 mr-3" size={20} />
                        <p className="text-green-300 text-sm font-medium">{statusMessage}</p>
                    </div>
                )}
                {saveStatus === 'error' && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center">
                        <AlertCircle className="text-red-400 mr-3" size={20} />
                        <p className="text-red-300 text-sm font-medium">{statusMessage}</p>
                    </div>
                )}

                {/* ===== SUBSCRIPTION TAB ===== */}
                {activeSection === 'subscription' && (
                    <>
                        {/* Lock Mode Toggles */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6">
                            <h3 className="text-md font-bold text-white mb-4 flex items-center">
                                <Lock size={18} className="mr-2 text-amber-400" />
                                Lock Mode
                            </h3>
                            <div className="space-y-3">
                                {/* Homepage Toggle */}
                                <button
                                    onClick={toggleHomepageLock}
                                    className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${isHomepageLocked
                                        ? 'border-red-500 bg-red-500/15'
                                        : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg mr-4 ${isHomepageLocked ? 'bg-red-500/20' : 'bg-white/10'}`}>
                                        <Globe size={20} className={isHomepageLocked ? 'text-red-400' : 'text-gray-400'} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <span className="text-sm font-bold text-white block">Homepage</span>
                                        <span className="text-xs text-gray-400">Public-facing website</span>
                                    </div>
                                    <div className={`w-11 h-6 rounded-full transition-colors relative ${isHomepageLocked ? 'bg-red-500' : 'bg-gray-600'}`}>
                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isHomepageLocked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                </button>

                                {/* Admin Toggle */}
                                <button
                                    onClick={toggleAdminLock}
                                    className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${isAdminLocked
                                        ? 'border-red-500 bg-red-500/15'
                                        : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg mr-4 ${isAdminLocked ? 'bg-red-500/20' : 'bg-white/10'}`}>
                                        <Monitor size={20} className={isAdminLocked ? 'text-red-400' : 'text-gray-400'} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <span className="text-sm font-bold text-white block">Admin Panel</span>
                                        <span className="text-xs text-gray-400">Dashboard & management</span>
                                    </div>
                                    <div className={`w-11 h-6 rounded-full transition-colors relative ${isAdminLocked ? 'bg-red-500' : 'bg-gray-600'}`}>
                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAdminLocked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-3 text-center">
                                {subscription.lockMode === 'none' && '✅ All pages are accessible to visitors'}
                                {subscription.lockMode === 'homepage' && '🔒 Homepage shows lockout screen — admin panel still works'}
                                {subscription.lockMode === 'admin' && '🔒 Admin panel shows overlay popup — homepage still works'}
                                {subscription.lockMode === 'both' && '🔒 Both homepage and admin panel are locked'}
                            </p>
                        </div>

                        {/* Expiry & Renewal */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6">
                            <h3 className="text-md font-bold text-white mb-4 flex items-center">
                                <Clock size={18} className="mr-2 text-amber-400" />
                                Subscription Period
                            </h3>

                            {/* Days Remaining Display */}
                            <div className={`rounded-xl p-4 mb-4 text-center border ${daysRemaining === null
                                ? 'bg-gray-500/10 border-gray-500/20'
                                : daysRemaining <= 0
                                    ? 'bg-red-500/15 border-red-500/30'
                                    : daysRemaining <= 7
                                        ? 'bg-yellow-500/15 border-yellow-500/30'
                                        : 'bg-green-500/15 border-green-500/30'
                                }`}>
                                {daysRemaining === null ? (
                                    <p className="text-gray-400 text-sm">No expiry date set</p>
                                ) : daysRemaining <= 0 ? (
                                    <>
                                        <p className="text-3xl font-bold text-red-400">Expired</p>
                                        <p className="text-red-300/70 text-sm mt-1">Expired {Math.abs(daysRemaining)} days ago</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-3xl font-bold text-white">{daysRemaining}</p>
                                        <p className={`text-sm mt-1 ${daysRemaining <= 7 ? 'text-yellow-300/80' : 'text-green-300/80'}`}>
                                            days remaining
                                        </p>
                                    </>
                                )}
                                {subscription.expiresAt && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Expires: {new Date(subscription.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                )}
                            </div>

                            {/* Manual Expiry Date Editor */}
                            <div className="flex gap-2 items-end mb-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Set / Edit Expiry Date</label>
                                    <input
                                        type="date"
                                        value={subscription.expiresAt || ''}
                                        onChange={(e) => setSubscription({ ...subscription, expiresAt: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm [color-scheme:dark]"
                                    />
                                </div>
                                {subscription.expiresAt && (
                                    <button
                                        onClick={() => { setSubscription({ ...subscription, expiresAt: '' }); setStatusMessage('Expiry cleared — don\'t forget to Save!'); setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 3000); }}
                                        className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-colors border border-red-500/30 text-sm flex items-center"
                                    >
                                        <Trash2 size={14} className="mr-1" /> Clear
                                    </button>
                                )}
                            </div>

                            {/* Renew Button */}
                            <button
                                onClick={() => setShowRenewOptions(!showRenewOptions)}
                                className="w-full py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold rounded-xl transition-colors border border-amber-500/30 flex items-center justify-center"
                            >
                                <Plus size={18} className="mr-2" /> Renew Subscription
                            </button>

                            {/* Renewal Options */}
                            {showRenewOptions && (
                                <div className="mt-3 space-y-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        {RENEWAL_OPTIONS.map(({ days, label }) => (
                                            <button
                                                key={days}
                                                onClick={() => handleRenew(days)}
                                                className="py-2.5 px-3 bg-white/10 hover:bg-amber-500/20 text-white hover:text-amber-300 rounded-lg transition-all text-sm font-medium border border-white/10 hover:border-amber-500/30"
                                            >
                                                +{label}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Custom Days */}
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={customDays}
                                            onChange={(e) => setCustomDays(e.target.value)}
                                            className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                            placeholder="Custom days..."
                                        />
                                        <button
                                            onClick={() => { if (customDays && parseInt(customDays) > 0) { handleRenew(parseInt(customDays)); setCustomDays(''); } }}
                                            disabled={!customDays || parseInt(customDays) <= 0}
                                            className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold rounded-xl transition-colors border border-amber-500/30 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            +Add
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Client Details */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6 space-y-5">
                            <h3 className="text-md font-bold text-white flex items-center">
                                <User size={18} className="mr-2 text-amber-400" />
                                Client Details
                            </h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Client Name</label>
                                <input
                                    type="text"
                                    value={subscription.clientName}
                                    onChange={(e) => setSubscription({ ...subscription, clientName: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="e.g. Hotel Sunshine"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Plan</label>
                                <select
                                    value={subscription.plan}
                                    onChange={(e) => setSubscription({ ...subscription, plan: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="trial" className="bg-gray-800">Trial</option>
                                    <option value="monthly" className="bg-gray-800">Monthly</option>
                                    <option value="yearly" className="bg-gray-800">Yearly</option>
                                    <option value="lifetime" className="bg-gray-800">Lifetime</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                                <textarea
                                    value={subscription.notes}
                                    onChange={(e) => setSubscription({ ...subscription, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none h-20"
                                    placeholder="Internal notes..."
                                />
                            </div>
                        </div>

                        {/* Save */}
                        <button
                            onClick={saveSubscription}
                            disabled={isSaving}
                            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isSaving ? <><Loader size={18} className="mr-2 animate-spin" /> Saving...</> : <><Save size={18} className="mr-2" /> Save Changes</>}
                        </button>

                        {subscription.lastModified && (
                            <p className="text-center text-gray-500 text-xs mt-4">Last updated: {new Date(subscription.lastModified).toLocaleString()}</p>
                        )}
                    </>
                )}

                {/* ===== FIREBASE SDK TAB ===== */}
                {activeSection === 'firebase' && (
                    <>
                        {firebaseStatus === 'connected' && (
                            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6 flex items-center">
                                <CheckCircle className="text-green-400 mr-3 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-bold text-green-300 text-sm">Connected to Firebase</p>
                                    <p className="text-green-400/70 text-xs font-mono">{firebaseForm.projectId}</p>
                                </div>
                            </div>
                        )}
                        {firebaseStatus === 'saved' && (
                            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6 flex items-center">
                                <CheckCircle className="text-green-400 mr-3" size={20} />
                                <p className="text-green-300 text-sm font-medium">Firebase config saved! Refresh the client site to apply.</p>
                            </div>
                        )}
                        {firebaseError && (
                            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center">
                                <AlertCircle className="text-red-400 mr-3 flex-shrink-0" size={20} />
                                <p className="text-red-300 text-sm">{firebaseError}</p>
                            </div>
                        )}

                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6">
                            <h3 className="text-md font-bold text-white mb-2 flex items-center">
                                <Copy size={18} className="mr-2 text-amber-400" /> Paste Firebase Config
                            </h3>
                            <p className="text-gray-400 text-xs mb-3">
                                From <span className="font-mono text-amber-400/80">Firebase Console → Project Settings → Your Apps → SDK snippet</span>
                            </p>
                            <textarea
                                className="w-full h-36 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder={`Paste Firebase config here...\n\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "your-app",\n  ...\n};`}
                                value={firebaseSnippet}
                                onChange={(e) => {
                                    setFirebaseSnippet(e.target.value);
                                    if (e.target.value.includes('apiKey') || e.target.value.includes('projectId')) {
                                        parseFirebaseSnippet(e.target.value);
                                    }
                                }}
                            />
                            <p className="text-xs text-gray-500 mt-2">Config is auto-parsed when you paste</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6">
                            <h3 className="text-md font-bold text-white mb-4 flex items-center">
                                <Database size={18} className="mr-2 text-amber-400" /> Configuration Values
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { key: 'apiKey', label: 'API Key' }, { key: 'authDomain', label: 'Auth Domain' },
                                    { key: 'projectId', label: 'Project ID' }, { key: 'storageBucket', label: 'Storage Bucket' },
                                    { key: 'messagingSenderId', label: 'Messaging Sender ID' }, { key: 'appId', label: 'App ID' }
                                ].map(({ key, label }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder={label}
                                            value={(firebaseForm as any)[key]}
                                            onChange={(e) => setFirebaseForm({ ...firebaseForm, [key]: e.target.value })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 mb-6">
                            <button
                                onClick={saveFirebaseConfig}
                                disabled={!firebaseForm.projectId || firebaseStatus === 'saving'}
                                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {firebaseStatus === 'saving' ? <><Loader size={18} className="mr-2 animate-spin" /> Saving...</> : <><Save size={18} className="mr-2" /> Save Config</>}
                            </button>
                            <button
                                onClick={testFirebaseConnection}
                                disabled={!firebaseForm.projectId || firebaseStatus === 'testing'}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {firebaseStatus === 'testing' ? <><Loader size={18} className="mr-2 animate-spin" /> Testing...</> : <><RefreshCw size={18} className="mr-2" /> Test Connection</>}
                            </button>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
                            <h4 className="font-bold text-amber-300 text-sm mb-2 flex items-center">
                                <ExternalLink size={14} className="mr-2" /> How to get Firebase config
                            </h4>
                            <ol className="text-amber-200/70 text-xs space-y-1.5 list-decimal list-inside">
                                <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline font-mono text-amber-300">console.firebase.google.com</a></li>
                                <li>Create or select your project</li>
                                <li>Click ⚙️ → <strong>Project settings</strong></li>
                                <li>Scroll to <strong>"Your apps"</strong> → Add web app if needed</li>
                                <li>Copy the <strong>firebaseConfig</strong> object and paste above</li>
                            </ol>
                            <p className="text-amber-300/60 text-xs mt-3">
                                <strong>Don't forget:</strong> Enable <strong>Firestore Database</strong> and <strong>Storage</strong> in the Firebase project!
                            </p>
                        </div>
                    </>
                )}

                {/* ===== SETTINGS TAB ===== */}
                {activeSection === 'settings' && (
                    <>
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6">
                            <h3 className="text-md font-bold text-white mb-4 flex items-center">
                                <Key size={18} className="mr-2 text-amber-400" />
                                Change Password
                            </h3>

                            {pwStatus === 'saved' && (
                                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 mb-4 flex items-center">
                                    <CheckCircle className="text-green-400 mr-2" size={16} />
                                    <p className="text-green-300 text-sm">Password updated successfully!</p>
                                </div>
                            )}
                            {pwError && (
                                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center">
                                    <AlertCircle className="text-red-400 mr-2" size={16} />
                                    <p className="text-red-300 text-sm">{pwError}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPw ? 'text' : 'password'}
                                            value={currentPw}
                                            onChange={(e) => { setCurrentPw(e.target.value); setPwError(''); }}
                                            className="w-full px-4 py-2.5 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Enter current password"
                                        />
                                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                                            {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPw ? 'text' : 'password'}
                                            value={newPw}
                                            onChange={(e) => { setNewPw(e.target.value); setPwError(''); }}
                                            className="w-full px-4 py-2.5 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Enter new password"
                                        />
                                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                                            {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPw ? 'text' : 'password'}
                                            value={confirmPw}
                                            onChange={(e) => { setConfirmPw(e.target.value); setPwError(''); }}
                                            className="w-full px-4 py-2.5 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Confirm new password"
                                        />
                                        <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                                            {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    setPwError('');
                                    if (currentPw !== storedPassword) { setPwError('Current password is incorrect'); return; }
                                    if (!newPw || newPw.length < 6) { setPwError('New password must be at least 6 characters'); return; }
                                    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
                                    setPwStatus('saving');
                                    try {
                                        await setDoc(doc(db, '_superadmin', 'settings'), { password: newPw }, { merge: true });
                                        setStoredPassword(newPw);
                                        setPwStatus('saved');
                                        setCurrentPw(''); setNewPw(''); setConfirmPw('');
                                        setTimeout(() => setPwStatus('idle'), 3000);
                                    } catch (e: any) {
                                        setPwStatus('error');
                                        setPwError(`Failed: ${e.message}`);
                                    }
                                }}
                                disabled={pwStatus === 'saving' || !currentPw || !newPw || !confirmPw}
                                className="w-full mt-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {pwStatus === 'saving' ? <><Loader size={18} className="mr-2 animate-spin" /> Saving...</> : <><Key size={18} className="mr-2" /> Update Password</>}
                            </button>
                        </div>

                        {/* Contact Info Editor */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6">
                            <h3 className="text-md font-bold text-white mb-4 flex items-center">
                                <Mail size={18} className="mr-2 text-amber-400" />
                                Contact Info (shown on lockout & expiry screens)
                            </h3>

                            {contactStatus === 'saved' && (
                                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 mb-4 flex items-center">
                                    <CheckCircle className="text-green-400 mr-2" size={16} />
                                    <p className="text-green-300 text-sm">Contact info saved!</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Provider / Company Name</label>
                                    <input
                                        type="text"
                                        value={contactInfo.providerName}
                                        onChange={(e) => setContactInfo({ ...contactInfo, providerName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="e.g. Wellington Dev Solutions"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={contactInfo.email}
                                        onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="e.g. support@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={contactInfo.phone}
                                        onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="e.g. +63 912 345 6789"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    setContactStatus('saving');
                                    try {
                                        await setDoc(doc(db, '_superadmin', 'settings'), { contactInfo }, { merge: true });
                                        setContactStatus('saved');
                                        setTimeout(() => setContactStatus('idle'), 3000);
                                    } catch { }
                                }}
                                disabled={contactStatus === 'saving'}
                                className="w-full mt-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center"
                            >
                                {contactStatus === 'saving' ? <><Loader size={18} className="mr-2 animate-spin" /> Saving...</> : <><Save size={18} className="mr-2" /> Save Contact Info</>}
                            </button>
                        </div>

                        {/* AI Chat Toggle */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className={`p-2 rounded-lg mr-4 ${enableAiChat ? 'bg-green-500/20' : 'bg-white/10'}`}>
                                        <MessageSquare size={20} className={enableAiChat ? 'text-green-400' : 'text-gray-400'} />
                                    </div>
                                    <div>
                                        <h3 className="text-md font-bold text-white">AI Chat Assistant</h3>
                                        <p className="text-gray-400 text-xs mt-0.5">Enable the floating AI chat on the homepage</p>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        const newVal = !enableAiChat;
                                        setEnableAiChat(newVal);
                                        try {
                                            await setDoc(doc(db, '_superadmin', 'settings'), { enableAiChat: newVal }, { merge: true });
                                        } catch { }
                                    }}
                                    className={`w-11 h-6 rounded-full transition-colors relative ${enableAiChat ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enableAiChat ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Admin Passcode Info */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6">
                            <div className="flex items-center mb-3">
                                <div className={`p-2 rounded-lg mr-4 ${adminPasscode ? 'bg-green-500/20' : 'bg-white/10'}`}>
                                    <Lock size={20} className={adminPasscode ? 'text-green-400' : 'text-gray-400'} />
                                </div>
                                <div>
                                    <h3 className="text-md font-bold text-white">Admin Panel Passcode</h3>
                                    <p className="text-gray-400 text-xs mt-0.5">
                                        {adminPasscode ? 'The admin has set a passcode for their panel' : 'No passcode set by admin'}
                                    </p>
                                </div>
                            </div>
                            {adminPasscode ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                                        <span className="text-gray-400 text-sm">Passcode:</span>
                                        <span className="font-mono text-lg font-bold text-white tracking-widest">
                                            {showAdminPasscode ? adminPasscode : '••••••'}
                                        </span>
                                        <button
                                            onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            {showAdminPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await setDoc(doc(db, '_superadmin', 'settings'), { adminPasscode: '' }, { merge: true });
                                                setAdminPasscode('');
                                            } catch { }
                                        }}
                                        className="w-full py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-medium"
                                    >
                                        Reset Admin Passcode
                                    </button>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm bg-white/5 p-3 rounded-lg">
                                    The admin can set a passcode from their panel under Settings → Admin Passcode.
                                </p>
                            )}
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <p className="text-amber-200/70 text-xs">
                                <strong className="text-amber-300">Note:</strong> The password is stored in Firestore under <span className="font-mono text-amber-300">_superadmin/settings</span>.
                                The default password is <span className="font-mono text-amber-300">superadmin2026</span> until you change it.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SuperAdmin;
