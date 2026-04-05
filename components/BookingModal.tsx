import React, { useState, useEffect } from 'react';
import { Room, Booking, Settings } from '../types';
import {
    X, Wifi, Wind, Coffee, CheckCircle, Waves, ChefHat, Car, Dumbbell, Tv, Shield, Sparkles,
    Utensils, Monitor, Zap, Sun, Umbrella, Music, Briefcase, Key, Bell, Bath, Armchair, Bike,
    ChevronLeft, ChevronRight, AlertCircle, Maximize2, Phone, Users, Printer, Download, Star,
    Info, Grid, Image as ImageIcon, Loader, Clock, Copy
} from 'lucide-react';
import AvailabilityCalendar from './AvailabilityCalendar';
import { differenceInDays } from 'date-fns';
import { sendAdminNotificationEmail } from '../services/emailService';
import { compressImageToBase64 } from '../utils/imageUtils';

interface BookingModalProps {
    room: Room | null;
    onClose: () => void;
    bookings: Booking[];
    onBook: (booking: Booking) => void;
    onUpdateBooking?: (booking: Booking) => Promise<void>; // Added for updating with proof
    initialGalleryOpen?: boolean;
    settings?: Settings;
    onOpenMyBookings?: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ room, onClose, bookings, onBook, onUpdateBooking, initialGalleryOpen = false, settings, onOpenMyBookings }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1=Details, 2=Payment, 3=Success
    const [selectedStart, setSelectedStart] = useState<Date | null>(null);
    const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
    const [guestName, setGuestName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [estimatedArrival, setEstimatedArrival] = useState<string>('14:00');
    const [estimatedDeparture, setEstimatedDeparture] = useState<string>('11:00');
    const [guestCount, setGuestCount] = useState<number>(1);
    const [newBookingId, setNewBookingId] = useState<string>('');
    const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [isImageExpanded, setIsImageExpanded] = useState(initialGalleryOpen);
    const [showGalleryInfo, setShowGalleryInfo] = useState(true);

    // Upload State
    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [paymentChoice, setPaymentChoice] = useState<'deposit' | 'full'>('deposit');
    const [zoomedQr, setZoomedQr] = useState<string | null>(null);
    const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedNumber(text);
        setTimeout(() => setCopiedNumber(null), 2000);
    };

    const handleDownloadQr = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error("Failed to download image", e);
            // Fallback for cross-origin images
            const link = document.createElement('a');
            link.href = url;
            link.target = "_blank";
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Error State
    const [errors, setErrors] = useState<{ name?: string, email?: string, phone?: string, guests?: string, date?: string }>({});

    const [currentImgIndex, setCurrentImgIndex] = useState(0);

    useEffect(() => {
        if (room) {
            setStep(1);
            setSelectedStart(null);
            setSelectedEnd(null);
            setGuestName('');
            setEmail('');
            setPhoneNumber('');
            setEstimatedArrival('14:00');
            setEstimatedDeparture('11:00');
            setGuestCount(1);
            setErrors({});
            setIsProcessing(false);
            setCurrentImgIndex(0);
            setIsImageExpanded(initialGalleryOpen);
            setShowGalleryInfo(true);
            setNewBookingId('');
            setPaymentProofFile(null);
            setUploadSuccess(false);
            setUploading(false);
            setCreatedBooking(null);
            setPaymentChoice('deposit');
            setZoomedQr(null);
        }
    }, [room, initialGalleryOpen]);

    useEffect(() => {
        if (!paymentProofFile) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(paymentProofFile);
        setPreviewUrl(url);
        // Clean up memory
        return () => URL.revokeObjectURL(url);
    }, [paymentProofFile]);

    if (!room) return null;

    // Combine main image and gallery images, filtering out empty ones
    const allImages = [room.image, ...(room.images || [])].filter(img => img && img.trim().length > 0);

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImgIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImgIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    const nights = (selectedStart && selectedEnd) ? differenceInDays(selectedEnd, selectedStart) : 0;
    
    let billableNights = nights;
    let totalPrice = 0;
    
    if (nights === 0 && selectedStart && selectedEnd) {
        // Automatically a Day Use stay if start and end are the same day
        const baseDayPrice = room.dayUsePrice || room.price;
        billableNights = 0;
        totalPrice = baseDayPrice;
    } else {
        // Normal overnight calculation
        billableNights = Math.max(1, nights);
        totalPrice = billableNights * room.price;
    }

    // Calculate deposit for display (same logic as in confirmPayment)
    let displayDeposit = 0;
    if (room.depositAmount && room.depositAmount > 0) {
        displayDeposit = room.depositAmount;
    } else if (settings?.reservationPolicy?.requireDeposit) {
        if (settings.reservationPolicy.depositType === 'percentage') {
            displayDeposit = Math.round(totalPrice * (settings.reservationPolicy.depositPercentage / 100));
        } else if (settings.reservationPolicy.depositType === 'fixed') {
            displayDeposit = settings.reservationPolicy.fixedDepositAmount || 0;
        }
    }
    displayDeposit = Math.min(displayDeposit, totalPrice);
    const displayBalance = totalPrice - displayDeposit;

    const handleDateSelect = (start: Date | null, end: Date | null) => {
        setSelectedStart(start);
        setSelectedEnd(end);
        if (start && end && errors.date) {
            setErrors({ ...errors, date: undefined });
        }
    };

    const handleContinue = () => {
        const newErrors: { name?: string, email?: string, phone?: string, guests?: string, date?: string } = {};

        if (!selectedStart || !selectedEnd) {
            newErrors.date = "Please select dates first.";
        }

        if (!guestName.trim()) {
            newErrors.name = "Full name is required.";
        }

        if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
            newErrors.email = "Valid email is required.";
        }

        if (!phoneNumber.trim()) {
            newErrors.phone = "Phone number is required.";
        }

        if (guestCount < 1) {
            newErrors.guests = "At least 1 guest required.";
        } else if (guestCount > room.capacity) {
            newErrors.guests = `Max capacity is ${room.capacity}.`;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Auto-scroll to the first error field so PC users can see what's wrong
            setTimeout(() => {
                const firstError = document.querySelector('[data-error="true"]');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);
            return;
        }

        setErrors({});
        // Immediately start preparing the booking data
        confirmPayment();
        setStep(2);
    };

    const confirmPayment = () => {
        setIsProcessing(true);
        const id = crypto.randomUUID();

        // Format dates using local timezone (not UTC!)
        const formatLocalDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Calculate deposit amount
        // Priority: 1) Room-specific depositAmount, 2) Global settings, 3) No deposit
        let calculatedDeposit = 0;

        if (room.depositAmount && room.depositAmount > 0) {
            // Use room-specific fixed deposit amount
            calculatedDeposit = room.depositAmount;
        } else if (settings?.reservationPolicy?.requireDeposit) {
            // Use global deposit settings
            if (settings.reservationPolicy.depositType === 'percentage') {
                calculatedDeposit = Math.round(totalPrice * (settings.reservationPolicy.depositPercentage / 100));
            } else if (settings.reservationPolicy.depositType === 'fixed') {
                calculatedDeposit = settings.reservationPolicy.fixedDepositAmount || 0;
            }
        }

        // Ensure deposit doesn't exceed total price
        calculatedDeposit = Math.min(calculatedDeposit, totalPrice);
        const calculatedBalance = totalPrice - calculatedDeposit;

        // Adjust based on payment choice
        const finalDeposit = paymentChoice === 'full' ? totalPrice : calculatedDeposit;
        const finalBalance = paymentChoice === 'full' ? 0 : calculatedBalance;

        setTimeout(() => {
            const newBooking: Booking = {
                id: id,
                roomId: room.id,
                guestName,
                email,
                phoneNumber,
                guests: guestCount,
                checkIn: formatLocalDate(selectedStart!),
                checkOut: formatLocalDate(selectedEnd!),
                totalPrice,
                status: 'pending',
                estimatedArrival,
                estimatedDeparture,
                bookedAt: formatLocalDate(new Date()),
                nights: billableNights,
                // Deposit tracking
                depositAmount: finalDeposit > 0 ? finalDeposit : undefined,
                balanceAmount: finalDeposit > 0 ? finalBalance : undefined,
                depositPaid: false,
                paymentType: calculatedDeposit > 0 ? paymentChoice : undefined
            };
            
            setNewBookingId(id);
            setCreatedBooking(newBooking); // Store locally for final submission
            setIsProcessing(false);
            // We NO LONGER call onBook here. 
            // We just proceed to the payment instructions step.
        }, 1000);
    };

    const handleCompleteBooking = async () => {
        if (!paymentProofFile || !createdBooking) {
            alert("Please upload your payment proof first.");
            return;
        }

        // Check file size (max 5MB before compression for safety)
        if (paymentProofFile.size > 5 * 1024 * 1024) {
            alert("File is too large. Please upload an image smaller than 5MB.");
            return;
        }

        setIsProcessing(true);
        setUploading(true);

        try {
            // 1. Compress and convert to Base64
            const base64Image = await compressImageToBase64(paymentProofFile, 800, 0.7);

            const finalDepositAmount = paymentChoice === 'full' ? totalPrice : displayDeposit;
            const finalBalanceAmount = paymentChoice === 'full' ? 0 : displayBalance;

            // 2. Prepare full booking with proof, embedding the final payment choices
            const fullBooking: Booking = {
                ...createdBooking,
                depositAmount: finalDepositAmount > 0 ? finalDepositAmount : undefined,
                balanceAmount: finalDepositAmount > 0 ? finalBalanceAmount : undefined,
                paymentType: displayDeposit > 0 ? paymentChoice : undefined,
                paymentProof: base64Image
            };

            // 3. Save to database for the first time
            await onBook(fullBooking);
            
            // 4. Send email notifications (Admin only for now)
            if (settings) {
                if (settings.notifications?.sendAdminAlert && settings.notifications?.adminEmail) {
                    sendAdminNotificationEmail(fullBooking, room, settings);
                }
            }

            setUploadSuccess(true);
            setStep(3); // Success step
        } catch (error: any) {
            console.error("Error creating booking with proof:", error);
            alert(error.message || "Failed to submit booking. Please try again.");
        } finally {
            setIsProcessing(false);
            setUploading(false);
        }
    };

    const iconMap: Record<string, React.ReactNode> = {
        'wifi': <Wifi size={18} className="mr-2 text-primary" />,
        'waves': <Waves size={18} className="mr-2 text-blue-500" />,
        'wind': <Wind size={18} className="mr-2 text-blue-300" />,
        'chef-hat': <ChefHat size={18} className="mr-2 text-orange-400" />,
        'coffee': <Coffee size={18} className="mr-2 text-brown-500" />,
        'car': <Car size={18} className="mr-2 text-gray-500" />,
        'dumbbell': <Dumbbell size={18} className="mr-2 text-gray-600" />,
        'tv': <Tv size={18} className="mr-2 text-gray-800" />,
        'shield': <Shield size={18} className="mr-2 text-blue-900" />,
        'sparkles': <Sparkles size={18} className="mr-2 text-yellow-400" />,
        'utensils': <Utensils size={18} className="mr-2 text-gray-600" />,
        'monitor': <Monitor size={18} className="mr-2 text-indigo-500" />,
        'zap': <Zap size={18} className="mr-2 text-yellow-500" />,
        'sun': <Sun size={18} className="mr-2 text-orange-500" />,
        'umbrella': <Umbrella size={18} className="mr-2 text-purple-500" />,
        'music': <Music size={18} className="mr-2 text-pink-500" />,
        'briefcase': <Briefcase size={18} className="mr-2 text-brown-700" />,
        'key': <Key size={18} className="mr-2 text-yellow-600" />,
        'bell': <Bell size={18} className="mr-2 text-red-400" />,
        'bath': <Bath size={18} className="mr-2 text-blue-400" />,
        'armchair': <Armchair size={18} className="mr-2 text-green-600" />,
        'bike': <Bike size={18} className="mr-2 text-teal-600" />
    };

    const renderIcons = (amenity: { name: string; icon: string }, customClass?: string) => {
        if (iconMap[amenity.icon]) return React.cloneElement(iconMap[amenity.icon] as React.ReactElement<any>, { className: customClass || "mr-2 text-primary" });
        return <Sparkles className={customClass || "mr-2 text-yellow-400"} size={18} />;
    };

    // Lock body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto custom-scrollbar" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity backdrop-blur-sm"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-middle bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-4 sm:mb-8 sm:max-w-5xl sm:w-full animate-pop w-full max-w-full">
                    <div className="absolute top-4 right-4 z-20">
                        <button onClick={onClose} className="bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 rounded-full p-2 text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors shadow-sm">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:max-h-[90vh] overflow-y-auto lg:overflow-hidden">

                        {/* Left Side: Image Carousel & Details (Hidden on Step 3 Success) */}
                        {step !== 3 && (
                            <div className="w-full lg:w-5/12 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700">
                                <div
                                    className="relative h-48 md:h-64 lg:h-72 group bg-gray-200 cursor-zoom-in overflow-hidden"
                                    onClick={() => setIsImageExpanded(true)}
                                >
                                    <img
                                        src={allImages[currentImgIndex]}
                                        alt={room.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4 z-10">
                                        <h2 className="text-xl md:text-2xl font-serif font-bold text-white flex items-center">
                                            {room.name}
                                            <Maximize2 size={16} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-white/80" />
                                        </h2>
                                    </div>

                                    {/* Carousel Controls */}
                                    {allImages.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all duration-200 z-20 opacity-0 group-hover:opacity-100"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all duration-200 z-20 opacity-0 group-hover:opacity-100"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                            {/* Dots */}
                                            <div className="absolute bottom-3 right-4 z-20 flex space-x-1.5">
                                                {allImages.map((_, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === currentImgIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="p-4 md:p-6 space-y-6 block">
                                    <div>
                                        <h3 className="text-sm uppercase font-bold text-gray-400 dark:text-gray-500 mb-2">Description</h3>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{room.description}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm uppercase font-bold text-gray-400 dark:text-gray-500 mb-2">Amenities</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {room.amenities.map((a, i) => (
                                                <div key={i} className="flex items-center text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 p-2 rounded border border-gray-100 dark:border-gray-600 shadow-sm">
                                                    {renderIcons(a)} {a.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Right Side: Interaction Area */}
                        <div className={`${step === 3 ? 'w-full' : 'w-full lg:w-7/12'} p-4 md:p-6 flex flex-col bg-white dark:bg-gray-800 overflow-y-auto`}>

                            {/* Progress Steps (Hide on success) */}
                            {step !== 3 && (
                                <div className="flex items-center mb-6 justify-center">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>1</div>
                                    <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>2</div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="flex flex-col h-full animate-slide-in-right">
                                    <h3 className="text-xl md:text-2xl font-serif font-bold text-secondary dark:text-white mb-2 flex-shrink-0">Check Availability</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 flex-shrink-0">Select your check-in and check-out dates to see pricing.</p>

                                    {/* Scrollable Content Area */}
                                    <div className="flex-1 overflow-y-auto pr-0 md:pr-2 custom-scrollbar min-h-0">
                                        <AvailabilityCalendar
                                            roomId={room.id}
                                            bookings={bookings}
                                            onDateSelect={handleDateSelect}
                                            allowDayUse={room.dayUsePrice !== undefined && room.dayUsePrice > 0}
                                        />

                                        <div className="space-y-4 mt-6 pb-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div data-error={!!errors.name}>
                                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Full Name</label>
                                                    <input
                                                        type="text"
                                                        className={`w-full bg-gray-50 dark:bg-gray-700 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow outline-none dark:text-white ${errors.name ? 'border-red-400 bg-red-50 dark:bg-red-900/30' : 'border-gray-200 dark:border-gray-600'}`}
                                                        placeholder="e.g. Juan Dela Cruz"
                                                        value={guestName}
                                                        onChange={(e) => {
                                                            setGuestName(e.target.value);
                                                            if (errors.name) setErrors({ ...errors, name: undefined });
                                                        }}
                                                    />
                                                    {errors.name && <div className="flex items-center text-red-500 text-xs mt-1"><AlertCircle size={10} className="mr-1" /> {errors.name}</div>}
                                                </div>
                                                <div data-error={!!errors.email}>
                                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Email Address</label>
                                                    <input
                                                        type="email"
                                                        className={`w-full bg-gray-50 dark:bg-gray-700 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow outline-none dark:text-white ${errors.email ? 'border-red-400 bg-red-50 dark:bg-red-900/30' : 'border-gray-200 dark:border-gray-600'}`}
                                                        placeholder="e.g. juan@email.com"
                                                        value={email}
                                                        onChange={(e) => {
                                                            setEmail(e.target.value);
                                                            if (errors.email) setErrors({ ...errors, email: undefined });
                                                        }}
                                                    />
                                                    {errors.email && <div className="flex items-center text-red-500 text-xs mt-1"><AlertCircle size={10} className="mr-1" /> {errors.email}</div>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Phone Number</label>
                                                    <div className="relative">
                                                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="tel"
                                                            className={`w-full bg-gray-50 dark:bg-gray-700 border rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow outline-none dark:text-white ${errors.phone ? 'border-red-400 bg-red-50 dark:bg-red-900/30' : 'border-gray-200 dark:border-gray-600'}`}
                                                            placeholder="e.g. 0912 345 6789"
                                                            value={phoneNumber}
                                                            onChange={(e) => {
                                                                setPhoneNumber(e.target.value);
                                                                if (errors.phone) setErrors({ ...errors, phone: undefined });
                                                            }}
                                                        />
                                                    </div>
                                                    {errors.phone && <div className="flex items-center text-red-500 text-xs mt-1"><AlertCircle size={10} className="mr-1" /> {errors.phone}</div>}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Guests</label>
                                                    <div className="relative">
                                                        <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={room.capacity}
                                                            className={`w-full bg-gray-50 dark:bg-gray-700 border rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow outline-none dark:text-white ${errors.guests ? 'border-red-400 bg-red-50 dark:bg-red-900/30' : 'border-gray-200 dark:border-gray-600'}`}
                                                            value={guestCount}
                                                            onChange={(e) => {
                                                                setGuestCount(parseInt(e.target.value));
                                                                if (errors.guests) setErrors({ ...errors, guests: undefined });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1 text-right">Max: {room.capacity} Guests</div>
                                                    {errors.guests && <div className="flex items-center text-red-500 text-xs mt-0.5"><AlertCircle size={10} className="mr-1" /> {errors.guests}</div>}
                                                </div>
                                            </div>

                                            {/* Check-in / Check-out Time Selection */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Check-in Time</label>
                                                    <div className="relative">
                                                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="time"
                                                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow outline-none dark:text-white"
                                                            value={estimatedArrival}
                                                            onChange={(e) => setEstimatedArrival(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Check-out Time</label>
                                                    <div className="relative">
                                                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="time"
                                                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow outline-none dark:text-white"
                                                            value={estimatedDeparture}
                                                            onChange={(e) => setEstimatedDeparture(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sticky Footer - Always Visible */}
                                    <div className="sticky bottom-0 border-t border-gray-100 dark:border-gray-700 pt-4 mt-2 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 z-10 shadow-[0_-8px_16px_-6px_rgba(0,0,0,0.08)]">
                                        <div className="text-center sm:text-left">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Total Price</p>
                                            <div className="text-2xl md:text-3xl font-bold text-secondary dark:text-white">
                                                {selectedStart && selectedEnd ? (
                                                    <>₱{totalPrice.toLocaleString()} <span className="text-sm font-normal text-gray-400">for {nights === 0 ? 'Day Use' : `${billableNights} night${billableNights > 1 ? 's' : ''}`}</span></>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500 text-base font-normal">Select dates to see price</span>
                                                )}
                                            </div>
                                            {errors.date && <p className="text-red-500 text-sm mt-2 animate-fade-in flex items-center justify-center sm:justify-start"><AlertCircle size={14} className="mr-1" /> {errors.date}</p>}
                                        </div>
                                        <button
                                            onClick={handleContinue}
                                            className="w-full sm:w-auto bg-secondary text-white px-8 py-3 rounded-full font-bold hover:bg-primary transition-all transform hover:scale-105 shadow-lg"
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="flex flex-col animate-slide-in-right">
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-serif font-bold text-secondary dark:text-white mb-6">Payment Details</h3>

                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 p-4 md:p-6 rounded-xl mb-6 border border-blue-100 dark:border-gray-600 shadow-inner">
                                            <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center"><CheckCircle size={18} className="mr-2" /> Booking Summary</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between text-blue-800/80 dark:text-gray-300 border-b border-blue-200/50 dark:border-gray-600 pb-2">
                                                    <span>Guest</span>
                                                    <span className="font-semibold">{guestName}</span>
                                                </div>
                                                <div className="flex justify-between text-blue-800/80 border-b border-blue-200/50 pb-2">
                                                    <span>Contact</span>
                                                    <span className="font-semibold text-xs">{email} <br /> {phoneNumber}</span>
                                                </div>
                                                <div className="flex justify-between text-blue-800/80 border-b border-blue-200/50 pb-2">
                                                    <span>Room & Guests</span>
                                                    <span className="font-semibold">{room.name} ({guestCount} pax)</span>
                                                </div>
                                                <div className="flex justify-between text-blue-800/80 border-b border-blue-200/50 pb-2">
                                                    <span>Dates</span>
                                                    <span className="font-semibold text-right">
                                                        {selectedStart?.toLocaleDateString()} {nights > 0 && selectedEnd ? `- ${selectedEnd.toLocaleDateString()}` : ''}
                                                        <br />
                                                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                                                            Time: {estimatedArrival} - {estimatedDeparture}
                                                        </span>
                                                    </span>
                                                </div>
                                                {/* Deposit breakdown if applicable */}
                                                {displayDeposit > 0 ? (
                                                    <>
                                                        <div className="flex justify-between text-blue-800/80 border-b border-blue-200/50 pb-2">
                                                            <span>Room Total</span>
                                                            <span className="font-semibold">₱{totalPrice.toLocaleString()}</span>
                                                        </div>

                                                        {/* Payment Choice Toggle */}
                                                        <div className="bg-white dark:bg-gray-800 -mx-4 md:-mx-6 px-4 md:px-6 py-3 border-b border-blue-200/50">
                                                            <p className="text-xs text-gray-500 mb-2 font-medium">Choose Payment Option:</p>
                                                            <div className="flex flex-col gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPaymentChoice('deposit')}
                                                                    className={`py-3 px-4 rounded-lg text-left font-bold transition-all border-2 ${paymentChoice === 'deposit'
                                                                        ? 'border-green-500 bg-green-50 text-green-700'
                                                                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                                                                        }`}
                                                                >
                                                                    <div className="flex justify-between items-center">
                                                                        <span>💰 Pay Deposit Only</span>
                                                                        <span className="text-lg">₱{displayDeposit.toLocaleString()}</span>
                                                                    </div>
                                                                    <p className="text-xs font-normal mt-1 opacity-70">Pay remaining ₱{displayBalance.toLocaleString()} on arrival</p>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPaymentChoice('full')}
                                                                    className={`py-3 px-4 rounded-lg text-left font-bold transition-all border-2 ${paymentChoice === 'full'
                                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                                                                        }`}
                                                                >
                                                                    <div className="flex justify-between items-center">
                                                                        <span>✅ Pay Full Amount</span>
                                                                        <span className="text-lg">₱{totalPrice.toLocaleString()}</span>
                                                                    </div>
                                                                    <p className="text-xs font-normal mt-1 opacity-70">No balance due on arrival</p>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Payment Prompt Message */}
                                                        <div className={`py-3 -mx-4 md:-mx-6 px-4 md:px-6 text-center ${paymentChoice === 'full' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                                            <p className={`text-lg font-bold ${paymentChoice === 'full' ? 'text-blue-800' : 'text-green-800'}`}>
                                                                {paymentChoice === 'full'
                                                                    ? `💳 Please send ₱${totalPrice.toLocaleString()}`
                                                                    : `💰 Please send ₱${displayDeposit.toLocaleString()} deposit`}
                                                            </p>
                                                            {paymentChoice === 'deposit' && (
                                                                <p className="text-sm text-green-700 mt-1">
                                                                    Balance of ₱{displayBalance.toLocaleString()} due upon arrival
                                                                </p>
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex justify-between text-blue-900 dark:text-white pt-2 text-lg font-bold">
                                                        <span>Total Due</span>
                                                        <span>₱{totalPrice.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Payment Instructions */}
                                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
                                            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center text-sm">
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                Scan QR to Pay
                                            </h4>
                                            <p className="text-blue-600 dark:text-blue-400 text-xs mb-4">Scan the QR code below with your payment app. After payment, send the screenshot to our Messenger to confirm your booking.</p>

                                            {settings?.paymentMethods && (settings.paymentMethods.gcash?.enabled || settings.paymentMethods.bankTransfer?.enabled) ? (
                                                <div className="flex gap-6 justify-center flex-wrap">
                                                    {settings.paymentMethods.gcash?.enabled && settings.paymentMethods.gcash.qrImage && (
                                                        <div className="text-center">
                                                            <div className="relative mx-auto w-36 mb-2">
                                                                <div className="relative group h-36 cursor-zoom-in" onClick={() => setZoomedQr(settings.paymentMethods!.gcash!.qrImage)}>
                                                                    <img src={settings.paymentMethods.gcash.qrImage} alt="GCash QR" className="w-full h-full object-contain border-2 border-blue-200 rounded-xl bg-white" />
                                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                                                        <Maximize2 className="text-white" size={24} />
                                                                    </div>
                                                                </div>
                                                                <button 
                                                                    onClick={() => handleDownloadQr(settings.paymentMethods!.gcash!.qrImage!, 'gcash-qr.png')}
                                                                    className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 py-1.5 rounded-lg transition-colors"
                                                                >
                                                                    <Download size={12} /> Download QR
                                                                </button>
                                                            </div>
                                                            <div className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full inline-block mt-1">
                                                                {settings.paymentMethods.gcash.label || 'E-Wallet'}
                                                            </div>
                                                            {settings.paymentMethods.gcash.accountName && (
                                                                <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">{settings.paymentMethods.gcash.accountName}</p>
                                                            )}
                                                            {settings.paymentMethods.gcash.accountNumber && (
                                                                <div className="flex items-center justify-center gap-2 mt-1">
                                                                    <p className="text-xs text-blue-600 dark:text-blue-500 font-mono bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">{settings.paymentMethods.gcash.accountNumber}</p>
                                                                    <button 
                                                                        onClick={() => handleCopy(settings.paymentMethods!.gcash!.accountNumber!)}
                                                                        className="text-blue-500 hover:text-blue-700 transition-colors bg-white hover:bg-blue-50 rounded p-1 shadow-sm border border-blue-100"
                                                                        title="Copy Account Number"
                                                                    >
                                                                        {copiedNumber === settings.paymentMethods.gcash.accountNumber ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {settings.paymentMethods.bankTransfer?.enabled && settings.paymentMethods.bankTransfer.qrImage && (
                                                        <div className="text-center">
                                                            <div className="relative mx-auto w-36 mb-2">
                                                                <div className="relative group h-36 cursor-zoom-in" onClick={() => setZoomedQr(settings.paymentMethods!.bankTransfer!.qrImage)}>
                                                                    <img src={settings.paymentMethods.bankTransfer.qrImage} alt="Bank QR" className="w-full h-full object-contain border-2 border-green-200 rounded-xl bg-white" />
                                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                                                        <Maximize2 className="text-white" size={24} />
                                                                    </div>
                                                                </div>
                                                                <button 
                                                                    onClick={() => handleDownloadQr(settings.paymentMethods!.bankTransfer!.qrImage!, 'bank-qr.png')}
                                                                    className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 hover:bg-green-200 py-1.5 rounded-lg transition-colors"
                                                                >
                                                                    <Download size={12} /> Download QR
                                                                </button>
                                                            </div>
                                                            <div className="bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full inline-block mt-1">
                                                                {settings.paymentMethods.bankTransfer.label || settings.paymentMethods.bankTransfer.bankName || 'Bank Transfer'}
                                                            </div>
                                                            {settings.paymentMethods.bankTransfer.accountName && (
                                                                <p className="text-xs text-green-700 dark:text-green-400 mt-2">{settings.paymentMethods.bankTransfer.accountName}</p>
                                                            )}
                                                            {settings.paymentMethods.bankTransfer.accountNumber && (
                                                                <div className="flex items-center justify-center gap-2 mt-1">
                                                                    <p className="text-xs text-green-700 dark:text-green-500 font-mono bg-green-50 dark:bg-green-900/40 px-2 py-0.5 rounded">{settings.paymentMethods.bankTransfer.accountNumber}</p>
                                                                    <button 
                                                                        onClick={() => handleCopy(settings.paymentMethods!.bankTransfer!.accountNumber!)}
                                                                        className="text-green-600 hover:text-green-700 transition-colors bg-white hover:bg-green-50 rounded p-1 shadow-sm border border-green-100"
                                                                        title="Copy Account Number"
                                                                    >
                                                                        {copiedNumber === settings.paymentMethods.bankTransfer.accountNumber ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">Payment methods not configured. Please contact us directly.</p>
                                            )}
                                        </div>
                                            <div className="mt-8 flex flex-col sm:flex-row items-center sm:items-stretch gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="w-full sm:w-auto px-8 py-3 rounded-full font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-gray-100 dark:border-gray-700"
                                        >
                                            Back
                                        </button>
                                        <div className="flex-[2] flex flex-col gap-3">
                                            {/* Final Proof Upload at the end of Step 2 */}
                                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-[10px] font-black uppercase text-primary">Upload Payment Screenshot</label>
                                                    {paymentProofFile && (
                                                        <button 
                                                            onClick={() => setPaymentProofFile(null)}
                                                            className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors flex items-center"
                                                        >
                                                            <X size={10} className="mr-1" /> Remove
                                                        </button>
                                                    )}
                                                </div>

                                                {previewUrl ? (
                                                    <div className="relative group rounded-lg overflow-hidden border border-primary/20 bg-white">
                                                        <div 
                                                            className="cursor-zoom-in group-relative"
                                                            onClick={() => setZoomedQr(previewUrl)}
                                                        >
                                                            <img src={previewUrl} alt="Payment Proof Preview" className="w-full h-32 object-cover" />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                                <Maximize2 className="text-white" size={20} />
                                                            </div>
                                                        </div>
                                                        <div className="absolute bottom-2 right-2 flex gap-2">
                                                            <label 
                                                                htmlFor="payment-upload" 
                                                                className="cursor-pointer bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/30 hover:bg-black/80 transition-all shadow-lg"
                                                            >
                                                                Change Image
                                                            </label>
                                                        </div>
                                                        <input
                                                            id="payment-upload"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    setPaymentProofFile(e.target.files[0]);
                                                                }
                                                            }}
                                                            className="hidden"
                                                        />
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                setPaymentProofFile(e.target.files[0]);
                                                            }
                                                        }}
                                                        className="w-full text-xs text-gray-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-primary file:text-white hover:file:bg-primary/80 transition-all cursor-pointer"
                                                    />
                                                )}
                                            </div>
                                            <button
                                                onClick={handleCompleteBooking}
                                                disabled={isProcessing || !paymentProofFile}
                                                className="w-full bg-green-600 text-white py-3 rounded-full font-bold hover:bg-green-700 transition transform hover:scale-105 shadow-lg flex justify-center items-center disabled:opacity-50 disabled:scale-100"
                                            >
                                                {isProcessing ? (
                                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : 'Submit Proof & Book Now'}
                                            </button>
                                        </div>
                                    </div>
                     </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="flex flex-col items-center justify-center h-full animate-pop text-center px-4">
                                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle className="text-green-600 w-12 h-12" />
                                    </div>
                                    <h3 className="text-3xl font-serif font-bold text-secondary mb-2">Request Submitted!</h3>
                                    <p className="text-gray-500 max-w-md mb-8">
                                        Thank you, {guestName}! Your reservation request for {room.name} has been received. We will review it shortly and send a confirmation email to {email}.
                                    </p>

                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 w-full max-w-md mb-8 text-left space-y-3">
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-3">What Happens Next?</p>

                                        <div className="flex items-start gap-3">
                                            <span className="text-xl leading-none">✅</span>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">We received your payment proof</p>
                                                <p className="text-xs text-gray-500">Your screenshot has been attached to your reservation.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <span className="text-xl leading-none">🔍</span>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">Track your booking anytime</p>
                                                <p className="text-xs text-gray-500">You can view your booking status under{' '}
                                                    <button
                                                        onClick={() => { onClose(); setTimeout(() => onOpenMyBookings?.(), 200); }}
                                                        className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer"
                                                    >
                                                        "Find My Booking"
                                                    </button>
                                                {' '}in the menu.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <span className="text-xl leading-none">📧</span>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">Confirmation goes to your email</p>
                                                <p className="text-xs text-gray-500 break-all">{email}</p>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 pt-3 mt-1">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500 text-xs mb-0.5">Check-in</p>
                                                    <p className="font-bold text-gray-800">{selectedStart?.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                    <p className="text-xs text-gray-400">@ {estimatedArrival}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs mb-0.5">Check-out</p>
                                                    <p className="font-bold text-gray-800">{selectedEnd?.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                    <p className="text-xs text-gray-400">@ {estimatedDeparture}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Methods Section */}
                                    {false && settings?.paymentMethods && (settings.paymentMethods.gcash?.enabled || settings.paymentMethods.bankTransfer?.enabled) && (
                                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 w-full max-w-md mb-6">
                                            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center text-sm">
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                                Complete Your Payment
                                            </h4>
                                            <p className="text-blue-600 dark:text-blue-400 text-xs mb-4">Scan the QR code below to pay. After payment, send proof via Messenger.</p>

                                            <div className="flex gap-4 justify-center flex-wrap">
                                                {settings.paymentMethods.gcash?.enabled && settings.paymentMethods.gcash.qrImage && (
                                                    <div className="text-center">
                                                        <div className="relative mx-auto w-32 mb-2">
                                                            <div className="relative group h-32 cursor-zoom-in" onClick={() => setZoomedQr(settings.paymentMethods!.gcash!.qrImage)}>
                                                                <img src={settings.paymentMethods.gcash.qrImage} alt={`${settings.paymentMethods.gcash.label || 'E-Wallet'} QR`} className="w-full h-full object-contain border rounded-lg bg-white" />
                                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                                    <Maximize2 className="text-white" size={20} />
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleDownloadQr(settings.paymentMethods!.gcash!.qrImage!, 'gcash-qr.png')}
                                                                className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 py-1.5 rounded-lg transition-colors border border-blue-200"
                                                            >
                                                                <Download size={12} /> Download
                                                            </button>
                                                        </div>
                                                        <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mt-2">
                                                            {settings.paymentMethods.gcash.label || 'E-Wallet'}
                                                        </p>
                                                        {settings.paymentMethods.gcash.accountName && (
                                                            <p className="text-xs text-blue-600 dark:text-blue-400">{settings.paymentMethods.gcash.accountName}</p>
                                                        )}
                                                        {settings.paymentMethods.gcash.accountNumber && (
                                                            <div className="flex items-center justify-center gap-1 mt-1">
                                                                <p className="text-[10px] text-blue-600 dark:text-blue-500 font-mono bg-blue-50/50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">{settings.paymentMethods.gcash.accountNumber}</p>
                                                                <button 
                                                                    onClick={() => handleCopy(settings.paymentMethods!.gcash!.accountNumber!)}
                                                                    className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                                                                    title="Copy Account Number"
                                                                >
                                                                    {copiedNumber === settings.paymentMethods.gcash.accountNumber ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {settings.paymentMethods.bankTransfer?.enabled && settings.paymentMethods.bankTransfer.qrImage && (
                                                    <div className="text-center">
                                                        <div className="relative mx-auto w-32 mb-2">
                                                            <div className="relative group h-32 cursor-zoom-in" onClick={() => setZoomedQr(settings.paymentMethods!.bankTransfer!.qrImage)}>
                                                                <img src={settings.paymentMethods.bankTransfer.qrImage} alt="Bank QR" className="w-full h-full object-contain border rounded-lg bg-white" />
                                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                                    <Maximize2 className="text-white" size={20} />
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleDownloadQr(settings.paymentMethods!.bankTransfer!.qrImage!, 'bank-qr.png')}
                                                                className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 hover:bg-green-200 py-1.5 rounded-lg transition-colors border border-green-200"
                                                            >
                                                                <Download size={12} /> Download
                                                            </button>
                                                        </div>
                                                        <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mt-2">{settings.paymentMethods.bankTransfer.bankName || 'Bank Transfer'}</p>
                                                        {settings.paymentMethods.bankTransfer.accountName && (
                                                            <p className="text-xs text-blue-600 dark:text-blue-400">{settings.paymentMethods.bankTransfer.accountName}</p>
                                                        )}
                                                        {settings.paymentMethods.bankTransfer.accountNumber && (
                                                            <div className="flex items-center justify-center gap-1 mt-1">
                                                                <p className="text-[10px] text-green-700 dark:text-green-500 font-mono bg-green-50/50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">{settings.paymentMethods.bankTransfer.accountNumber}</p>
                                                                <button 
                                                                    onClick={() => handleCopy(settings.paymentMethods!.bankTransfer!.accountNumber!)}
                                                                    className="text-green-600 hover:text-green-700 transition-colors p-1"
                                                                    title="Copy Account Number"
                                                                >
                                                                    {copiedNumber === settings.paymentMethods.bankTransfer.accountNumber ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4 w-full max-w-md">
                                        <button onClick={() => alert("Downloading receipt...")} className="flex-1 flex items-center justify-center py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <Download size={18} className="mr-2" /> Receipt
                                        </button>
                                        <button onClick={onClose} className="flex-1 py-3 bg-secondary text-white rounded-lg font-bold hover:bg-primary transition-colors">
                                            Done
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-6 italic">You can find your booking later using the "Find My Booking" menu.</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Immersive Expanded Image Gallery */}
            {isImageExpanded && step !== 3 && (
                <div className="fixed inset-0 z-[70] bg-black text-white flex flex-col animate-fade-in">

                    {/* Toolbar */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent">
                        <div className="flex items-center space-x-4">
                            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-medium tracking-wide">
                                {currentImgIndex + 1} / {allImages.length}
                            </span>
                            <button
                                onClick={() => setShowGalleryInfo(!showGalleryInfo)}
                                className={`p-2 rounded-full transition-colors ${showGalleryInfo ? 'bg-white text-black' : 'bg-black/40 hover:bg-white/20 text-white'}`}
                                title={showGalleryInfo ? "Hide Info" : "Show Info"}
                            >
                                <Info size={20} />
                            </button>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="p-2 rounded-full bg-black/40 hover:bg-white/20 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Main Stage */}
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
                        <img
                            src={allImages[currentImgIndex]}
                            alt={`${room.name} - Full View`}
                            className="max-w-full max-h-full object-contain select-none shadow-2xl"
                        />

                        {/* Navigation Arrows */}
                        {allImages.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full hover:bg-white/10 transition-colors z-20 group"
                                >
                                    <ChevronLeft size={40} className="text-white/70 group-hover:text-white" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full hover:bg-white/10 transition-colors z-20 group"
                                >
                                    <ChevronRight size={40} className="text-white/70 group-hover:text-white" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Bottom Info Overlay */}
                    <div className={`relative z-40 bg-gradient-to-t from-black via-black/90 to-transparent pt-16 pb-6 px-6 transition-all duration-500 ${showGalleryInfo ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-6">

                            {/* Text Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">{room.name}</h2>
                                </div>
                                <p className="text-gray-300 max-w-2xl text-sm md:text-base line-clamp-2 mb-4">{room.description}</p>

                                {/* Quick Amenities */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {room.amenities.slice(0, 5).map((a, i) => (
                                        <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-200 border border-white/10">
                                            {renderIcons(a, "mr-1.5 text-white/70")} {a.name}
                                        </span>
                                    ))}
                                    {room.amenities.length > 5 && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-200 border border-white/10">
                                            +{room.amenities.length - 5} more
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Filmstrip & Action */}
                            <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                                <div className="flex gap-2 overflow-x-auto pb-2 max-w-[80vw] md:max-w-md scrollbar-hide">
                                    {allImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentImgIndex(idx)}
                                            className={`relative h-16 w-24 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${idx === currentImgIndex ? 'border-accent scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="text-right hidden md:block">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Price per night</p>
                                        <p className="text-2xl font-bold text-accent">₱{room.price.toLocaleString()}</p>
                                    </div>
                                    <button
                                        onClick={() => setIsImageExpanded(false)}
                                        className="flex-1 md:flex-none bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* Zoomed QR Code Overlay */}
            {zoomedQr && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-2 md:p-4"
                    onClick={() => setZoomedQr(null)}
                >
                    <div className="relative max-w-xl w-full max-h-[95vh] flex items-center justify-center animate-pop" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setZoomedQr(null)}
                            className="fixed top-6 right-6 p-4 text-white bg-black/60 hover:bg-black/80 rounded-full z-[110] backdrop-blur-md shadow-2xl transition-all active:scale-95"
                        >
                            <X size={28} />
                        </button>
                        <img
                            src={zoomedQr}
                            alt="Zoomed QR Code"
                            className="w-full max-h-[90vh] object-contain rounded-xl md:rounded-2xl bg-white shadow-2xl p-2 md:p-8"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingModal;