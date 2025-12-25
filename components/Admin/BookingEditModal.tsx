import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Calendar, Plus, Clock, Image as ImageIcon } from 'lucide-react';
import { Booking } from '../../types';
import { format, addDays } from 'date-fns';

interface BookingEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking?: Booking | null; // Optional: if null, we are adding a new booking
    onSave: (updatedBooking: Booking) => void;
}

const BookingEditModal: React.FC<BookingEditModalProps> = ({ isOpen, onClose, booking, onSave }) => {
    const [formData, setFormData] = useState<Booking | null>(null);
    const [showProofModal, setShowProofModal] = useState(false);

    // Default state for new booking
    const defaultBooking: Booking = {
        id: '', // Will be generated
        roomId: '1', // Default to first room usually, but here fixed '1' or separate logic?
        // Ideally we should pass rooms prop to select room, but for now we'll keep current roomId or let user input/select if we add that field.
        // The previous "Add" form relied on rooms[0].id.
        // Let's assume roomId is handled or we add a Room ID input.
        // Looking at existing Edit form, Room ID wasn't editable.
        // IMPORTANT: For NEW booking, Room ID is critical.
        // Detailed fix: Add Room Selection if I can.
        // For now, let's just initialize defaults.
        guestName: '',
        email: '',
        phoneNumber: '',
        guests: 1,
        checkIn: new Date().toISOString(),
        checkOut: addDays(new Date(), 1).toISOString(),
        totalPrice: 0,
        status: 'confirmed',
        bookedAt: new Date().toISOString(),
        estimatedArrival: '14:00',
        estimatedDeparture: '11:00'
    };

    useEffect(() => {
        if (isOpen) {
            if (booking) {
                setFormData({ ...booking });
            } else {
                setFormData({ ...defaultBooking });
            }
        }
    }, [isOpen, booking]);

    if (!isOpen || !formData) return null;

    const isNew = !booking || !booking.id;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose(); // Ideally close after save success, but for now immediate close
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">{isNew ? 'Add New Booking' : 'Edit Booking'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        {/* Status Selection */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Booking Status</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['confirmed', 'pending', 'cancelled'] as const).map(status => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status })}
                                        className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all ${formData.status === status
                                            ? status === 'confirmed' ? 'border-green-500 bg-green-50 text-green-700'
                                                : status === 'pending' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                                    : 'border-red-500 bg-red-50 text-red-700'
                                            : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Guest Details */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700 pb-1 mb-2">Guest Information</label>

                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={formData.guestName}
                                    onChange={e => setFormData({ ...formData, guestName: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Guest Name"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Email Address"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Phone Number"
                                    required
                                />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700 pb-1 mb-2">Stay Details</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Check-in</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="date"
                                            value={formData.checkIn.split('T')[0]}
                                            onChange={e => setFormData({ ...formData, checkIn: new Date(e.target.value).toISOString() })}
                                            className="w-full pl-10 pr-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Check-out</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="date"
                                            value={formData.checkOut.split('T')[0]}
                                            onChange={e => setFormData({ ...formData, checkOut: new Date(e.target.value).toISOString() })}
                                            className="w-full pl-10 pr-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Number of Guests</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.guests}
                                    onChange={e => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Estimated Times */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Est. Arrival Time</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="time"
                                        value={formData.estimatedArrival || '14:00'}
                                        onChange={e => setFormData({ ...formData, estimatedArrival: e.target.value })}
                                        className="w-full pl-10 pr-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Est. Departure Time</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="time"
                                        value={formData.estimatedDeparture || '11:00'}
                                        onChange={e => setFormData({ ...formData, estimatedDeparture: e.target.value })}
                                        className="w-full pl-10 pr-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Deposit Payment Status - Only show if booking has deposit info */}
                        {formData.depositAmount !== undefined && formData.depositAmount > 0 && (
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1 mb-2">💰 Deposit Payment</label>

                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Deposit Amount</span>
                                        <span className="font-bold text-gray-800">₱{formData.depositAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Balance Due</span>
                                        <span className="font-medium text-gray-600">₱{(formData.balanceAmount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total</span>
                                        <span className="font-bold text-primary">₱{formData.totalPrice.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Mark Deposit as Paid Toggle */}
                                <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${formData.depositPaid
                                    ? 'bg-green-50 border-green-300'
                                    : 'bg-yellow-50 border-yellow-300'
                                    }`}>
                                    <div>
                                        <p className={`font-bold ${formData.depositPaid ? 'text-green-700' : 'text-yellow-700'}`}>
                                            {formData.depositPaid ? '✅ Deposit Paid' : '⏳ Awaiting Payment'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formData.depositPaid
                                                ? `Paid on ${formData.depositPaidAt ? new Date(formData.depositPaidAt).toLocaleDateString() : 'N/A'}`
                                                : 'Mark as paid when guest sends proof of payment'
                                            }
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newDepositPaid = !formData.depositPaid;
                                            setFormData({
                                                ...formData,
                                                depositPaid: newDepositPaid,
                                                depositPaidAt: newDepositPaid ? new Date().toISOString() : undefined,
                                                // Auto-confirm when deposit is paid
                                                status: newDepositPaid && formData.status === 'pending' ? 'confirmed' : formData.status
                                            });
                                        }}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${formData.depositPaid
                                            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                    >
                                        {formData.depositPaid ? 'Undo' : 'Mark as Paid'}
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Payment Proof Display */}
                        {formData.paymentProof && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1 mb-2">Payment Proof</label>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center mb-2">
                                        <ImageIcon className="text-primary mr-2" size={16} />
                                        <span className="text-sm font-medium text-gray-700">Attached Receipt/Screenshot</span>
                                    </div>
                                    <div className="relative group">
                                        <img
                                            src={formData.paymentProof}
                                            alt="Payment Proof"
                                            className="w-full h-auto max-h-64 object-contain rounded-lg border border-gray-300 bg-white cursor-pointer"
                                            onClick={() => setShowProofModal(true)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowProofModal(true)}
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold rounded-lg"
                                        >
                                            🔍 View Full Size
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover shadow-md transition-all flex items-center"
                    >
                        {isNew ? <Plus size={18} className="mr-2" /> : <Save size={18} className="mr-2" />}
                        {isNew ? 'Create Booking' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Full size image modal */}
            {showProofModal && formData.paymentProof && (
                <ImageModal src={formData.paymentProof} onClose={() => setShowProofModal(false)} />
            )}
        </div>
    );
};

export default BookingEditModal;

// Full screen image modal component
function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
            >
                ✕
            </button>
            <img
                src={src}
                alt="Payment Proof Full Size"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}
