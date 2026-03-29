export interface Amenity {
    name: string;
    icon: string;
}

export interface Room {
    id: string;
    name: string;
    description: string;
    price: number;
    capacity: number;
    image: string;
    images: string[];
    amenities: Amenity[];
    dayUsePrice?: number;
    depositAmount?: number; // Optional per-room fixed deposit amount (overrides global settings)
}

export interface Booking {
    id: string;
    roomId: string;
    guestName: string;
    email: string;
    phoneNumber: string;
    guests: number;
    checkIn: string; // ISO Date string
    checkOut: string; // ISO Date string
    totalPrice: number;
    status: 'confirmed' | 'pending' | 'cancelled';
    bookedAt: string;
    nights?: number;
    estimatedArrival?: string; // e.g. "14:00"
    estimatedDeparture?: string; // e.g. "11:00"
    // Deposit tracking
    depositAmount?: number;
    depositPaid?: boolean;
    depositPaidAt?: string;
    balanceAmount?: number;
    paymentType?: 'deposit' | 'full'; // Whether guest chose to pay deposit only or full amount
    paymentProof?: string; // URL to the uploaded receipt image
}

export interface Settings {
    siteName: string;
    logo?: string;
    description: string;
    heroImage: string; // Kept for backward compatibility or general open graph use
    hero: {
        tagline?: string;
        title: string;
        subtitle: string;
        ctaText: string;
        buttonColor?: string;
        buttonTextColor?: string;
        buttonFontFamily?: string;
        image: string;
        images?: string[];
        slideInterval?: number;
        overlayOpacity: number;
        imagePosition: string;
        imageFocusPoint?: 'top' | 'center' | 'bottom';
        mobileImage?: string;
        textShadow?: 'none' | 'sm' | 'lg';
    };
    features: {
        title: string;
        description: string;
        image: string;
    };
    about: {
        title: string;
        subtitle: string;
        features: Array<{
            title: string;
            description: string;
        }>;
        image: string;
        images?: string[]; // Gallery images for carousel
        imagePositions?: string[]; // CSS object-position for each image
        inheritGallery?: boolean; // Whether to pull photos from the admin rooms automatically
    };
    contact: {
        address: string;
        phone: string;
        email: string;
        title?: string;
        description?: string;
    };
    social: {
        facebook: string;
        showFacebook?: boolean;
        instagram: string;
        showInstagram?: boolean;
        x: string;
        showX?: boolean;
        tiktok?: string;
        showTiktok?: boolean;
        airbnb?: string;
        showAirbnb?: boolean;
        customUrl?: string;
        customLabel?: string;
        showCustom?: boolean;
    };
    map: {
        embedUrl: string;
    };
    roomsSection?: {
        title: string;
        subtitle?: string;
    };
    footer?: {
        copyrightText?: string;
        headerColor?: string;
        quickLinksText?: string;
        contactUsText?: string;
    };
    theme: {
        primaryColor: string;
        primaryHoverColor?: string;
        secondaryColor: string;
        accentColor?: string;
        fontFamily?: string;
    };
    paymentMethods?: {
        gcash?: {
            enabled: boolean;
            label?: string;
            accountName?: string;
            accountNumber?: string;
            qrImage?: string;
        };
        bankTransfer?: {
            enabled: boolean;
            label?: string;
            bankName?: string;
            accountName?: string;
            accountNumber?: string;
            qrImage?: string;
        };
    };
    // Reservation & Deposit Settings
    reservationPolicy?: {
        requireDeposit: boolean;
        depositType: 'percentage' | 'fixed';
        depositPercentage: number;  // 0-100
        fixedDepositAmount: number;
        autoConfirmOnDeposit: boolean;
        cancellationPolicy: string;
        paymentDeadlineHours: number;
    };
    // Email notification settings
    notifications?: {
        adminEmail: string;
        sendUserConfirmation: boolean;
        sendAdminAlert: boolean;
        sendCheckInReminder: boolean;
    };
    searchBar?: {
        buttonText?: string;
        buttonColor?: string;
        buttonTextColor?: string;
        buttonFontFamily?: string;
    };
    setupComplete?: boolean; // Tracks if the admin has completed initial setup
}

export interface ChartData {
    name: string;
    value: number;
}

export interface MonthlyStats {
    month: string;
    revenue: number;
    bookings: number;
}