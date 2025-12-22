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
}

export interface Settings {
  siteName: string;
  logo?: string;
  description: string;
  heroImage: string; // Kept for backward compatibility or general open graph use
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    image: string;
    images?: string[];
    slideInterval?: number;
    overlayOpacity: number;
    imagePosition: string;
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
    instagram: string;
    twitter: string;
    tiktok?: string;
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
  };
  theme: {
    primaryColor: string;
    primaryHoverColor?: string;
    secondaryColor: string;
  };
  paymentMethods?: {
    gcash?: {
      enabled: boolean;
      accountName?: string;
      accountNumber?: string;
      qrImage?: string;
    };
    bankTransfer?: {
      enabled: boolean;
      bankName?: string;
      accountName?: string;
      accountNumber?: string;
      qrImage?: string;
    };
    messengerLink?: string;
  };
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