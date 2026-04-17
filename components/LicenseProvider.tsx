
import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import LockoutScreen from './LockoutScreen';
import { Loader } from 'lucide-react';
import { useLocation } from 'react-router-dom';

type LockMode = 'none' | 'homepage' | 'admin' | 'both';

interface LicenseContextType {
    isLicensed: boolean;
    isChecking: boolean;
    lockMode: LockMode;
    isHomepageLocked: boolean;
    isAdminLocked: boolean;
    contactEmail: string;
    contactPhone: string;
    providerName: string;
    expiryDays: number | null;
    expiryDate: string | null;
    showExpiryWarning: boolean;
    setShowExpiryWarning: (show: boolean) => void;
    showMissingPasscodeWarning: boolean;
    setShowMissingPasscodeWarning: (show: boolean) => void;
    licenseKey: string;
    eagerLoadAdmin: boolean;
}

const LicenseContext = createContext<LicenseContextType>({
    isLicensed: true,
    isChecking: true,
    lockMode: 'none',
    isHomepageLocked: false,
    isAdminLocked: false,
    contactEmail: 'support@example.com',
    contactPhone: '',
    providerName: '',
    expiryDays: null,
    expiryDate: null,
    showExpiryWarning: false,
    setShowExpiryWarning: () => { },
    showMissingPasscodeWarning: false,
    setShowMissingPasscodeWarning: () => { },
    licenseKey: '',
    eagerLoadAdmin: false,
});

export const useLicense = () => useContext(LicenseContext);

interface LicenseProviderProps {
    children: React.ReactNode;
}

const LicenseProvider: React.FC<LicenseProviderProps> = ({ children }) => {
    const [isChecking, setIsChecking] = useState(true);
    const [lockMode, setLockMode] = useState<LockMode>('none');
    const [isExpired, setIsExpired] = useState(false);
    const [contactEmail, setContactEmail] = useState('support@example.com');
    const [contactPhone, setContactPhone] = useState('');
    const [providerName, setProviderName] = useState('');
    const [expiryDays, setExpiryDays] = useState<number | null>(null);
    const [expiryDate, setExpiryDate] = useState<string | null>(null);
    const [showExpiryWarning, setShowExpiryWarning] = useState(false);
    const [showMissingPasscodeWarning, setShowMissingPasscodeWarning] = useState(false);
    const [licenseKey, setLicenseKey] = useState('');
    const [eagerLoadAdmin, setEagerLoadAdmin] = useState(false);
    const location = useLocation();

    // Skip license check on /superadmin route
    const isSuperAdminRoute = location.pathname === '/superadmin';
    const isAdminRoute = location.pathname === '/admin';

    useEffect(() => {
        if (isSuperAdminRoute) {
            setIsChecking(false);
            return;
        }
        checkLicense();
        loadContactInfo();
    }, [isSuperAdminRoute]);

    const loadContactInfo = async () => {
        try {
            const snap = await getDoc(doc(db, '_superadmin', 'settings'));
            if (snap.exists()) {
                const data = snap.data();
                
                // Track contact info
                if (data.contactInfo) {
                    const c = data.contactInfo;
                    if (c.email) setContactEmail(c.email);
                    if (c.phone) setContactPhone(c.phone);
                    if (c.providerName) setProviderName(c.providerName);
                }

                // CHECK FOR MISSING PASSCODE
                // If the doc exists but adminPasscode is missing or empty, show warning
                if (!data.adminPasscode || data.adminPasscode.trim() === '') {
                    setShowMissingPasscodeWarning(true);
                } else {
                    setShowMissingPasscodeWarning(false);
                }

                if (typeof data.eagerLoadAdmin === 'boolean') {
                    setEagerLoadAdmin(data.eagerLoadAdmin);
                }
            }
        } catch (err) {
            console.error("Error loading superadmin settings:", err);
        }
    };

    const checkLicense = async () => {
        try {
            const docRef = doc(db, '_superadmin', 'subscription');
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // No subscription doc = not configured yet, allow access
                setLockMode('none');
                setIsExpired(false);
                setIsChecking(false);
                return;
            }

            const data = docSnap.data();
            if (data.licenseKey) setLicenseKey(data.licenseKey);

            // Backward compat: convert old `active` boolean to lockMode
            let mode: LockMode = 'none';
            if ('lockMode' in data) {
                mode = data.lockMode as LockMode;
            } else if ('active' in data && !data.active) {
                mode = 'both';
            }
            setLockMode(mode);

            // Get server time (tamper-proof) by writing + reading a serverTimestamp
            let serverNow: Date;
            try {
                const timeRef = doc(db, '_superadmin', '_timecheck');
                await setDoc(timeRef, { t: serverTimestamp() });
                const timeSnap = await getDoc(timeRef);
                const ts = timeSnap.data()?.t as Timestamp;
                serverNow = ts?.toDate() || new Date();
            } catch {
                // Fallback to local time if server timestamp fails
                serverNow = new Date();
            }

            // Check if expired
            if (data.expiresAt) {
                const expDate = new Date(data.expiresAt);
                setExpiryDate(data.expiresAt);
                
                const diffTime = expDate.getTime() - serverNow.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setExpiryDays(diffDays);

                if (expDate < serverNow) {
                    setIsExpired(true);
                    setLockMode('both'); // Force lock when mathematically expired
                    setIsChecking(false);
                    return;
                }

                // If not expired but within warning threshold (e.g. 7 days), check if we should show warning
                if (diffDays <= 7 && isAdminRoute) {
                    // Check local storage so we don't show it EVERY visit during the day
                    const lastWarning = localStorage.getItem('last_expiry_warning');
                    const todayStr = serverNow.toISOString().split('T')[0];
                    if (lastWarning !== todayStr) {
                        setShowExpiryWarning(true);
                        localStorage.setItem('last_expiry_warning', todayStr);
                    }
                }
            } else {
                // Subscription doc exists but no expiresAt = cleared/revoked → treat as expired
                setIsExpired(true);
                setLockMode('both');
                setIsChecking(false);
                return;
            }

            setIsExpired(false);
            setIsChecking(false);
        } catch (error) {
            // Fail-open
            console.warn('License check failed (allowing access):', error);
            setLockMode('none');
            setIsExpired(false);
            setIsChecking(false);
        }
    };

    // Derive lock status
    const isHomepageLockedDerived = isExpired || lockMode === 'homepage' || lockMode === 'both';
    const isAdminLockedDerived = isExpired || lockMode === 'admin' || lockMode === 'both';
    
    // Overall: is the current route licensed?
    const isLicensed = isSuperAdminRoute
        ? true
        : isAdminRoute
            ? !isAdminLockedDerived
            : !isHomepageLockedDerived;

    // Always allow /superadmin
    if (isSuperAdminRoute) {
        return (
            <LicenseContext.Provider value={{ 
                isLicensed: true, 
                isChecking: false, 
                lockMode: 'none', 
                isHomepageLocked: false, 
                isAdminLocked: false, 
                contactEmail, 
                contactPhone, 
                providerName,
                expiryDays: null,
                expiryDate: null,
                showExpiryWarning: false,
                setShowExpiryWarning: () => {},
                showMissingPasscodeWarning: false,
                setShowMissingPasscodeWarning: () => {},
                licenseKey: '',
                eagerLoadAdmin: false
            }}>
                {children}
            </LicenseContext.Provider>
        );
    }

    // Show loading while checking
    if (isChecking) {
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

    return (
        <LicenseContext.Provider value={{ 
            isLicensed, 
            isChecking, 
            lockMode, 
            isHomepageLocked: isHomepageLockedDerived, 
            isAdminLocked: isAdminLockedDerived, 
            contactEmail, 
            contactPhone, 
            providerName,
            expiryDays,
            expiryDate,
            showExpiryWarning,
            setShowExpiryWarning,
            showMissingPasscodeWarning,
            setShowMissingPasscodeWarning,
            licenseKey,
            eagerLoadAdmin
        }}>
            {children}
        </LicenseContext.Provider>
    );
};

export default LicenseProvider;
