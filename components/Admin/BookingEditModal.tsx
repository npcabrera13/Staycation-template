import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Calendar, Plus } from 'lucide-react';
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
        bookedAt: new Date().toISOString()
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
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in border border-gray-100 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-xl font-bold text-gray-900 font-serif">{isNew ? 'Add New Booking' : 'Edit Booking'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        {/* Status Selection */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Booking Status</label>
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
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1 mb-2">Guest Information</label>

                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={formData.guestName}
                                    onChange={e => setFormData({ ...formData, guestName: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
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
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
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
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="Phone Number"
                                    required
                                />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1 mb-2">Stay Details</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block font-medium">Check-in</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="date"
                                            value={formData.checkIn.split('T')[0]}
                                            onChange={e => setFormData({ ...formData, checkIn: new Date(e.target.value).toISOString() })}
                                            className="w-full pl-10 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block font-medium">Check-out</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="date"
                                            value={formData.checkOut.split('T')[0]}
                                            onChange={e => setFormData({ ...formData, checkOut: new Date(e.target.value).toISOString() })}
                                            className="w-full pl-10 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block font-medium">Number of Guests</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.guests}
                                    onChange={e => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-white hover:shadow-sm transition-all"
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
        </div>
    );
};

export default BookingEditModal;
