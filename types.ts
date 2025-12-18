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
  description: string;
  heroImage: string; // Kept for backward compatibility or general open graph use
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    image: string;
  };
  features: {
    title: string;
    description: string;
    image: string;
  };
  map: {
    embedUrl: string;
    address: string;
  };
  contact: {
    address: string;
    phone: string;
    email: string;
    socials: {
      facebook: string;
      instagram: string;
    }
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
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