import React, { useState, useRef } from 'react';
import { AlertTriangle, CheckCircle, X, Upload, Loader, Phone, Mail, CreditCard, RefreshCw, ZoomIn, ChevronLeft } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Settings } from '../../types';
import { compressImageToBase64 } from '../../utils/imageUtils';
import { doc, getDoc, getDocs, query, where, orderBy, limit, deleteDoc } from 'firebase/firestore';

interface RenewalModalProps {
    expiryDays: number;
    expiryDate: string | null;
    contactInfo: { email: string; phone: string; providerName: string };
    settings?: Settings;
    onClose: () => void;
}

const PLAN_OPTIONS = [
    { days: 30, label: '30 Days', multiplier: 1, discount: null },
    { days: 60, label: '60 Days', multiplier: 1.8, discount: 'SAVE 10%' },
    { days: 90, label: '90 Days', multiplier: 2.5, discount: 'SAVE 16%' },
];

const RenewalModal: React.FC<RenewalModalProps> = ({
    expiryDays,
    expiryDate,
    contactInfo,
    settings,
    onClose,
}) => {
    const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
    const [selectedPlan, setSelectedPlan] = useState(0); // index into PLAN_OPTIONS
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [superAdminSettings, setSuperAdminSettings] = useState<any>(null);
    const [fetchingSettings, setFetchingSettings] = useState(true);
    const [recentRequests, setRecentRequests] = useState<any[]>([]);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                // Load Superadmin Settings
                const docSnap = await getDoc(doc(db, '_superadmin', 'settings'));
                if (docSnap.exists()) {
                    setSuperAdminSettings(docSnap.data());
                }

                // Load Recent Requests
                if (settings?.siteName) {
                    const q = query(
                        collection(db, '_superadmin', 'renewals', 'requests'),
                        where('clientName', '==', settings.siteName),
                        orderBy('submittedAt', 'desc'),
                        limit(3)
                    );
                    const querySnapshot = await getDocs(q);
                    const requests = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                    setRecentRequests(requests);
                }
            } catch (err) {
                console.error("Failed to load renewal data", err);
            }
            setFetchingSettings(false);
        };
        loadData();
    }, [settings?.siteName]);

    // Pull payment methods and base renewal price from SuperAdmin settings
    const gcash = superAdminSettings?.paymentMethods?.gcash;
    const bank = superAdminSettings?.paymentMethods?.bankTransfer;
    const basePrice = superAdminSettings?.renewalPrice ?? 99;
    const baseDays = superAdminSettings?.renewalDays ?? 30;

    // Dynamic price/days based on selected plan (round up to nearest whole number)
    const plan = PLAN_OPTIONS[selectedPlan];
    const totalPrice = Math.round(basePrice * plan.multiplier);
    const totalDays = Math.round(baseDays * plan.multiplier);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (JPG, PNG, etc.)');
            return;
        }
        // No 10MB limit because we rely on our client-side compressor to safely shrink it to a base64 string
        setError('');
        setProofFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setProofPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!proofFile) {
            setError('Please upload your payment screenshot first.');
            return;
        }
        setUploading(true);
        setError('');
        try {
            // Compress image to base64 instead of using Firebase Storage
            const base64Proof = await compressImageToBase64(proofFile);

            await addDoc(collection(db, '_superadmin', 'renewals', 'requests'), {
                clientName: settings?.siteName || 'Unknown',
                plan: plan.label,
                daysRequested: totalDays,
                amount: totalPrice,
                paymentProofUrl: base64Proof,
                submittedAt: new Date().toISOString(),
                status: 'pending',
            });

            // Cleanup: delete older requests for this client, keeping only the 3 most recent
            try {
                const cleanQ = query(
                    collection(db, '_superadmin', 'renewals', 'requests'),
                    where('clientName', '==', settings?.siteName || 'Unknown'),
                    orderBy('submittedAt', 'desc')
                );
                const cleanSnap = await getDocs(cleanQ);
                if (cleanSnap.docs.length > 3) {
                    const toDelete = cleanSnap.docs.slice(3); // keep index 0,1,2
                    for (const docSnapshot of toDelete) {
                        await deleteDoc(docSnapshot.ref);
                    }
                }
            } catch (cleanupErr) {
                console.error("Failed to cleanup old requests:", cleanupErr);
            }

            setStep('success');
        } catch (err: any) {
            setError(`Submission failed: ${err.message}`);
        }
        setUploading(false);
    };

    const isExpired = expiryDays <= 0;

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full animate-fade-in border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[92vh] flex flex-col">

                    {/* ─── Header ─── */}
                    <div className={`p-4 flex items-center justify-between flex-shrink-0 ${isExpired ? 'bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10' : 'bg-gradient-to-r from-amber-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-900/10'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isExpired ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-yellow-900/40'}`}>
                                <AlertTriangle size={20} className={isExpired ? 'text-red-500 animate-pulse' : 'text-amber-500 animate-pulse'} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                                    {isExpired ? 'Subscription Expired' : 'Subscription Expiring Soon'}
                                </h3>
                                <p className={`text-xs font-semibold ${isExpired ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                                    {isExpired
                                        ? `Expired ${Math.abs(expiryDays)} day${Math.abs(expiryDays) !== 1 ? 's' : ''} ago`
                                        : `${expiryDays} day${expiryDays !== 1 ? 's' : ''} remaining`}
                                </p>
                            </div>
                        </div>
                        {!isExpired && (
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-white/60 dark:hover:bg-gray-700 transition-colors">
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {/* ─── Scrollable Body ─── */}
                    <div className="p-5 overflow-y-auto flex-1">
                        {fetchingSettings ? (
                            <div className="flex flex-col flex-1 items-center justify-center p-10 h-64">
                                <Loader size={30} className="text-primary animate-spin mb-3" />
                                <p className="text-gray-500 text-sm">Loading details...</p>
                            </div>
                        ) : (
                            <>
                                {/* ══════ STEP 1: PLAN SELECTION ══════ */}
                                {step === 'info' && (
                            <div className="space-y-4">
                                {expiryDate && !recentRequests.some(r => r.status === 'pending') && (
                                    <p className="text-gray-500 dark:text-gray-400 text-xs text-center">
                                        {isExpired ? 'Expired on' : 'Expires on'}:{' '}
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                                            {new Date(expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </p>
                                )}

                                {/* Plan Selector - Hidden if there's a pending request */}
                                {!recentRequests.some(r => r.status === 'pending') ? (
                                    <>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-center">Choose your plan</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PLAN_OPTIONS.map((opt, idx) => (
                                            <button
                                                key={opt.days}
                                                onClick={() => setSelectedPlan(idx)}
                                                className={`relative rounded-xl p-3 text-center transition-all border-2 ${
                                                    selectedPlan === idx
                                                        ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700/50'
                                                }`}
                                            >
                                                {opt.discount && (
                                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">{opt.discount}</span>
                                                )}
                                                <p className={`text-lg font-black ${selectedPlan === idx ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    {opt.days}
                                                </p>
                                                <p className={`text-[10px] font-medium ${selectedPlan === idx ? 'text-primary/70' : 'text-gray-400'}`}>Days</p>
                                                <p className={`text-xs font-bold mt-1 ${selectedPlan === idx ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    ₱{Math.round(basePrice * opt.multiplier)}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Selected Price Summary */}
                                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-xl p-4 text-center">
                                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{plan.label} Plan</p>
                                    <p className="text-4xl font-black text-gray-900 dark:text-white">₱{totalPrice}</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{totalDays} days of continued access</p>
                                </div>

                                <p className="text-gray-600 dark:text-gray-300 text-xs text-center">
                                    Send payment and upload your receipt to renew instantly.
                                </p>

                                        <button
                                            onClick={() => setStep('payment')}
                                            className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw size={16} /> Continue — ₱{totalPrice}
                                        </button>
                                    </>
                                ) : (
                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 text-center">
                                        <CheckCircle size={24} className="text-amber-500 mx-auto mb-2" />
                                        <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">Request Under Review</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-500">Your recent renewal request is being processed. Thank you for your patience!</p>
                                    </div>
                                )}

                                {/* Contact fallback */}
                                {(contactInfo.email || contactInfo.phone) && (
                                    <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                                        <p className="text-center text-[10px] text-gray-400 mb-1.5">Need help? Contact us:</p>
                                        <div className="flex items-center justify-center gap-4">
                                            {contactInfo.email && (
                                                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-1 text-blue-500 hover:underline text-xs">
                                                    <Mail size={11} /> Email
                                                </a>
                                            )}
                                            {contactInfo.phone && (
                                                <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-1 text-green-500 hover:underline text-xs">
                                                    <Phone size={11} /> {contactInfo.phone}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Transactions Section */}
                                {recentRequests.length > 0 && (
                                    <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-6">
                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                                            Recent Transactions
                                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-[10px]">{recentRequests.length} records</span>
                                        </h4>
                                        <div className="space-y-3">
                                            {recentRequests.map((req) => (
                                                <div key={req.id} className={`p-3 rounded-xl border ${
                                                    req.status === 'pending' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-500/20' : 
                                                    req.status === 'approved' ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-500/20' : 
                                                    'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-500/20'
                                                }`}>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div>
                                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                                                req.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                req.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}>
                                                                {req.status === 'pending' ? 'Under Review' : req.status === 'approved' ? 'Approved' : 'Rejected'}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">₱{req.amount}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end mt-2">
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{req.plan} Plan (+{req.daysRequested} Days)</p>
                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{new Date(req.submittedAt).toLocaleDateString()}</p>
                                                        </div>
                                                        {req.paymentProofUrl && (
                                                            <button onClick={() => setZoomedImage(req.paymentProofUrl)} className="text-primary text-[10px] hover:underline font-medium">
                                                                View Receipt
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══════ STEP 2: PAYMENT + UPLOAD ══════ */}
                        {step === 'payment' && (
                            <div className="space-y-4">
                                <button
                                    onClick={() => setStep('info')}
                                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 font-medium"
                                >
                                    <ChevronLeft size={14} /> Change plan
                                </button>

                                {/* Plan summary chip */}
                                <div className="flex items-center justify-between bg-primary/10 rounded-lg px-3 py-2">
                                    <span className="text-xs font-bold text-primary">{plan.label} Plan</span>
                                    <span className="text-sm font-black text-primary">₱{totalPrice}</span>
                                </div>

                                {/* Payment instructions */}
                                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 space-y-2.5">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <CreditCard size={11} /> Send ₱{totalPrice} to:
                                    </p>

                                    {/* GCash */}
                                    {gcash?.enabled && gcash.accountNumber && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">📱 GCash</p>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{gcash.accountName || 'Account Name'}</p>
                                            <p className="text-blue-600 dark:text-blue-400 font-mono text-base tracking-wider">{gcash.accountNumber}</p>
                                            {gcash.qrImage && (
                                                <div className="mt-2 flex flex-col items-center">
                                                    <div
                                                        onClick={() => setZoomedImage(gcash.qrImage!)}
                                                        className="relative cursor-zoom-in group"
                                                    >
                                                        <img src={gcash.qrImage} alt="GCash QR" className="w-28 h-28 rounded-lg object-contain border border-blue-200 dark:border-blue-700 group-hover:shadow-lg transition-shadow" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                                                            <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] text-blue-400 mt-1">Tap QR to zoom</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Bank Transfer */}
                                    {(bank as any)?.enabled && (bank as any)?.accountNumber && (
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                            <p className="text-[10px] font-bold text-green-600 dark:text-green-400 mb-1 uppercase tracking-wider">🏦 {(bank as any).bankName || 'Bank Transfer'}</p>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{(bank as any).accountName || 'Account Name'}</p>
                                            <p className="text-green-600 dark:text-green-400 font-mono text-base tracking-wider">{(bank as any).accountNumber}</p>
                                        </div>
                                    )}

                                    {/* Fallback */}
                                    {!gcash?.enabled && !(bank as any)?.enabled && (
                                        <div className="text-center py-2">
                                            <p className="text-gray-500 text-sm">Payment details not configured.</p>
                                            {contactInfo.phone && (
                                                <a href={`tel:${contactInfo.phone}`} className="text-green-500 font-bold text-sm mt-1 inline-flex items-center gap-1">
                                                    <Phone size={12} />{contactInfo.phone}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Upload proof */}
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Upload Payment Screenshot</p>

                                    {proofPreview ? (
                                        /* ─ Uploaded preview ─ */
                                        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3">
                                            <div
                                                onClick={() => setZoomedImage(proofPreview!)}
                                                className="relative cursor-zoom-in group mx-auto w-fit"
                                            >
                                                <img src={proofPreview} alt="Receipt" className="max-h-40 rounded-lg object-contain shadow-sm group-hover:shadow-md transition-shadow" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                                                    <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-xs text-primary font-medium flex items-center gap-1">
                                                    <CheckCircle size={12} /> Receipt uploaded
                                                </p>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="text-xs text-gray-400 hover:text-primary font-medium underline"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ─ Empty upload area ─ */
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer transition-all hover:border-primary hover:bg-primary/5 group"
                                        >
                                            <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                                                <Upload size={20} className="text-gray-400 group-hover:text-primary transition-colors" />
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Tap to upload GCash receipt</p>
                                            <p className="text-[10px] text-gray-400 mt-1">JPG, PNG • Max 10MB</p>
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5 flex items-start gap-2">
                                        <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-red-600 dark:text-red-400 text-xs">{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={uploading || !proofFile}
                                    className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <><Loader size={16} className="animate-spin" /> Submitting...</>
                                    ) : (
                                        <><CheckCircle size={16} /> Submit Renewal — ₱{totalPrice}</>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* ══════ STEP 3: SUCCESS ══════ */}
                        {step === 'success' && (
                            <div className="text-center space-y-4 py-2">
                                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                    <CheckCircle size={36} className="text-green-500" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white">Request Submitted!</h4>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    Your <span className="font-bold">{plan.label}</span> renewal request (₱{totalPrice}) has been sent. We'll verify your payment and activate your subscription shortly.
                                </p>
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
                                    💡 You'll be able to continue using the admin panel once approved.
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Fullscreen Image Zoom Overlay ─── */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setZoomedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-colors z-10"
                        onClick={() => setZoomedImage(null)}
                    >
                        <X size={22} />
                    </button>
                    <img
                        src={zoomedImage}
                        alt="Zoomed"
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                        style={{ animation: 'zoomPop 0.2s ease-out' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <style>{`@keyframes zoomPop { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
                </div>
            )}
        </>
    );
};

export default RenewalModal;
