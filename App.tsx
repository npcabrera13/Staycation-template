import React, { useState, useRef, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RoomCard from './components/RoomCard';
import BookingModal from './components/BookingModal';
import BookingLookupModal from './components/BookingLookupModal';
import AdminDashboard from './components/AdminDashboard';
import AIChat from './components/AIChat';
import RevealOnScroll from './components/RevealOnScroll';
import SearchBar from './components/SearchBar';
import { MOCK_ROOMS, INITIAL_BOOKINGS, COMPANY_INFO } from './constants';
import { Room, Booking } from './types';
import { ChevronLeft, ChevronRight, MapPin, AlertCircle } from 'lucide-react';
import { isWithinInterval } from 'date-fns';

const LandingPage: React.FC<{
  rooms: Room[];
  bookings: Booking[];
  onRoomSelect: (room: Room, openGallery?: boolean) => void;
  onAdminEnter: () => void;
  onOpenMyBookings: () => void;
}> = ({ rooms, bookings, onRoomSelect, onAdminEnter, onOpenMyBookings }) => {
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Drag Scroll State
  const [isDragging, setIsDragging] = useState(false);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  
  // Search State
  const [searchCriteria, setSearchCriteria] = useState<{
    checkIn: Date | null;
    checkOut: Date | null;
    guests: number;
  } | null>(null);

  const filteredRooms = useMemo(() => {
    if (!searchCriteria) return rooms;

    return rooms.filter(room => {
      // 1. Capacity Check
      if (room.capacity < searchCriteria.guests) return false;

      // 2. Availability Check
      if (searchCriteria.checkIn && searchCriteria.checkOut) {
         const roomBookings = bookings.filter(b => b.roomId === room.id && b.status !== 'cancelled');
         
         const hasOverlap = roomBookings.some(b => {
             const bookedStart = new Date(b.checkIn);
             const bookedEnd = new Date(b.checkOut);
             const reqStart = searchCriteria.checkIn!;
             const reqEnd = searchCriteria.checkOut!;

             // Standard Overlap Logic
             return (reqStart < bookedEnd && reqEnd > bookedStart);
         });

         if (hasOverlap) return false;
      }

      return true;
    });
  }, [rooms, bookings, searchCriteria]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollLeft;
    // Get precise card width including gap estimate
    const firstCard = container.firstElementChild as HTMLElement;
    const cardWidth = firstCard ? firstCard.offsetWidth + 24 : container.clientWidth * 0.85; // 24 is gap-6
    
    if (cardWidth) {
        const index = Math.round(scrollPosition / cardWidth);
        setActiveRoomIndex(index);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      // Calculate scroll amount based on the first card's width plus the gap
      const firstCard = current.firstElementChild as HTMLElement;
      const scrollAmount = firstCard ? firstCard.offsetWidth + 24 : current.clientWidth * 0.85; 
      
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleClearSearch = () => setSearchCriteria(null);

  // Drag to Scroll Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDown.current = true;
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeft.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    if (isDragging) setIsDragging(false);
  };

  const handleMouseUp = () => {
    isDown.current = false;
    // Small timeout ensures that if we were dragging, we clear the state,
    // but we don't block immediate clicks if we weren't dragging.
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // Scroll-fast
    
    // Only engage drag mode if moved significantly (threshold)
    if (Math.abs(x - startX.current) > 5) {
        if (!isDragging) setIsDragging(true);
        scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };

  return (
    <>
      <Navbar onAdminAccess={onAdminEnter} onOpenMyBookings={onOpenMyBookings} />
      
      {/* Hero Section */}
      <div id="hero" className="relative h-[100vh] min-h-[600px] bg-secondary text-white overflow-hidden scroll-mt-20">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-50 animate-[pulse_20s_ease-in-out_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-secondary/90"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-center items-center text-center z-10 pt-20">
          <RevealOnScroll>
             <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-accent text-sm tracking-widest uppercase font-bold mb-6">
                Welcome to Paradise
             </span>
          </RevealOnScroll>
          
          <RevealOnScroll delay={200}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 tracking-tight leading-tight drop-shadow-lg">
              Rediscover <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">Serenity</span>
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delay={400}>
            <p className="text-lg md:text-2xl mb-10 max-w-2xl mx-auto text-gray-100 font-light leading-relaxed">
              Luxury staycations curated for your peace of mind. <br className="hidden md:block"/>Experience comfort like never before.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={600}>
            <a 
              href="#rooms" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center bg-accent text-secondary px-10 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-primary transition-all duration-300 transform hover:scale-105 shadow-2xl group"
            >
              Explore Rooms 
              <span className="ml-2 group-hover:translate-y-1 transition-transform">↓</span>
            </a>
          </RevealOnScroll>
        </div>
      </div>

      {/* Rooms Section */}
      <section id="rooms" className="py-24 md:py-32 bg-surface relative overflow-hidden scroll-mt-10">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          
          {/* Search Bar Insertion */}
          <SearchBar rooms={rooms} onSearch={setSearchCriteria} />

          <RevealOnScroll>
            <div className="text-center mt-16 mb-12">
              <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase mb-3 block">Stay with us</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-6">Our Exclusive Rooms</h2>
              <div className="w-24 h-1 bg-accent mx-auto mb-8 rounded-full"></div>
              
              {searchCriteria ? (
                <div className="flex flex-col items-center animate-fade-in">
                    <p className="text-gray-600 text-lg mb-4">
                        Showing {filteredRooms.length} room{filteredRooms.length !== 1 && 's'} available for{' '}
                        <span className="font-bold text-primary">
                            {searchCriteria.checkIn?.toLocaleDateString()} - {searchCriteria.checkOut?.toLocaleDateString()}
                        </span>
                    </p>
                    <button 
                        onClick={handleClearSearch}
                        className="text-sm text-red-500 hover:text-red-700 underline font-medium"
                    >
                        Clear Filters
                    </button>
                </div>
              ) : (
                <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-light">
                    From beachfront villas to cozy mountain cabins, each property is designed to provide the ultimate relaxation experience.
                </p>
              )}
            </div>
          </RevealOnScroll>
          
          {filteredRooms.length > 0 ? (
              <div className="relative group">
                <button 
                    onClick={() => scroll('left')}
                    className="absolute left-2 md:-left-6 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-white text-secondary p-3 rounded-full shadow-xl border border-gray-100 transition-all active:scale-95 md:opacity-0 md:group-hover:opacity-100 duration-300"
                    aria-label="Scroll Left"
                >
                    <ChevronLeft size={24} className="relative -left-0.5" />
                </button>

                <button 
                    onClick={() => scroll('right')}
                    className="absolute right-2 md:-right-6 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-white text-secondary p-3 rounded-full shadow-xl border border-gray-100 transition-all active:scale-95 md:opacity-0 md:group-hover:opacity-100 duration-300"
                    aria-label="Scroll Right"
                >
                    <ChevronRight size={24} className="relative -right-0.5" />
                </button>

                <div 
                    ref={scrollContainerRef}
                    className={`flex overflow-x-auto snap-x snap-mandatory gap-6 py-8 px-[7.5vw] md:px-4 -mx-4 md:mx-0 scroll-smooth touch-pan-y scrollbar-hide ${isDragging ? 'cursor-grabbing snap-none' : 'cursor-grab'}`}
                    onScroll={handleScroll}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                >
                    {filteredRooms.map((room, index) => (
                    <div key={room.id} className="w-[85vw] max-w-[340px] md:w-[45%] md:max-w-none lg:w-[32%] flex-shrink-0 snap-center h-full flex flex-col">
                        {/* Pointer events none only applied when actively dragging to prevent accidental clicks */}
                        <div className={isDragging ? "pointer-events-none" : ""}>
                           <RoomCard room={room} onSelect={onRoomSelect} />
                        </div>
                    </div>
                    ))}
                </div>
              </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Rooms Available</h3>
                <p className="text-gray-500">Try adjusting your dates or guest count to find available options.</p>
                <button onClick={handleClearSearch} className="mt-4 text-primary font-bold hover:underline">View All Rooms</button>
            </div>
          )}
          
          {filteredRooms.length > 0 && (
              <div className="flex justify-center mt-6 space-x-2">
                  {filteredRooms.map((_, idx) => (
                      <div 
                        key={idx}
                        className={`h-2 rounded-full transition-all duration-300 ${
                            idx === activeRoomIndex 
                            ? 'w-8 bg-secondary' 
                            : 'w-2 bg-gray-300'
                        }`}
                      />
                  ))}
              </div>
          )}

        </div>
      </section>

      {/* About/Promo Section */}
      <section id="about" className="py-24 md:py-32 bg-white overflow-hidden scroll-mt-10">
         <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
               <RevealOnScroll>
                 <h2 className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-8 leading-tight">
                    Why Choose <br/><span className="text-primary">Serenity?</span>
                 </h2>
               </RevealOnScroll>

               <div className="space-y-10">
                  <RevealOnScroll delay={200}>
                    <div className="flex items-start group">
                        <div className="bg-surface p-4 rounded-2xl mr-6 text-primary font-bold text-xl group-hover:bg-primary group-hover:text-white transition-colors duration-500 shadow-sm">01</div>
                        <div>
                            <h4 className="font-bold text-secondary text-xl mb-2">Handpicked Locations</h4>
                            <p className="text-gray-500 leading-relaxed">Every house is verified for quality, view, and comfort to ensure a magical stay.</p>
                        </div>
                    </div>
                  </RevealOnScroll>

                  <RevealOnScroll delay={400}>
                    <div className="flex items-start group">
                        <div className="bg-surface p-4 rounded-2xl mr-6 text-primary font-bold text-xl group-hover:bg-primary group-hover:text-white transition-colors duration-500 shadow-sm">02</div>
                        <div>
                            <h4 className="font-bold text-secondary text-xl mb-2">Seamless Booking</h4>
                            <p className="text-gray-500 leading-relaxed">Real-time availability calendar, instant confirmation, and secure payments.</p>
                        </div>
                    </div>
                  </RevealOnScroll>
                   
                  <RevealOnScroll delay={600}>
                    <div className="flex items-start group">
                        <div className="bg-surface p-4 rounded-2xl mr-6 text-primary font-bold text-xl group-hover:bg-primary group-hover:text-white transition-colors duration-500 shadow-sm">03</div>
                        <div>
                            <h4 className="font-bold text-secondary text-xl mb-2">24/7 Concierge</h4>
                            <p className="text-gray-500 leading-relaxed">Our AI concierge and support team are always here to help you plan your trip.</p>
                        </div>
                    </div>
                  </RevealOnScroll>
               </div>
            </div>
            
            <div className="md:w-1/2 relative hidden md:block h-[600px]">
               <RevealOnScroll delay={300} className="h-full w-full">
                 <div className="absolute -inset-4 bg-accent/20 rounded-full blur-3xl z-0 animate-pulse-slow"></div>
                 <img 
                    src="https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                    alt="Relaxing Interior" 
                    className="w-full h-full object-cover rounded-3xl shadow-2xl relative z-10 transform hover:scale-[1.02] transition-transform duration-1000" 
                 />
                 <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-2xl shadow-xl z-20 max-w-xs animate-[pulse_5s_ease-in-out_infinite]">
                    <div className="flex items-center mb-4">
                        <div className="flex -space-x-2 mr-4">
                            <img className="w-8 h-8 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=1" alt="User" />
                            <img className="w-8 h-8 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=2" alt="User" />
                            <img className="w-8 h-8 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=3" alt="User" />
                        </div>
                        <span className="text-xs font-bold text-gray-500">1k+ Happy Guests</span>
                    </div>
                    <p className="text-sm text-secondary font-serif italic">"The most relaxing weekend of my life. Truly serene."</p>
                 </div>
               </RevealOnScroll>
            </div>
         </div>
      </section>

      {/* Location Section with Google Maps Embed */}
      <section id="contact" className="py-20 bg-gray-50 scroll-mt-10">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <RevealOnScroll>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-4">Find Us in Paradise</h2>
              <p className="text-gray-500 mb-10 max-w-2xl mx-auto">
                Located in the heart of the Philippines' most beautiful islands. Visit our main office or book a stay at one of our exclusive properties.
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={200}>
              <div className="w-full h-96 md:h-[500px] rounded-3xl overflow-hidden shadow-xl border-4 border-white relative">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125181.43388055636!2d119.34637195647923!3d11.224378310234497!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33b7accd159567c7%3A0x64464a2a15c2823!2sEl%20Nido%2C%20Palawan!5e0!3m2!1sen!2sph!4v1709536251859!5m2!1sen!2sph" 
                  width="100%" 
                  height="100%" 
                  style={{border:0}} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Serenity Staycation Location"
                ></iframe>
                
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg text-left max-w-xs hidden sm:block">
                    <div className="flex items-center text-primary font-bold mb-2">
                        <MapPin size={18} className="mr-2" /> Main Office
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {COMPANY_INFO.address}
                    </p>
                </div>
              </div>
            </RevealOnScroll>
         </div>
      </section>

      <Footer />
      <AIChat />
    </>
  );
};

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [startInGallery, setStartInGallery] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);

  const handleBooking = (newBooking: Booking) => {
    setBookings(prev => [...prev, newBooking]);
  };

  const handleAddBooking = (newBooking: Booking) => {
    setBookings(prev => [newBooking, ...prev]);
  };

  const handleUpdateRoom = (updatedRoom: Room) => {
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
  };
  
  const handleAddRoom = (newRoom: Room) => {
    setRooms(prev => [...prev, newRoom]);
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
  }

  const handleUpdateBooking = (updatedBooking: Booking) => {
    setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
  };

  const handleDeleteBooking = (bookingId: string) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  const handleDeleteBookings = (bookingIds: string[]) => {
    setBookings(prev => prev.filter(b => !bookingIds.includes(b.id)));
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans">
        {isAdminMode ? (
          <AdminDashboard 
            bookings={bookings} 
            rooms={rooms} 
            onUpdateRoom={handleUpdateRoom}
            onAddRoom={handleAddRoom}
            onDeleteRoom={handleDeleteRoom}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
            onDeleteBookings={handleDeleteBookings}
            onAddBooking={handleAddBooking}
            onExit={() => setIsAdminMode(false)} 
          />
        ) : (
          <>
            <Routes>
              <Route path="/" element={
                <LandingPage 
                  rooms={rooms}
                  bookings={bookings}
                  onRoomSelect={(room, openGallery = false) => {
                    setSelectedRoom(room);
                    setStartInGallery(openGallery);
                  }}
                  onAdminEnter={() => setIsAdminMode(true)} 
                  onOpenMyBookings={() => setIsMyBookingsOpen(true)}
                />
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Modals */}
            {selectedRoom && (
              <BookingModal 
                room={selectedRoom} 
                onClose={() => setSelectedRoom(null)}
                bookings={bookings}
                onBook={handleBooking}
                initialGalleryOpen={startInGallery}
              />
            )}

            <BookingLookupModal 
                isOpen={isMyBookingsOpen}
                onClose={() => setIsMyBookingsOpen(false)}
                bookings={bookings}
                rooms={rooms}
            />
          </>
        )}
      </div>
    </Router>
  );
}

export default App;