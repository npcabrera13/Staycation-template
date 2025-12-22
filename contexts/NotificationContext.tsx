import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastType } from '../components/UI/Toast';
import ConfirmationModal from '../components/UI/ConfirmationModal';

interface ToastData {
    id: string;
    message: string;
    type: ToastType;
}

interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDangerous?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
}

interface NotificationContextType {
    showToast: (message: string, type?: ToastType) => void;
    showConfirm: (options: ConfirmOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const [confirmModal, setConfirmModal] = useState<ConfirmOptions & { isOpen: boolean } | null>(null);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const showConfirm = useCallback((options: ConfirmOptions) => {
        setConfirmModal({ ...options, isOpen: true });
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const handleConfirm = () => {
        if (confirmModal?.onConfirm) confirmModal.onConfirm();
        setConfirmModal(null);
    };

    const handleCancel = () => {
        if (confirmModal?.onCancel) confirmModal.onCancel();
        setConfirmModal(null);
    };

    return (
        <NotificationContext.Provider value={{ showToast, showConfirm }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-24 right-6 z-[200] flex flex-col items-end pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast
                            id={toast.id}
                            message={toast.message}
                            type={toast.type}
                            onDismiss={removeToast}
                        />
                    </div>
                ))}
            </div>

            {/* Confirmation Modal */}
            {confirmModal && (
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmLabel={confirmModal.confirmLabel}
                    cancelLabel={confirmModal.cancelLabel}
                    isDangerous={confirmModal.isDangerous}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
