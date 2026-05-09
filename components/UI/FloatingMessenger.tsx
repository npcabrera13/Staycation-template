import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface FloatingMessengerProps {
    facebookUrl?: string;
}

const FloatingMessenger: React.FC<FloatingMessengerProps> = ({ facebookUrl }) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const superadminRef = doc(db, '_superadmin', 'settings');
                const snap = await getDoc(superadminRef);
                
                if (snap.exists()) {
                    const data = snap.data();
                    // Default to true if not explicitly set to false
                    setIsEnabled(data.enableFloatingMessenger !== false);
                } else {
                    setIsEnabled(true);
                }
            } catch (error) {
                console.error("Failed to fetch superadmin settings for floating messenger", error);
                setIsEnabled(true); // Graceful fallback
            }
        };

        fetchSettings();
    }, []);

    // Do not render if disabled or if there's no Facebook URL configured
    if (!isEnabled || !facebookUrl) {
        return null;
    }

    const handleOpenMessenger = () => {
        window.open(facebookUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Tooltip / Label */}
            <div 
                className={`mb-3 bg-white px-4 py-2 rounded-2xl shadow-xl text-sm font-medium text-gray-800 transition-all duration-300 transform origin-bottom-right ${isHovered ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
            >
                Chat with us!
                {/* Tooltip Tail */}
                <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white transform rotate-45" />
            </div>

            {/* Floating Action Button */}
            <button
                onClick={handleOpenMessenger}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-full shadow-[0_8px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.5)] hover:-translate-y-1 transition-all duration-300 active:scale-95"
                aria-label="Open Facebook Messenger"
            >
                {/* Ripple Effect Background */}
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                
                <MessageCircle size={28} className="relative z-10" />
            </button>
        </div>
    );
};

export default FloatingMessenger;
