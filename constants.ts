import { Room, Booking } from './types';

export const MOCK_ROOMS: Room[] = [
  {
    id: '1',
    name: 'The Seaside Villa',
    description: 'A luxurious beachfront property with panoramic ocean views, private infinity pool, and direct beach access. Perfect for sunset lovers.',
    price: 15000,
    capacity: 4,
    image: 'https://picsum.photos/800/600?random=1',
    images: ['https://picsum.photos/800/600?random=1', 'https://picsum.photos/800/600?random=11', 'https://picsum.photos/800/600?random=12'],
    amenities: [
      { name: 'Wifi', icon: 'wifi' },
      { name: 'Pool', icon: 'waves' },
      { name: 'AC', icon: 'wind' },
      { name: 'Kitchen', icon: 'chef-hat' }
    ]
  },
  {
    id: '2',
    name: 'Mountain Retreat Cabin',
    description: 'Escape to the mountains in this cozy cabin featuring a stone fireplace, wooden interiors, and a hot tub overlooking the valley.',
    price: 8500,
    capacity: 6,
    image: 'https://picsum.photos/800/600?random=2',
    images: ['https://picsum.photos/800/600?random=2', 'https://picsum.photos/800/600?random=21'],
    amenities: [
      { name: 'Wifi', icon: 'wifi' },
      { name: 'Fireplace', icon: 'flame' },
      { name: 'Hiking', icon: 'mountain' },
      { name: 'Parking', icon: 'car' }
    ]
  },
  {
    id: '3',
    name: 'Urban Oasis Loft',
    description: 'Modern loft in the heart of the city. High ceilings, industrial chic design, and walking distance to the best restaurants and nightlife.',
    price: 6500,
    capacity: 2,
    image: 'https://picsum.photos/800/600?random=3',
    images: ['https://picsum.photos/800/600?random=3', 'https://picsum.photos/800/600?random=31'],
    amenities: [
      { name: 'Wifi', icon: 'wifi' },
      { name: 'Gym', icon: 'dumbbell' },
      { name: 'Workspace', icon: 'monitor' },
      { name: 'Coffee', icon: 'coffee' }
    ]
  }
];

// Helper to generate some past bookings for analytics
const generatePastBookings = (): Booking[] => {
  const bookings: Booking[] = [];
  const months = ['2023-10', '2023-11', '2023-12', '2024-01', '2024-02', '2024-03'];
  
  months.forEach((month, index) => {
    const count = Math.floor(Math.random() * 10) + 5;
    for (let i = 0; i < count; i++) {
      bookings.push({
        id: `past-${index}-${i}`,
        roomId: MOCK_ROOMS[Math.floor(Math.random() * MOCK_ROOMS.length)].id,
        guestName: `Guest ${index}-${i}`,
        email: 'test@example.com',
        phoneNumber: '+63 912 345 6789',
        guests: Math.floor(Math.random() * 3) + 1,
        checkIn: `${month}-01`,
        checkOut: `${month}-05`,
        totalPrice: (Math.floor(Math.random() * 5000) + 2000) * 4, // Realistic PHP price calculation
        status: 'confirmed',
        bookedAt: `${month}-01`
      });
    }
  });
  return bookings;
};

export const INITIAL_BOOKINGS: Booking[] = generatePastBookings();

export const COMPANY_INFO = {
  address: "123 Paradise Road, Vacation City, VC 90210",
  phone: "+63 (912) 345-6789",
  email: "hello@serenitystaycation.ph",
  facebook: "facebook.com/serenitystay",
  instagram: "instagram.com/serenitystay"
};

export const SUPERADMIN_DEFAULTS = {
  contactInfo: {
    providerName: "Aniplay Hub",
    email: "neilpaolocabrera@gmail.com",
    phone: "09977341367"
  },
  pricing: {
    price30: 99,
    price60: 190,
    price90: 270
  },
  paymentMethods: {
    gcash: {
      enabled: true,
      accountName: "Neil Paolo Cabrera",
      accountNumber: "09977341367",
      qrImage: "/gcash-qr.jpg"
    },
    bankTransfer: {
      enabled: false,
      bankName: "",
      accountName: "",
      accountNumber: ""
    }
  }
};