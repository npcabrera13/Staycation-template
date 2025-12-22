import React from 'react';
import { X, CheckCircle, Clock, XCircle, Calendar, DollarSign } from 'lucide-react';
import { Booking } from '../../types';

interface StatsSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookings: Booking[];
    revenue: number;
}

const StatsSummaryModal: React.FC<StatsSummaryModalProps> = ({ isOpen, onClose, bookings, revenue }) => {
    if (!isOpen) return null;

    const confirmed = bookings.filter(b => b.status === 'confirmed');
    const pending = bookings.filter(b => b.status === 'pending');
    const cancelled = bookings.filter(b => b.status === 'cancelled');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in border border-gray-100">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 font-serif flex items-center">
                            <Calendar className="mr-2 text-primary" size={24} />
                            Booking Summary
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Total Bookings</p>
                            <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle size={14} className="text-green-600" />
                                    <span className="text-xs font-bold text-green-800">Confirmed</span>
                                </div>
                                <span className="text-xl font-bold text-green-900">{confirmed.length}</span>
                            </div>
                            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock size={14} className="text-yellow-600" />
                                    <span className="text-xs font-bold text-yellow-800">Pending</span>
                                </div>
                                <span className="text-xl font-bold text-yellow-900">{pending.length}</span>
                            </div>
                        </div>

                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <XCircle size={14} className="text-red-600" />
                                <span className="text-xs font-bold text-red-800">Cancelled</span>
                            </div>
                            <span className="text-lg font-bold text-red-900">{cancelled.length}</span>
                        </div>

                        <div className="border-t border-gray-100 pt-4 mt-2">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Estimated Revenue</p>
                                    <p className="text-2xl font-bold text-primary flex items-center">
                                        <span className="mr-1 text-lg">₱</span>
                                        {revenue.toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-xs text-gray-400">
                                    PHP
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsSummaryModal;
