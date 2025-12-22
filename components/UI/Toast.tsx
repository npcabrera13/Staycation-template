import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
    id: string;
    message: string;
    type?: ToastType;
    duration?: number;
    onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type = 'success', duration = 3000, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));

        const timer = setTimeout(() => {
            setIsVisible(false);
            // Wait for exit animation to finish before removing
            setTimeout(() => onDismiss(id), 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onDismiss]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => onDismiss(id), 300);
    };

    const icons = {
        success: <CheckCircle className="text-green-500" size={20} />,
        error: <XCircle className="text-red-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />,
        warning: <AlertTriangle className="text-yellow-500" size={20} />
    };

    const styles = {
        success: 'border-green-100 bg-green-50',
        error: 'border-red-100 bg-red-50',
        info: 'border-blue-100 bg-blue-50',
        warning: 'border-yellow-100 bg-yellow-50'
    };

    return (
        <div
            className={`flex items-center p-4 mb-3 rounded-lg border shadow-lg max-w-sm w-full transition-all duration-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                } ${styles[type]} backdrop-blur-sm bg-opacity-95`}
            role="alert"
        >
            <div className="flex-shrink-0 mr-3">
                {icons[type]}
            </div>
            <div className="flex-1 text-sm font-medium text-gray-800 break-words">
                {message}
            </div>
            <button
                onClick={handleDismiss}
                className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
