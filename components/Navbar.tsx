import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Anchor, Search } from 'lucide-react';

interface NavbarProps {
  onAdminAccess: () => void;
  onOpenMyBookings: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAdminAccess, onOpenMyBookings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const now = Date.now();
    
    if (now - lastClickTimeRef.current < 1000) {
      clickCountRef.current += 1;
    } else {
      clickCountRef.current = 1;
    }
    
    lastClickTimeRef.current = now;

    if (clickCountRef.current === 3) {
      clickCountRef.current = 0;
      onAdminAccess();
    } else {
      if (clickCountRef.current === 1) {
         scrollToSection('hero');
      }
    }
  };

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navClasses = `fixed w-full z-50 transition-all duration-500 ease-in-out ${
    scrolled 
      ? 'bg-secondary/90 backdrop-blur-md shadow-xl py-2' 
      : 'bg-secondary py-4 shadow-lg'
  }`;

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center cursor-pointer select-none group" onClick={handleLogoClick}>
            <div className="relative">
                <Anchor className="h-8 w-8 text-accent mr-2 transition-transform duration-700 group-hover:rotate-[360deg]" />
                <div className="absolute inset-0 bg-accent opacity-20 blur-lg rounded-full animate-pulse"></div>
            </div>
            <span className="font-serif text-xl font-bold tracking-wider text-white">Serenity</span>
          </div>

          {/* Desktop Menu (Visible on Large Screens Only) */}
          <div className="hidden lg:flex items-center space-x-8">
            <button onClick={() => scrollToSection('hero')} className="text-gray-300 hover:text-accent transition-colors duration-300 text-sm uppercase tracking-wide font-medium">Home</button>
            <button onClick={() => scrollToSection('rooms')} className="text-gray-300 hover:text-accent transition-colors duration-300 text-sm uppercase tracking-wide font-medium">Rooms</button>
            <button onClick={() => scrollToSection('about')} className="text-gray-300 hover:text-accent transition-colors duration-300 text-sm uppercase tracking-wide font-medium">About</button>
            <button onClick={() => scrollToSection('contact')} className="text-gray-300 hover:text-accent transition-colors duration-300 text-sm uppercase tracking-wide font-medium">Contact</button>
            
            <button 
              onClick={onOpenMyBookings}
              className="flex items-center text-white hover:text-accent transition-colors text-sm font-medium border-l border-gray-600 pl-6"
            >
              <Search size={16} className="mr-2" /> My Bookings
            </button>

            <button onClick={() => scrollToSection('rooms')} className="bg-accent text-secondary px-6 py-2.5 rounded-full font-bold hover:bg-white hover:text-primary transition-all duration-300 shadow-lg hover:shadow-accent/50 transform hover:-translate-y-0.5">
              Book Now
            </button>
          </div>

          {/* Mobile/Tablet Menu Button (Visible on md and below) */}
          <div className="lg:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white hover:text-accent transition-colors p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Menu */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-secondary/95 backdrop-blur-xl border-t border-white/10 shadow-2xl animate-slide-down overflow-hidden">
          <div className="px-4 pt-4 pb-6 space-y-2">
            <button onClick={() => scrollToSection('hero')} className="w-full text-left block px-4 py-3 text-gray-200 hover:bg-white/10 hover:text-accent rounded-lg transition-colors font-medium">Home</button>
            <button onClick={() => scrollToSection('rooms')} className="w-full text-left block px-4 py-3 text-gray-200 hover:bg-white/10 hover:text-accent rounded-lg transition-colors font-medium">Rooms</button>
            <button onClick={() => scrollToSection('about')} className="w-full text-left block px-4 py-3 text-gray-200 hover:bg-white/10 hover:text-accent rounded-lg transition-colors font-medium">About</button>
            <button onClick={() => scrollToSection('contact')} className="w-full text-left block px-4 py-3 text-gray-200 hover:bg-white/10 hover:text-accent rounded-lg transition-colors font-medium">Contact</button>
            <button onClick={() => { onOpenMyBookings(); setIsOpen(false); }} className="w-full text-left block px-4 py-3 text-gray-200 hover:bg-white/10 hover:text-accent rounded-lg transition-colors font-medium border-t border-white/10 mt-2">Find My Booking</button>
             <button onClick={() => scrollToSection('rooms')} className="w-full block px-4 py-3 bg-accent text-secondary font-bold rounded-lg mt-4 shadow-lg active:scale-95 transition-transform">
              Book Your Stay
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;