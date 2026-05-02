import React, { useState, useEffect, useRef } from 'react';
import { Lock, Power, User, Save, Loader, CheckCircle, AlertCircle, Shield, LogOut, Database, Copy, RefreshCw, ExternalLink, Globe, Monitor, Clock, Plus, Settings, Trash2, Edit, Key, Eye, EyeOff, Mail, Phone, MessageSquare, CreditCard, X, Zap, HelpCircle, Sparkles, Image as ImageIcon } from 'lucide-react';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { compressImageToBase64 } from '../utils/imageUtils';
import { SUPERADMIN_DEFAULTS } from '../constants';

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

    // Copy toast state
    const [copyToast, setCopyToast] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Favicon preview state
    const [faviconPreview, setFaviconPreview] = useState('');

    const copyWithToast = (text: string) => {
        navigator.clipboard.writeText(text);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setCopyToast('');
        requestAnimationFrame(() => {
            setCopyToast(text);
            toastTimer.current = setTimeout(() => setCopyToast(''), 1500);
        });
    };

    // Active Tab State
    const [activeSection, setActiveSection] = useState<'subscription' | 'deployment' | 'settings' | 'renewals'>('subscription');

    // Renewal Pricing State
    const [price30, setPrice30] = useState(SUPERADMIN_DEFAULTS.pricing.price30);
    const [price60, setPrice60] = useState(SUPERADMIN_DEFAULTS.pricing.price60);
    const [price90, setPrice90] = useState(SUPERADMIN_DEFAULTS.pricing.price90);
    const [renewalPriceStatus, setRenewalPriceStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // SuperAdmin Payment Methods State
    const [gcashEnabled, setGcashEnabled] = useState(SUPERADMIN_DEFAULTS.paymentMethods.gcash.enabled);
    const [gcashName, setGcashName] = useState(SUPERADMIN_DEFAULTS.paymentMethods.gcash.accountName);
    const [gcashNumber, setGcashNumber] = useState(SUPERADMIN_DEFAULTS.paymentMethods.gcash.accountNumber);
    const [gcashQr, setGcashQr] = useState<string>(SUPERADMIN_DEFAULTS.paymentMethods.gcash.qrImage);

    const [bankEnabled, setBankEnabled] = useState(SUPERADMIN_DEFAULTS.paymentMethods.bankTransfer.enabled);
    const [bankName, setBankName] = useState(SUPERADMIN_DEFAULTS.paymentMethods.bankTransfer.bankName);
    const [bankAccountName, setBankAccountName] = useState(SUPERADMIN_DEFAULTS.paymentMethods.bankTransfer.accountName);
    const [bankAccountNumber, setBankAccountNumber] = useState(SUPERADMIN_DEFAULTS.paymentMethods.bankTransfer.accountNumber);

    const [pmStatus, setPmStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    // Renewal Requests State
    const [renewalRequests, setRenewalRequests] = useState<any[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectionRequestId, setRejectionRequestId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

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
    const [contactInfo, setContactInfo] = useState(SUPERADMIN_DEFAULTS.contactInfo);
    const [contactStatus, setContactStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // AI Chat toggle
    const [enableAiChat, setEnableAiChat] = useState(false);

    // Admin Eager Load toggle
    const [enableEagerLoad, setEnableEagerLoad] = useState(false);

    // Admin passcode (read-only in SuperAdmin)
    const [adminPasscode, setAdminPasscode] = useState('');
    const [showAdminPasscode, setShowAdminPasscode] = useState(false);
    const [showResetPasscodeConfirm, setShowResetPasscodeConfirm] = useState(false);

    // ImgBB Setup (Public Settings)
    const [imgbbApiKey, setImgbbApiKey] = useState('');
    const [imgbbStatus, setImgbbStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Infrastructure & Hosting state
    interface InfraField { key: string; value: string; show?: boolean; }
    const DEFAULT_INFRA = {
        firebase: '',
        cloudflare: '',
        github: '',
        imgbbAccount: '',
        imgbbApiKey: '',
        smtpEmail: '',
        smtpPassword: '',
        customFields: [] as InfraField[],
    };
    const [infra, setInfra] = useState(DEFAULT_INFRA);
    const [infraSaving, setInfraSaving] = useState(false);
    const [infraStatus, setInfraStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const [showSmtpPw, setShowSmtpPw] = useState(false);
    const [showImgbbPw, setShowImgbbPw] = useState(false);
    const [showInfraCustomPw, setShowInfraCustomPw] = useState<Record<number, boolean>>({});
    const [newCustomKey, setNewCustomKey] = useState('');
    const [newCustomValue, setNewCustomValue] = useState('');

    // Load infrastructure from Firestore when authenticated
    useEffect(() => {
        if (!isAuthenticated) return;
        const loadInfra = async () => {
            try {
                const snap = await getDoc(doc(db, '_superadmin', 'infrastructure'));
                if (snap.exists()) {
                    const d = snap.data();
                    setInfra({
                        firebase: d.firebase || '',
                        cloudflare: d.cloudflare || '',
                        github: d.github || '',
                        imgbbAccount: d.imgbbAccount || '',
                        imgbbApiKey: d.imgbbApiKey || '',
                        smtpEmail: d.smtpEmail || '',
                        smtpPassword: d.smtpPassword || '',
                        customFields: d.customFields || [],
                    });
                }
            } catch { }
        };
        loadInfra();
    }, [isAuthenticated]);

    const saveInfra = async () => {
        setInfraSaving(true);
        try {
            await setDoc(doc(db, '_superadmin', 'infrastructure'), infra, { merge: true });
            setInfraStatus('saved');
            setTimeout(() => setInfraStatus('idle'), 3000);
        } catch {
            setInfraStatus('error');
            setTimeout(() => setInfraStatus('idle'), 3000);
        }
        setInfraSaving(false);
    };

    const addCustomInfraField = () => {
        if (!newCustomKey.trim()) return;
        setInfra(prev => ({
            ...prev,
            customFields: [...prev.customFields, { key: newCustomKey.trim(), value: newCustomValue.trim() }],
        }));
        setNewCustomKey('');
        setNewCustomValue('');
    };

    const removeCustomInfraField = (index: number) => {
        setInfra(prev => ({
            ...prev,
            customFields: prev.customFields.filter((_, i) => i !== index),
        }));
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadSubscription();
            loadRenewalRequests(); // Pre-load so badge count shows immediately
        }
    }, [isAuthenticated]);

    // Load password from Firestore on mount
    useEffect(() => {
        const loadPassword = async () => {
            try {
                const snap = await getDoc(doc(db, '_superadmin', 'settings'));
                if (snap.exists()) {
                    if (snap.data().password) {
                        const dbPassword = snap.data().password;
                        setStoredPassword(dbPassword);
                        
                        // Check local storage for auto-login
                        const savedPassword = window.localStorage.getItem('staycation_superadmin_pw');
                        if (savedPassword === dbPassword) {
                            setIsAuthenticated(true);
                        }
                    }
                    if (snap.data().contactInfo) setContactInfo(snap.data().contactInfo);
                    if (typeof snap.data().enableAiChat === 'boolean') setEnableAiChat(snap.data().enableAiChat);
                    if (typeof snap.data().eagerLoadAdmin === 'boolean') setEnableEagerLoad(snap.data().eagerLoadAdmin);
                    if (snap.data().adminPasscode) setAdminPasscode(snap.data().adminPasscode);
                }
            } catch { }
            
            try {
                const publicSnap = await getDoc(doc(db, 'settings', 'general'));
                if (publicSnap.exists() && publicSnap.data().imgbb) {
                    setImgbbApiKey(publicSnap.data().imgbb.apiKey || '');
                }
            } catch { }
        };
        loadPassword();
    }, []);

    // Load renewal pricing from Firestore
    useEffect(() => {
        const loadPricing = async () => {
            try {
                const snap = await getDoc(doc(db, '_superadmin', 'settings'));
                if (snap.exists()) {
                    const d = snap.data();
                    if (d.price30) setPrice30(d.price30);
                    else if (d.renewalPrice) setPrice30(d.renewalPrice); // Backward compatibility
                    
                    if (d.price60) setPrice60(d.price60);
                    else if (d.renewalPrice) setPrice60(d.renewalPrice * 2);

                    if (d.price90) setPrice90(d.price90);
                    else if (d.renewalPrice) setPrice90(d.renewalPrice * 3);
                    if (d.paymentMethods) {
                        if (d.paymentMethods.gcash) {
                            setGcashEnabled(d.paymentMethods.gcash.enabled || false);
                            setGcashName(d.paymentMethods.gcash.accountName || '');
                            setGcashNumber(d.paymentMethods.gcash.accountNumber || '');
                            setGcashQr(d.paymentMethods.gcash.qrImage || '');
                        }
                        if (d.paymentMethods.bankTransfer) {
                            setBankEnabled(d.paymentMethods.bankTransfer.enabled || false);
                            setBankName(d.paymentMethods.bankTransfer.bankName || '');
                            setBankAccountName(d.paymentMethods.bankTransfer.accountName || '');
                            setBankAccountNumber(d.paymentMethods.bankTransfer.accountNumber || '');
                        }
                    }
                }
            } catch { }
        };
        loadPricing();
    }, []);

    // Load pending renewal requests
    const loadRenewalRequests = async () => {
        setRequestsLoading(true);
        try {
            const snap = await getDocs(collection(db, '_superadmin', 'renewals', 'requests'));
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort by submittedAt descending
            items.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
            setRenewalRequests(items);
        } catch { }
        setRequestsLoading(false);
    };

    const handleApproveRenewal = async (request: any) => {
        setProcessingId(request.id);
        try {
            // Extend expiresAt
            const subSnap = await getDoc(doc(db, '_superadmin', 'subscription'));
            const currentExpiry = subSnap.exists() && subSnap.data().expiresAt
                ? new Date(subSnap.data().expiresAt)
                : new Date();
            const base = currentExpiry > new Date() ? currentExpiry : new Date();
            const newExpiry = new Date(base);
            newExpiry.setDate(newExpiry.getDate() + (request.daysRequested || 30));
            await updateDoc(doc(db, '_superadmin', 'subscription'), {
                expiresAt: newExpiry.toISOString().split('T')[0],
                lastModified: new Date().toISOString()
            });
            // Mark request as approved
            await updateDoc(doc(db, '_superadmin', 'renewals', 'requests', request.id), {
                status: 'approved',
                approvedAt: new Date().toISOString()
            });
            await loadRenewalRequests();
        } catch (e: any) {
            alert('Error approving: ' + e.message);
        }
        setProcessingId(null);
    };

    const handleRejectRenewal = async (requestId: string, reason: string) => {
        setProcessingId(requestId);
        try {
            await updateDoc(doc(db, '_superadmin', 'renewals', 'requests', requestId), {
                status: 'rejected',
                rejectedAt: new Date().toISOString(),
                rejectionReason: reason
            });
            setRejectionRequestId(null);
            setRejectionReason('');
            await loadRenewalRequests();
        } catch (e: any) {
            alert('Error rejecting: ' + e.message);
        }
        setProcessingId(null);
    };
    
    // Deployment Helpers
    const copyAllEnv = () => {
        const keys = [
            'VITE_FIREBASE_API_KEY',
            'VITE_FIREBASE_AUTH_DOMAIN',
            'VITE_FIREBASE_PROJECT_ID',
            'VITE_FIREBASE_STORAGE_BUCKET',
            'VITE_FIREBASE_MESSAGING_SENDER_ID',
            'VITE_FIREBASE_APP_ID',
            'VITE_GEMINI_API_KEY',
            'VITE_FAVICON_URL',
            'VITE_OG_URL',
            'VITE_OG_TITLE',
            'VITE_OG_DESCRIPTION',
            'VITE_OG_IMAGE',
            'VITE_IMGBB_API_KEY',
            'SMTP_EMAIL',
            'SMTP_PASSWORD'
        ];
        const text = keys.map(k => `${k}=`).join('\n');
        navigator.clipboard.writeText(text);
        
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setCopyToast('');
        requestAnimationFrame(() => {
            setCopyToast('All 15 Keys');
            toastTimer.current = setTimeout(() => setCopyToast(''), 2000);
        });
    };

    const copyAiPrompt = () => {
        const keys = [
            'VITE_FIREBASE_API_KEY',
            'VITE_FIREBASE_AUTH_DOMAIN',
            'VITE_FIREBASE_PROJECT_ID',
            'VITE_FIREBASE_STORAGE_BUCKET',
            'VITE_FIREBASE_MESSAGING_SENDER_ID',
            'VITE_FIREBASE_APP_ID',
            'VITE_GEMINI_API_KEY',
            'VITE_FAVICON_URL',
            'VITE_OG_URL',
            'VITE_OG_TITLE',
            'VITE_OG_DESCRIPTION',
            'VITE_OG_IMAGE',
            'VITE_IMGBB_API_KEY',
            'SMTP_EMAIL',
            'SMTP_PASSWORD'
        ];
        const prompt = `I'm deploying my React Staycation website. I have a list of environment variable keys and I need you to help me format them properly for a .env file. 

I will provide you with the raw configuration values (like the Firebase config object or Gmail SMTP details). Please match the values to these exact keys and provide me with a clean, bulk-pasteable .env content.

Here are the keys I need you to fill:
${keys.map(k => `${k}=`).join('\n')}

Please output only the filled .env content without any extra explanation so I can copy-paste it directly into Vercel/Netlify.`;
        
        navigator.clipboard.writeText(prompt);
        
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setCopyToast('');
        requestAnimationFrame(() => {
            setCopyToast('AI Prompt');
            toastTimer.current = setTimeout(() => setCopyToast(''), 2000);
        });
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === storedPassword) {
            setIsAuthenticated(true);
            window.localStorage.setItem('staycation_superadmin_pw', password);
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 p-4 pb-24 md:p-8 md:pb-8">
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
                        onClick={() => { setIsAuthenticated(false); setPassword(''); window.localStorage.removeItem('staycation_superadmin_pw'); }}
                        className="flex items-center px-3 py-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
                    >
                        <LogOut size={16} className="mr-1" /> Logout
                    </button>
                </div>

                {/* Tab Switcher (Desktop Only) */}
                <div className="hidden md:flex flex-row mb-6 bg-white/5 rounded-xl p-1 border border-white/10 gap-1">
                    <button
                        onClick={() => setActiveSection('subscription')}
                        className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${activeSection === 'subscription' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Power size={16} className="mr-1.5 sm:mr-2" /> Subscription
                    </button>
                    <button
                        onClick={() => { setActiveSection('renewals'); loadRenewalRequests(); }}
                        className={`flex-1 relative flex items-center justify-center py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${activeSection === 'renewals' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <RefreshCw size={16} className="mr-1.5 sm:mr-2" /> Renewals
                        {renewalRequests.filter((r: any) => r.status === 'pending').length > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                                {renewalRequests.filter((r: any) => r.status === 'pending').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveSection('deployment')}
                        className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${activeSection === 'deployment' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Globe size={16} className="mr-1.5 sm:mr-2" /> Deploy
                    </button>
                    <button
                        onClick={() => setActiveSection('settings')}
                        className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${activeSection === 'settings' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Settings size={16} className="mr-1.5 sm:mr-2" /> Settings
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
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
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
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

                {/* ===== RENEWALS TAB ===== */}
                {activeSection === 'renewals' && (
                    <div className="space-y-4">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <h3 className="font-bold text-amber-400 text-sm flex items-center mb-1">
                                <RefreshCw size={15} className="mr-2" /> Pending Renewal Requests
                            </h3>
                            <p className="text-amber-200/70 text-xs">Clients who submitted payment proof. Verify the screenshot then click Approve to extend their subscription.</p>
                        </div>

                        {requestsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader className="animate-spin text-amber-400" size={28} />
                            </div>
                        ) : renewalRequests.length === 0 ? (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                                <CheckCircle size={32} className="mx-auto text-gray-600 mb-3" />
                                <p className="text-gray-400 text-sm">No renewal requests yet.</p>
                                <p className="text-gray-600 text-xs mt-1">When a client submits payment proof, it will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {renewalRequests.map((req: any) => (
                                    <div key={req.id} className={`bg-white/5 border rounded-2xl p-5 ${req.status === 'pending' ? 'border-amber-500/30' :
                                            req.status === 'approved' ? 'border-green-500/20' :
                                                'border-red-500/20'
                                        }`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-bold text-white text-sm">{req.clientName || 'Client'}</p>
                                                <p className="text-gray-400 text-xs mt-0.5">
                                                    {new Date(req.submittedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${req.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                                                        req.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                                                            'bg-red-500/20 text-red-300'
                                                    }`}>
                                                    {req.status === 'pending' ? '⏳ Pending' : req.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                                                </span>
                                                {req.status !== 'pending' && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setDeleteConfirmId(req.id)}
                                                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors border border-white/10 hover:border-red-500/30"
                                                            title="Delete permanently"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                        {req.status === 'rejected' && (
                                                            <button
                                                                onClick={() => {
                                                                    setRejectionRequestId(req.id);
                                                                    setRejectionReason(req.rejectionReason || '');
                                                                }}
                                                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 flex items-center justify-center transition-colors border border-white/10 hover:border-amber-500/30"
                                                                title="Edit reason"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                                            <div className="bg-white/5 rounded-lg p-2">
                                                <p className="text-gray-400 text-[10px] uppercase">Plan</p>
                                                <p className="text-white text-xs font-bold capitalize">{req.plan || 'Monthly'}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-2">
                                                <p className="text-gray-400 text-[10px] uppercase">Days</p>
                                                <p className="text-white text-xs font-bold">+{req.daysRequested || 30}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-2">
                                                <p className="text-gray-400 text-[10px] uppercase">Amount</p>
                                                <p className="text-amber-400 text-xs font-bold">₱{req.amount || 99}</p>
                                            </div>
                                        </div>

                                        {/* Payment Proof */}
                                        {req.paymentProofUrl && (
                                            <button
                                                onClick={() => setZoomedImage(req.paymentProofUrl)}
                                                className="block mb-3 w-full text-left"
                                            >
                                                <img
                                                    src={req.paymentProofUrl}
                                                    alt="Payment Proof"
                                                    className="w-full max-h-48 object-contain rounded-xl border border-white/10 hover:border-amber-500/40 transition-colors cursor-zoom-in bg-black/20"
                                                />
                                                <p className="text-center text-xs text-gray-500 mt-1">Tap to view full screenshot</p>
                                            </button>
                                        )}

                                        {/* Rejection Reason Display */}
                                        {req.status === 'rejected' && req.rejectionReason && (
                                            <div className="mb-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl relative group">
                                                <p className="text-[10px] uppercase font-bold text-red-400/60 mb-1 flex items-center gap-1">
                                                    <MessageSquare size={10} /> Rejection Reason
                                                </p>
                                                <p className="text-xs text-red-200/80 italic leading-relaxed pr-8">
                                                    "{req.rejectionReason}"
                                                </p>
                                                <button 
                                                    onClick={() => {
                                                        setRejectionRequestId(req.id);
                                                        setRejectionReason(req.rejectionReason);
                                                    }}
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-400 hover:bg-red-500/20 rounded"
                                                    title="Edit reason"
                                                >
                                                    <Edit size={12} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {req.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApproveRenewal(req)}
                                                    disabled={processingId === req.id}
                                                    className="flex-1 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-bold rounded-xl transition-colors border border-green-500/30 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                                                >
                                                    {processingId === req.id ? <Loader size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                    Approve & Extend
                                                </button>
                                                <button
                                                    onClick={() => setRejectionRequestId(req.id)}
                                                    disabled={processingId === req.id}
                                                    className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-colors border border-red-500/30 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                                                >
                                                    <AlertCircle size={14} /> Reject
                                                </button>
                                            </div>
                                        )}
                                        {req.status === 'approved' && req.approvedAt && (
                                            <p className="text-green-400/70 text-xs text-center">Approved on {new Date(req.approvedAt).toLocaleDateString()}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={loadRenewalRequests}
                            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors border border-white/10 text-sm flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>

                        {/* Rejection Reason Modal */}
                        {rejectionRequestId && (
                            <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                                <div className="bg-gray-800 border border-red-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                                    <div className="flex items-center gap-3 mb-4 text-red-400">
                                        <AlertCircle size={24} />
                                        <h4 className="font-bold text-lg">{renewalRequests.find(r => r.id === rejectionRequestId)?.status === 'rejected' ? 'Update Rejection Reason' : 'Reason for Rejection'}</h4>
                                    </div>
                                    <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                                        Tell the client why their request was rejected. This will help them fix the issue and try again.
                                    </p>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="e.g. Blurred receipt, Incorrect amount, Mismatched name..."
                                        className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-600 mb-4 resize-none"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => {setRejectionRequestId(null); setRejectionReason('');}}
                                            className="flex-1 py-2.5 text-gray-400 hover:text-white font-bold rounded-xl transition-colors bg-white/5 hover:bg-white/10 text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={() => handleRejectRenewal(rejectionRequestId, rejectionReason)}
                                            disabled={!rejectionReason.trim() || processingId === rejectionRequestId}
                                            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20 text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                                        >
                                            {processingId === rejectionRequestId ? <Loader size={12} className="animate-spin" /> : <><AlertCircle size={14} /> Confirm Rejection</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== DEPLOYMENT CHEATSHEET TAB ===== */}
                {activeSection === 'deployment' && (
                    <div className="space-y-6">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 mb-2">
                            <h3 className="font-bold text-amber-400 text-lg mb-2 flex items-center">
                                <Globe className="mr-2" size={20} /> Launch Checklist
                            </h3>
                            <p className="text-amber-200/80 text-sm">
                                To deploy a new client's code branch to Vercel or Netlify, you must configure the following exact Environment Variables in their dashboard before hitting Deploy.
                            </p>
                        </div>

                        {/* One-Click Deployment Helpers */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-2">
                            <button 
                                onClick={copyAllEnv}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all active:scale-95 text-blue-400 text-sm font-bold"
                            >
                                <Copy size={16} /> Copy .env Template
                            </button>
                            <button 
                                onClick={copyAiPrompt}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl transition-all active:scale-95 text-purple-400 text-sm font-bold"
                            >
                                <Sparkles size={16} /> Copy AI Prompt
                            </button>
                        </div>

                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 sm:p-6">
                            <h4 className="text-md font-bold text-white mb-4 flex items-center">
                                <Database size={18} className="mr-2 text-blue-400" /> Firebase Database Keys (6)
                            </h4>
                            <p className="text-gray-400 text-xs mb-4">
                                Found in <span className="text-white">console.firebase.google.com &rarr; Project Settings &rarr; Your Apps</span>. Never put these in the codebase!
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { key: 'VITE_FIREBASE_API_KEY', desc: 'The apiKey from your Firebase JS snippet' },
                                    { key: 'VITE_FIREBASE_AUTH_DOMAIN', desc: 'The authDomain from your Firebase JS snippet' },
                                    { key: 'VITE_FIREBASE_PROJECT_ID', desc: 'The projectId from your Firebase JS snippet' },
                                    { key: 'VITE_FIREBASE_STORAGE_BUCKET', desc: 'The storageBucket from your Firebase JS snippet' },
                                    { key: 'VITE_FIREBASE_MESSAGING_SENDER_ID', desc: 'The messagingSenderId from your Firebase JS snippet' },
                                    { key: 'VITE_FIREBASE_APP_ID', desc: 'The appId from your Firebase JS snippet' }
                                ].map(({ key, desc }, index) => (
                                    <div key={key} className="bg-white/10 border border-white/20 rounded-lg p-3 flex flex-col md:flex-row md:justify-between md:items-center group gap-3">
                                        <div className="flex items-center w-full md:w-auto overflow-hidden">
                                            <span className="text-blue-500/50 font-bold mr-2 text-xs">{index + 1}.</span>
                                            <span className="font-mono text-xs text-blue-300 truncate mr-2">{key}</span>
                                            <button onClick={() => copyWithToast(key)} className="text-gray-400 hover:text-white transition-colors flex-shrink-0" title="Copy">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                        <span className="text-xs text-gray-400 md:text-right md:max-w-[55%] leading-relaxed">{desc}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <p className="text-blue-300 font-bold text-xs flex items-center mb-3">
                                    <ExternalLink size={14} className="mr-1.5" /> Firebase SDK Mapping Example:
                                </p>
                                <div className="font-mono text-[10px] sm:text-xs text-blue-200/80 space-y-1.5 p-4 bg-black/40 rounded-lg overflow-x-auto shadow-inner">
                                    <p><span className="text-pink-400">const</span> <span className="text-purple-300">firebaseConfig</span> <span className="text-gray-400">= {"{"}</span></p>
                                    <p className="pl-4"><span className="text-blue-300">apiKey:</span> <span className="text-green-400">"AIzaSy..."</span> <span className="text-gray-500 ml-3">&rarr; VITE_FIREBASE_API_KEY</span></p>
                                    <p className="pl-4"><span className="text-blue-300">authDomain:</span> <span className="text-green-400">"app.firebaseapp.com"</span> <span className="text-gray-500 ml-3">&rarr; VITE_FIREBASE_AUTH_DOMAIN</span></p>
                                    <p className="pl-4"><span className="text-blue-300">projectId:</span> <span className="text-green-400">"app-123"</span> <span className="text-gray-500 ml-3">&rarr; VITE_FIREBASE_PROJECT_ID</span></p>
                                    <p className="pl-4"><span className="text-blue-300">storageBucket:</span> <span className="text-green-400">"app.appspot.com"</span> <span className="text-gray-500 ml-3">&rarr; ..._STORAGE_BUCKET</span></p>
                                    <p className="pl-4"><span className="text-blue-300">messagingSenderId:</span> <span className="text-green-400">"849..."</span> <span className="text-gray-500 ml-3">&rarr; ..._MESSAGING_SENDER_ID</span></p>
                                    <p className="pl-4"><span className="text-blue-300">appId:</span> <span className="text-green-400">"1:849:web:..."</span> <span className="text-gray-500 ml-3">&rarr; VITE_FIREBASE_APP_ID</span></p>
                                    <p><span className="text-gray-400">{"}"};</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 sm:p-6">
                            <h4 className="text-md font-bold text-white mb-4 flex items-center">
                                <ExternalLink size={18} className="mr-2 text-purple-400" /> Branding & SEO Meta Tags (5)
                            </h4>
                            <p className="text-gray-400 text-xs mb-4">
                                Controls the browser tab icon, title, and social media previews, preventing Git branch merge conflicts.
                            </p>
                            <div className="space-y-3">
                                {[
                                    { key: 'VITE_FAVICON_URL', desc: 'The small logo icon shown on the browser tab (e.g. /favicon.ico or a direct image URL)' },
                                    { key: 'VITE_OG_URL', desc: 'The live website link the user goes to when they click the preview (e.g. https://client-hotel.com)' },
                                    { key: 'VITE_OG_TITLE', desc: 'The large, bold headline text shown in the preview card (e.g. Hotel Sunshine Resort)' },
                                    { key: 'VITE_OG_DESCRIPTION', desc: 'The smaller subtitle text shown under the title in the preview card' },
                                    { key: 'VITE_OG_IMAGE', desc: 'The large picture shown in Messenger/Facebook. Must be a direct URL ending in .jpg or .png' },
                                ].map(({ key, desc }, index) => (
                                    <div key={key} className="bg-white/10 border border-white/20 rounded-lg p-3 flex flex-col md:flex-row md:justify-between md:items-center group gap-3">
                                        <div className="flex items-center w-full md:w-auto overflow-hidden">
                                            <span className="text-purple-500/50 font-bold mr-2 text-xs">{index + 1 + 6}.</span>
                                            <span className="font-mono text-xs text-purple-300 truncate mr-2">{key}</span>
                                            <button onClick={() => copyWithToast(key)} className="text-gray-400 hover:text-white transition-colors flex-shrink-0" title="Copy">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                        <span className="text-xs text-gray-400 md:text-right md:max-w-[55%] leading-relaxed">{desc}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Favicon Preview Widget */}
                            <div className="mt-5 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                <p className="text-purple-300 font-bold text-xs flex items-center mb-3">
                                    <Monitor size={14} className="mr-1.5" /> Favicon Preview — Test Before You Deploy
                                </p>
                                <p className="text-gray-500 text-[10px] mb-3">
                                    Paste your favicon image URL below to see how it will look on the browser tab. The icon must be square (1:1 ratio) for best results.
                                </p>
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={faviconPreview}
                                        onChange={(e) => setFaviconPreview(e.target.value)}
                                        placeholder="Paste favicon URL here…"
                                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    {faviconPreview && (
                                        <button onClick={() => setFaviconPreview('')} className="text-gray-400 hover:text-white text-xs">
                                            Clear
                                        </button>
                                    )}
                                </div>
                                {/* Mock Browser Tab */}
                                <div className="bg-gray-800 rounded-t-xl p-2 border border-white/10">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"></div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="bg-gray-700 rounded-t-lg px-3 py-1.5 flex items-center gap-2 border border-white/10 border-b-0 max-w-[200px]">
                                            {faviconPreview ? (
                                                <img
                                                    src={faviconPreview}
                                                    alt="favicon"
                                                    className="w-4 h-4 rounded-sm object-contain flex-shrink-0"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div className="w-4 h-4 rounded-sm bg-gray-600 flex-shrink-0"></div>
                                            )}
                                            <span className="text-gray-300 text-[11px] truncate">
                                                {faviconPreview ? 'Client Hotel' : 'No favicon set'}
                                            </span>
                                        </div>
                                        <div className="bg-gray-800 rounded-t-lg px-2 py-1.5 ml-1 border border-white/5 border-b-0">
                                            <span className="text-gray-500 text-[10px]">+</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-900 rounded-b-lg p-3 border border-white/10 border-t-0">
                                    <div className="flex items-center bg-gray-800 rounded-full px-3 py-1.5">
                                        <Lock size={10} className="text-gray-500 mr-2" />
                                        <span className="text-gray-500 text-[10px]">https://client-hotel.com</span>
                                    </div>
                                </div>
                                {faviconPreview && (
                                    <p className="text-green-400/70 text-[10px] mt-2 flex items-center">
                                        <CheckCircle size={10} className="mr-1" /> Looking good? Copy the URL above and paste it as your VITE_FAVICON_URL on Vercel.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 sm:p-6 mt-6">
                            <h4 className="text-md font-bold text-white mb-4 flex items-center">
                                <ImageIcon size={18} className="mr-2 text-green-400" /> Image Hosting Config (1)
                            </h4>
                            <p className="text-gray-400 text-xs mb-4">
                                Required for the Website Builder's image uploading to work via ImgBB.
                            </p>
                            <div className="space-y-3">
                                {[
                                    { key: 'VITE_IMGBB_API_KEY', desc: (
                                        <span>
                                            The API key from{' '}
                                            <a href="https://api.imgbb.com" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline font-bold">
                                                api.imgbb.com
                                            </a>
                                            . Used to upload images directly from the builder.
                                        </span>
                                    ) },
                                ].map(({ key, desc }, index) => (
                                    <div key={key} className="bg-white/10 border border-white/20 rounded-lg p-3 flex flex-col md:flex-row md:justify-between md:items-center group gap-3">
                                        <div className="flex items-center w-full md:w-auto overflow-hidden">
                                            <span className="text-green-500/50 font-bold mr-2 text-xs">{index + 12}.</span>
                                            <span className="font-mono text-xs text-green-300 truncate mr-2">{key}</span>
                                            <button onClick={() => copyWithToast(key)} className="text-gray-400 hover:text-white transition-colors flex-shrink-0" title="Copy">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                        <span className="text-xs text-gray-400 md:text-right md:max-w-[55%] leading-relaxed">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 sm:p-6 mt-6">
                            <h4 className="text-md font-bold text-white mb-4 flex items-center">
                                <Mail size={18} className="mr-2 text-red-400" /> Email System Config (2)
                            </h4>
                            <p className="text-gray-400 text-xs mb-4">
                                Required by Vercel / Netlify backend servers to send automated booking emails via Gmail.
                            </p>
                            <div className="space-y-3">
                                {[
                                    { key: 'SMTP_EMAIL', desc: 'The exact Gmail address sending the automated emails (Example: visionarywebco@gmail.com)' },
                                    { key: 'SMTP_PASSWORD', desc: (
                                        <span>
                                            The 16-character Google App Password (Example: kqrzoggmmufzxlpk). You must generate this from your{' '}
                                            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline font-bold">
                                                Google Account Security page
                                            </a>.
                                        </span>
                                    ) },
                                ].map(({ key, desc }, index) => (
                                    <div key={key} className="bg-white/10 border border-white/20 rounded-lg p-3 flex flex-col md:flex-row md:justify-between md:items-center group gap-3">
                                        <div className="flex items-center w-full md:w-auto overflow-hidden">
                                            <span className="text-red-500/50 font-bold mr-2 text-xs">{index + 13}.</span>
                                            <span className="font-mono text-xs text-red-300 truncate mr-2">{key}</span>
                                            <button onClick={() => copyWithToast(key)} className="text-gray-400 hover:text-white transition-colors flex-shrink-0" title="Copy">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                        <span className="text-xs text-gray-400 md:text-right md:max-w-[55%] leading-relaxed">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ===== INFRASTRUCTURE & HOSTING PANEL ===== */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 sm:p-6 mt-6">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="text-md font-bold text-white flex items-center">
                                    <Database size={18} className="mr-2 text-cyan-400" /> Infrastructure & Hosting
                                </h4>
                                {infraStatus === 'saved' && (
                                    <span className="text-xs text-green-400 flex items-center"><CheckCircle size={12} className="mr-1" />Saved!</span>
                                )}
                                {infraStatus === 'error' && (
                                    <span className="text-xs text-red-400 flex items-center"><AlertCircle size={12} className="mr-1" />Error saving</span>
                                )}
                            </div>
                            <p className="text-gray-500 text-xs mb-5">Store this client's deployment credentials here for your own reference. Only you can see this.</p>

                            <div className="space-y-4">
                                {/* Firebase */}
                                <div>
                                    <label className="block text-xs font-semibold text-cyan-300 mb-1 flex items-center gap-1">
                                        <Database size={13} /> Firebase Account Used
                                    </label>
                                    <input
                                        type="text"
                                        value={infra.firebase}
                                        onChange={(e) => setInfra(p => ({ ...p, firebase: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-mono"
                                        placeholder="e.g. my-project-12345"
                                    />
                                </div>

                                {/* Cloudflare */}
                                <div>
                                    <label className="block text-xs font-semibold text-orange-300 mb-1 flex items-center gap-1">
                                        <Globe size={13} /> Cloudflare Account / URL
                                    </label>
                                    <input
                                        type="text"
                                        value={infra.cloudflare}
                                        onChange={(e) => setInfra(p => ({ ...p, cloudflare: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
                                        placeholder="e.g. https://my-project.pages.dev or Zone ID"
                                    />
                                </div>

                                {/* GitHub */}
                                <div>
                                    <label className="block text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1">
                                        <ExternalLink size={13} /> GitHub Repo Link
                                    </label>
                                    <input
                                        type="text"
                                        value={infra.github}
                                        onChange={(e) => setInfra(p => ({ ...p, github: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                                        placeholder="e.g. https://github.com/you/client-repo"
                                    />
                                </div>

                                {/* ImgBB Account & API */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-emerald-300 mb-1 flex items-center gap-1">
                                            <ImageIcon size={13} /> ImgBB Account Used
                                        </label>
                                        <input
                                            type="text"
                                            value={infra.imgbbAccount}
                                            onChange={(e) => setInfra(p => ({ ...p, imgbbAccount: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                                            placeholder="e.g. imgbb_user@gmail.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-emerald-300 mb-1 flex items-center gap-1">
                                            <Key size={13} /> ImgBB API Key
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showImgbbPw ? 'text' : 'password'}
                                                value={infra.imgbbApiKey}
                                                onChange={(e) => setInfra(p => ({ ...p, imgbbApiKey: e.target.value }))}
                                                className="w-full px-3 py-2 pr-9 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                                                placeholder="API Key"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowImgbbPw(v => !v)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                            >
                                                {showImgbbPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* SMTP Email */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-red-300 mb-1 flex items-center gap-1">
                                            <Mail size={13} /> Sending Email Account
                                        </label>
                                        <input
                                            type="text"
                                            value={infra.smtpEmail}
                                            onChange={(e) => setInfra(p => ({ ...p, smtpEmail: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-mono"
                                            placeholder="e.g. visionarywebco@gmail.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-red-300 mb-1 flex items-center gap-1">
                                            <Key size={13} /> App Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showSmtpPw ? 'text' : 'password'}
                                                value={infra.smtpPassword}
                                                onChange={(e) => setInfra(p => ({ ...p, smtpPassword: e.target.value }))}
                                                className="w-full px-3 py-2 pr-9 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-mono"
                                                placeholder="App password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSmtpPw(v => !v)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                            >
                                                {showSmtpPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Fields */}
                                {infra.customFields.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-white/10">
                                        <p className="text-xs font-semibold text-gray-400 mb-2">Custom Fields</p>
                                        {infra.customFields.map((field, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2 py-1.5 rounded-lg border border-amber-500/20 min-w-[100px] truncate">{field.key}</span>
                                                <div className="relative flex-1">
                                                    <input
                                                        type={showInfraCustomPw[idx] ? 'text' : 'password'}
                                                        value={field.value}
                                                        onChange={(e) => {
                                                            const updated = [...infra.customFields];
                                                            updated[idx] = { ...updated[idx], value: e.target.value };
                                                            setInfra(p => ({ ...p, customFields: updated }));
                                                        }}
                                                        className="w-full px-3 py-1.5 pr-9 bg-white/10 border border-white/20 rounded-lg text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowInfraCustomPw(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                                    >
                                                        {showInfraCustomPw[idx] ? <EyeOff size={13} /> : <Eye size={13} />}
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeCustomInfraField(idx)}
                                                    className="p-1.5 text-gray-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors border border-white/10 flex-shrink-0"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add Custom Field Row */}
                                <div className="pt-2 border-t border-white/10">
                                    <p className="text-xs text-gray-500 mb-2">Add a custom field (e.g. Domain, API key, notes…)</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCustomKey}
                                            onChange={(e) => setNewCustomKey(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-mono"
                                            placeholder="Field name (e.g. Domain)"
                                            onKeyDown={(e) => { if (e.key === 'Enter') addCustomInfraField(); }}
                                        />
                                        <input
                                            type="text"
                                            value={newCustomValue}
                                            onChange={(e) => setNewCustomValue(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-mono"
                                            placeholder="Value"
                                            onKeyDown={(e) => { if (e.key === 'Enter') addCustomInfraField(); }}
                                        />
                                        <button
                                            onClick={addCustomInfraField}
                                            disabled={!newCustomKey.trim()}
                                            className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold rounded-xl transition-colors border border-amber-500/30 text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            <Plus size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={saveInfra}
                                    disabled={infraSaving}
                                    className="w-full py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold rounded-xl transition-colors border border-cyan-500/30 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                                >
                                    {infraSaving ? <><Loader size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Infrastructure Info</>}
                                </button>
                            </div>
                        </div>
                    </div>
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
                                            copyWithToast(newVal ? 'AI Chat enabled!' : 'AI Chat disabled!');
                                        } catch { }
                                    }}
                                    className={`w-11 h-6 rounded-full transition-colors relative ${enableAiChat ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enableAiChat ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Eager Load Toggle */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className={`p-2 rounded-lg mr-4 ${enableEagerLoad ? 'bg-amber-500/20' : 'bg-white/10'}`}>
                                        <Zap size={20} className={enableEagerLoad ? 'text-amber-400' : 'text-gray-400'} />
                                    </div>
                                    <div>
                                        <div className="flex items-center">
                                            <h3 className="text-md font-bold text-white mr-2">Fast Admin Panel</h3>
                                            <div className="group relative z-10 flex items-center justify-center">
                                                <HelpCircle size={14} className="text-gray-400 cursor-help hover:text-white transition-colors" />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 border border-white/10 rounded-xl text-xs text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none shadow-xl">
                                                    Speeds up the admin panel by secretly downloading heavy required assets in the background immediately after a guest hits your website.
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-gray-400 text-xs mt-0.5">Eliminates loading delay when clicking "Admin Login".</p>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        const newVal = !enableEagerLoad;
                                        setEnableEagerLoad(newVal);
                                        try {
                                            await setDoc(doc(db, '_superadmin', 'settings'), { eagerLoadAdmin: newVal }, { merge: true });
                                            copyWithToast(newVal ? 'Fast Admin Panel enabled!' : 'Fast Admin Panel disabled!');
                                        } catch { }
                                    }}
                                    className={`w-11 h-6 rounded-full transition-colors relative ${enableEagerLoad ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enableEagerLoad ? 'translate-x-5' : 'translate-x-0.5'}`} />
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
                                        onClick={() => setShowResetPasscodeConfirm(true)}
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

                        {/* Renewal Pricing */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6">
                            <h3 className="text-md font-bold text-white mb-4 flex items-center">
                                <RefreshCw size={18} className="mr-2 text-amber-400" />
                                Renewal Pricing
                            </h3>
                            <p className="text-gray-400 text-xs mb-4">This price and duration is shown to clients when they renew their own subscription.</p>
                            <div className="grid grid-cols-1 gap-3 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">30-Day Plan Price (₱)</label>
                                    <input
                                        type="number"
                                        value={price30}
                                        onChange={(e) => setPrice30(Number(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                        placeholder="99"
                                        min={1}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">60-Day Plan (₱)</label>
                                        <input
                                            type="number"
                                            value={price60}
                                            onChange={(e) => setPrice60(Number(e.target.value))}
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                            placeholder="190"
                                            min={1}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">90-Day Plan (₱)</label>
                                        <input
                                            type="number"
                                            value={price90}
                                            onChange={(e) => setPrice90(Number(e.target.value))}
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                            placeholder="270"
                                            min={1}
                                        />
                                    </div>
                                </div>
                            </div>
                            {renewalPriceStatus === 'saved' && (
                                <p className="text-green-400 text-xs mb-3 flex items-center gap-1"><CheckCircle size={12} /> Pricing saved!</p>
                            )}
                            <button
                                onClick={async () => {
                                    setRenewalPriceStatus('saving');
                                    try {
                                        await setDoc(doc(db, '_superadmin', 'settings'), { price30, price60, price90 }, { merge: true });
                                        setRenewalPriceStatus('saved');
                                        setTimeout(() => setRenewalPriceStatus('idle'), 3000);
                                    } catch { }
                                }}
                                disabled={renewalPriceStatus === 'saving'}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                            >
                                {renewalPriceStatus === 'saving' ? <><Loader size={16} className="mr-2 animate-spin" /> Saving...</> : <><Save size={16} className="mr-2" /> Save Pricing</>}
                            </button>
                        </div>

                        {/* ImgBB Integration */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6">
                            <h3 className="text-md font-bold text-white mb-4 flex items-center">
                                <Monitor size={18} className="mr-2 text-amber-400" />
                                ImgBB Integration
                            </h3>
                            <p className="text-gray-400 text-xs mb-4">
                                Configure your ImgBB API key to handle image uploads across the platform.
                            </p>
                            <div className="space-y-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
                                    <input
                                        type="text"
                                        value={imgbbApiKey}
                                        onChange={(e) => setImgbbApiKey(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
                                        placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
                                    />
                                </div>
                            </div>
                            {imgbbStatus === 'saved' && (
                                <p className="text-green-400 text-xs mb-3 flex items-center gap-1"><CheckCircle size={12} /> ImgBB settings saved!</p>
                            )}
                            <button
                                onClick={async () => {
                                    setImgbbStatus('saving');
                                    try {
                                        await setDoc(doc(db, 'settings', 'general'), {
                                            imgbb: {
                                                apiKey: imgbbApiKey
                                            }
                                        }, { merge: true });
                                        setImgbbStatus('saved');
                                        setTimeout(() => setImgbbStatus('idle'), 3000);
                                    } catch { }
                                }}
                                disabled={imgbbStatus === 'saving'}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                            >
                                {imgbbStatus === 'saving' ? <><Loader size={16} className="mr-2 animate-spin" /> Saving...</> : <><Save size={16} className="mr-2" /> Save ImgBB Config</>}
                            </button>
                        </div>

                        {/* Payment Methods */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6">
                            <h3 className="text-md font-bold text-white mb-4 flex items-center">
                                <CreditCard size={18} className="mr-2 text-amber-400" />
                                Payment Methods (For Renewals)
                            </h3>
                            <p className="text-gray-400 text-xs mb-4">Configure the payment details where clients will send their subscription renewal payments.</p>

                            {/* GCash */}
                            <div className="mb-6 bg-white/5 rounded-xl border border-white/10 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-blue-400 text-sm flex items-center">
                                        📱 GCash Details
                                    </h4>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" checked={gcashEnabled} onChange={(e) => setGcashEnabled(e.target.checked)} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full relative"></div>
                                    </label>
                                </div>
                                {gcashEnabled && (
                                    <div className="space-y-3 mt-3">
                                        <div>
                                            <input type="text" placeholder="Account Name" value={gcashName} onChange={(e) => setGcashName(e.target.value)} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                                        </div>
                                        <div>
                                            <input type="text" placeholder="Account Number" value={gcashNumber} onChange={(e) => setGcashNumber(e.target.value)} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Upload QR Code (Optional)</label>
                                            <input type="file" accept="image/*" onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    try {
                                                        const b64 = await compressImageToBase64(file);
                                                        setGcashQr(b64);
                                                    } catch (err: any) { alert(err.message); }
                                                }
                                            }} className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 cursor-pointer" />
                                            {gcashQr && (
                                                <div className="mt-2 relative inline-block">
                                                    <img src={gcashQr} alt="GCash QR" className="h-20 rounded border border-white/20" />
                                                    <button onClick={() => setGcashQr('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bank Transfer */}
                            <div className="mb-4 bg-white/5 rounded-xl border border-white/10 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-green-400 text-sm flex items-center">
                                        🏦 Bank Transfer Details
                                    </h4>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" checked={bankEnabled} onChange={(e) => setBankEnabled(e.target.checked)} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full relative"></div>
                                    </label>
                                </div>
                                {bankEnabled && (
                                    <div className="space-y-3 mt-3">
                                        <div>
                                            <input type="text" placeholder="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                                        </div>
                                        <div>
                                            <input type="text" placeholder="Account Name" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                                        </div>
                                        <div>
                                            <input type="text" placeholder="Account Number" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {pmStatus === 'saved' && (
                                <p className="text-green-400 text-xs mb-3 flex items-center gap-1"><CheckCircle size={12} /> Payment methods saved!</p>
                            )}
                            <button
                                onClick={async () => {
                                    setPmStatus('saving');
                                    try {
                                        const paymentMethods = {
                                            gcash: { enabled: gcashEnabled, accountName: gcashName, accountNumber: gcashNumber, qrImage: gcashQr },
                                            bankTransfer: { enabled: bankEnabled, bankName: bankName, accountName: bankAccountName, accountNumber: bankAccountNumber }
                                        };
                                        await setDoc(doc(db, '_superadmin', 'settings'), { paymentMethods }, { merge: true });
                                        setPmStatus('saved');
                                        setTimeout(() => setPmStatus('idle'), 3000);
                                    } catch { }
                                }}
                                disabled={pmStatus === 'saving'}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                            >
                                {pmStatus === 'saving' ? <><Loader size={16} className="mr-2 animate-spin" /> Saving...</> : <><Save size={16} className="mr-2" /> Save Payment Methods</>}
                            </button>
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

            {deleteConfirmId && (
                <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform scale-100" style={{ animation: 'toastIn 0.2s ease-out' }}>
                        <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={28} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Delete Permanently?</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Are you absolutely sure? This will instantly wipe this renewal request from the database forever.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors border border-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await deleteDoc(doc(db, '_superadmin', 'renewals', 'requests', deleteConfirmId));
                                        setRenewalRequests(prev => prev.filter(r => r.id !== deleteConfirmId));
                                        setDeleteConfirmId(null);
                                        copyWithToast('Request deleted forever');
                                    } catch (err) { }
                                }}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-600/20"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showResetPasscodeConfirm && (
                <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform scale-100" style={{ animation: 'toastIn 0.2s ease-out' }}>
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
                            <Key size={28} className="text-amber-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Reset Passcode?</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Are you sure you want to reset the admin panel passcode? This will allow immediate access without a code until they set a new one.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowResetPasscodeConfirm(false)}
                                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors border border-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await setDoc(doc(db, '_superadmin', 'settings'), { adminPasscode: '' }, { merge: true });
                                        setAdminPasscode('');
                                        setShowResetPasscodeConfirm(false);
                                        copyWithToast('Admin passcode reset successfully');
                                    } catch (err) { }
                                }}
                                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/20"
                            >
                                Yes, Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Copy Toast Notification */}
            {copyToast && (
                <div className="fixed bottom-24 md:bottom-6 left-1/2 bg-green-500/90 backdrop-blur-md text-white px-5 py-2.5 rounded-xl shadow-2xl shadow-green-500/30 flex items-center gap-2 z-[400]" style={{ transform: 'translateX(-50%)', animation: 'toastIn 0.25s ease-out' }}>
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">Copied <span className="font-mono text-green-200">{copyToast}</span></span>
                </div>
            )}

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-white/10 z-[100] flex justify-around items-center p-2 safe-area-inset-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <button
                    onClick={() => setActiveSection('subscription')}
                    className={`flex flex-col items-center justify-center w-1/4 py-1 gap-1 transition-colors ${activeSection === 'subscription' ? 'text-amber-400' : 'text-gray-500'}`}
                >
                    <div className={`p-1 rounded-lg ${activeSection === 'subscription' ? 'bg-amber-500/10' : ''}`}>
                        <Power size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight">Main</span>
                </button>
                <button
                    onClick={() => { setActiveSection('renewals'); loadRenewalRequests(); }}
                    className={`flex flex-col items-center justify-center w-1/4 py-1 gap-1 transition-colors ${activeSection === 'renewals' ? 'text-amber-400' : 'text-gray-500'}`}
                >
                    <div className={`p-1 rounded-lg relative ${activeSection === 'renewals' ? 'bg-amber-500/10' : ''}`}>
                        <RefreshCw size={20} />
                        {renewalRequests.some(r => r.status === 'pending') && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-950 shadow-sm"></span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight">Renewals</span>
                </button>
                <button
                    onClick={() => setActiveSection('deployment')}
                    className={`flex flex-col items-center justify-center w-1/4 py-1 gap-1 transition-colors ${activeSection === 'deployment' ? 'text-amber-400' : 'text-gray-500'}`}
                >
                    <div className={`p-1 rounded-lg ${activeSection === 'deployment' ? 'bg-amber-500/10' : ''}`}>
                        <Globe size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight">Deploy</span>
                </button>
                <button
                    onClick={() => setActiveSection('settings')}
                    className={`flex flex-col items-center justify-center w-1/4 py-1 gap-1 transition-colors ${activeSection === 'settings' ? 'text-amber-400' : 'text-gray-500'}`}
                >
                    <div className={`p-1 rounded-lg ${activeSection === 'settings' ? 'bg-amber-500/10' : ''}`}>
                        <Settings size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight">Settings</span>
                </button>
            </div>

            {/* Zoomed Image Overlay */}
            {zoomedImage && (
                <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
                    <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
                        <button
                            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-red-500 rounded-full p-2 transition-colors z-10"
                            onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={zoomedImage}
                            alt="Zoomed"
                            className="max-w-full max-h-[90vh] object-contain rounded-xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            <style>{`@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
        </div>
    );
};

export default SuperAdmin;
