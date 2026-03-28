import React, { useState, useEffect } from 'react';
import { ChevronRight, X, Image as ImageIcon, CreditCard, Share2, Palette } from 'lucide-react';

interface AdminOnboardingProps {
    onNavigate: (tab: string, targetId?: string) => void;
    onEnterVisualBuilder?: () => void;
}

const AdminOnboarding: React.FC<AdminOnboardingProps> = ({ onNavigate, onEnterVisualBuilder }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('adminOnboardingDismissed')) {
            setIsVisible(true);
        }
    }, []);

    const dismiss = () => {
        setIsVisible(false);
        localStorage.setItem('adminOnboardingDismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border border-blue-100 dark:border-gray-700 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-sm animate-fade-in">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <button onClick={dismiss} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 z-20">
                <X size={16} />
            </button>

            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight flex items-center gap-2">
                        Welcome to your Admin Panel! ✨
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm md:text-base leading-relaxed max-w-2xl">
                        Your basic website is live, but there are a few important details left to complete before you start accepting real bookings.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <TaskItem 
                            icon={<CreditCard size={18} />} 
                            title="Set up Payment Methods" 
                            subtitle="Add your GCash or Bank Transfer details for guests." 
                            onClick={() => onNavigate('settings', 'settings-payment')} 
                        />
                        <TaskItem 
                            icon={<ImageIcon size={18} />} 
                            title="Upload Real Room Photos" 
                            subtitle="Replace the placeholder images with your actual rooms." 
                            onClick={() => onNavigate('rooms')} 
                        />
                        <TaskItem 
                            icon={<Share2 size={18} />} 
                            title="Add Social Media Links" 
                            subtitle="Connect your Facebook, Instagram, or Airbnb listings." 
                            onClick={() => onNavigate('settings', 'settings-social')} 
                        />
                        <TaskItem 
                            icon={<Palette size={18} />} 
                            title="Use Visual Builder" 
                            subtitle="Customize the home page images, colors, and design." 
                            onClick={onEnterVisualBuilder || (() => onNavigate('overview'))} 
                            isHighlighted={!!onEnterVisualBuilder}
                        />
                    </div>
                </div>
                
                <div className="hidden md:flex w-1/3 flex-col items-center justify-center py-6 px-4">
                    <div className="w-32 h-32 bg-white flex items-center justify-center rounded-3xl shadow-xl shadow-blue-500/10 border border-blue-100 dark:border-gray-700 dark:bg-gray-800 transform rotate-3">
                        <div className="-rotate-3 text-6xl drop-shadow-md">🚀</div>
                    </div>
                    <div className="mt-6 text-center">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full inline-block">Next Steps</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface TaskItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
    isHighlighted?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ icon, title, subtitle, onClick, isHighlighted }) => (
    <div 
        onClick={onClick}
        className={`group flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border transition-all active:scale-[0.99] cursor-pointer shadow-sm hover:shadow-md ${isHighlighted 
            ? 'border-blue-500 ring-1 ring-blue-500/20 bg-blue-50/10 dark:bg-blue-900/10' 
            : 'border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500'}`}
    >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isHighlighted 
            ? 'bg-blue-600 text-white' 
            : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
            {icon}
        </div>
        <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                {title}
                {isHighlighted && <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <div className={`p-2 rounded-full transition-colors hidden sm:block ${isHighlighted 
            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
            : 'bg-gray-50 dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
            <ChevronRight size={16} />
        </div>
    </div>
);

export default AdminOnboarding;
