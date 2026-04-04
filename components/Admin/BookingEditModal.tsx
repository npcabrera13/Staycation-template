import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Calendar, Plus, Clock, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { Booking, Room } from '../../types';
import { format, addDays } from 'date-fns';

interface BookingEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking?: Booking | null; // Optional: if null, we are adding a new booking
    rooms?: Room[]; // Passed so we can select rooms when adding manually
    onSave: (updatedBooking: Booking) => void;
}

const BookingEditModal: React.FC<BookingEditModalProps> = ({ isOpen, onClose, booking, rooms = [], onSave }) => {
    const [formData, setFormData] = useState<Booking | null>(null);
    const [showProofModal, setShowProofModal] = useState(false);

    // Default state for new booking
    const defaultBooking: Booking = {
        id: '', // Will be generated
        roomId: rooms.length > 0 ? rooms[0].id : '1',
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
        status: 'pending',
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

    const handleCalculationUpdate = (updates: Partial<Booking>) => {
        const newData = { ...formData, ...updates };
        if (isNew) {
            const selectedRoom = rooms.find(r => r.id === newData.roomId) || rooms[0];
            if (selectedRoom && newData.checkIn && newData.checkOut) {
                try {
                    const start = new Date(newData.checkIn.split('T')[0]);
                    const end = new Date(newData.checkOut.split('T')[0]);
                    const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                    newData.totalPrice = nights * selectedRoom.price;
                } catch(e) {}
            }
        }
        setFormData(newData as Booking);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Enforce payment data integrity based on status
        let dataToSave = { ...formData };
        if (dataToSave.status === 'confirmed') {
            // Manually confirmed via status button → mark both payments as done
            dataToSave = { ...dataToSave, depositPaid: true, balancePaid: true };
        } else if (dataToSave.status === 'cancelled') {
            // Cancelled → clear payment flags
            dataToSave = { ...dataToSave, depositPaid: false, balancePaid: false };
        }
        onSave(dataToSave);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <style>{`
                @keyframes pulse-subtle {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.01); opacity: 0.95; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 4s infinite ease-in-out;
                }
            `}</style>
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
                                            onChange={e => handleCalculationUpdate({ checkIn: new Date(e.target.value).toISOString() })}
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
                                            onChange={e => handleCalculationUpdate({ checkOut: new Date(e.target.value).toISOString() })}
                                            className="w-full pl-10 pr-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Room</label>
                                <select
                                    value={formData.roomId}
                                    onChange={e => handleCalculationUpdate({ roomId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>{r.name} — ₱{r.price.toLocaleString()} / night</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Total Price (₱)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.totalPrice === 0 ? '' : formData.totalPrice}
                                        onChange={e => setFormData({ ...formData, totalPrice: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium whitespace-nowrap">
                                        Guests <span className="text-[9px] text-yellow-500 font-bold ml-1">(Max: {rooms.find(r => r.id === formData.roomId)?.capacity || 2})</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.guests}
                                        onChange={e => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
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

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-row gap-3">
                    {/* STAGE 1: New Request — deposit not yet paid → Decline + Accept Deposit side by side */}
                    {formData.status === 'pending' && !isNew && !formData.depositPaid ? (
                        <>
                            {/* Decline — compact, outlined, left side */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    const updated = { ...formData, status: 'cancelled' as const };
                                    onSave(updated);
                                    onClose();
                                }}
                                className="px-4 py-3 rounded-xl border-2 border-red-200 dark:border-red-900/50 text-red-500 font-bold uppercase tracking-widest text-[9px] hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                                <X size={14} /> Decline
                            </button>

                            {/* Accept (Dynamically Deposit vs Full) — dominant green, takes remaining space */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    const isFull = formData.paymentType === 'full' || !formData.balanceAmount || formData.balanceAmount <= 0;
                                    const updated = {
                                        ...formData,
                                        status: 'confirmed' as const,
                                        depositPaid: true,
                                        depositPaidAt: new Date().toISOString(),
                                        ...(isFull ? { balancePaid: true } : {})
                                    };
                                    onSave(updated);
                                    onClose();
                                }}
                                className="flex-1 px-5 py-3 rounded-xl bg-emerald-500 text-white font-bold uppercase tracking-widest text-[9px] hover:bg-emerald-600 active:scale-95 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                            >
                                <CheckCircle size={14} /> {(formData.paymentType === 'full' || !formData.balanceAmount || formData.balanceAmount <= 0) ? 'Accept Booking' : 'Accept Deposit'}
                            </button>
                        </>
                    ) : formData.status === 'confirmed' && !isNew && formData.depositPaid && !formData.balancePaid ? (
                        /* STAGE 2: Awaiting Balance — deposit paid, balance not yet → Confirm Full Payment ONLY */
                        <div className="flex flex-col w-full gap-2">
                            <div className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200 text-[10px] sm:text-xs flex items-center justify-center font-bold text-center">
                                ⏳ Awaiting Payment — Mark as paid when guest sends proof of payment
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    const updated = {
                                        ...formData,
                                        status: 'confirmed' as const,
                                        depositPaid: true,
                                        balancePaid: true,
                                        depositPaidAt: formData.depositPaidAt || new Date().toISOString()
                                    };
                                    onSave(updated);
                                    onClose();
                                }}
                                className="w-full px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold uppercase tracking-widest text-[9px] hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Confirm Full Payment
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-between gap-3 w-full">
                            {isNew ? (
                                <>
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md transition-all flex items-center"
                                    >
                                        <Plus size={18} className="mr-2" /> Create Booking
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const updated = { ...formData, status: 'cancelled' as const };
                                            onSave(updated);
                                            onClose();
                                        }}
                                        className="flex-1 px-4 py-3 rounded-xl border-2 border-red-200 dark:border-red-900/50 text-red-500 font-bold uppercase tracking-widest text-xs hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center justify-center gap-2 outline-none focus:ring-4 focus:ring-red-500/20"
                                    >
                                        <X size={18} /> Decline
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const updated = { ...formData, status: 'confirmed' as const };
                                            if (updated.status === 'confirmed') {
                                                updated.depositPaid = true;
                                                updated.balancePaid = true;
                                            }
                                            onSave(updated);
                                            onClose();
                                        }}
                                        className="flex-1 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold uppercase tracking-widest text-xs hover:bg-emerald-700 shadow-md transition-all flex items-center justify-center gap-2 outline-none focus:ring-4 focus:ring-emerald-500/20"
                                    >
                                        <CheckCircle size={18} /> Accept
                                    </button>
                                </>
                            )}
                        </div>
                    )}
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
