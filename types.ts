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
  rating: number;
  reviews: number;
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

export interface ChartData {
  name: string;
  value: number;
}

export interface MonthlyStats {
  month: string;
  revenue: number;
  bookings: number;
}