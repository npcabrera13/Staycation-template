import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDangerous?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDangerous = false,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-scale-in border border-gray-100">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isDangerous ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-primary'}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 font-serif">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all transform active:scale-95 ${isDangerous
                            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                            : 'bg-primary hover:bg-primary-hover focus:ring-primary'
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
