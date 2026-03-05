import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Anchor, Search, Moon, Sun, Check, ImageIcon } from 'lucide-react';
import { Settings } from '../types';
import InlineText from './Builder/InlineText';
import { useTheme } from '../contexts/ThemeContext';

interface NavbarProps {
  onAdminAccess: () => void;
  onOpenMyBookings: () => void;
  settings?: Settings;
  isEditing?: boolean;
  onUpdateSettings?: (section: keyof Settings, key: string, value: any) => void;
  isBuilderOpen?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onAdminAccess, onOpenMyBookings, settings, isEditing, onUpdateSettings, isBuilderOpen = false }) => {
  // ... state refs ...
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    // ... scroll logic ...
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
    if (isEditing) {
      setLogoUrlInput(settings?.logo || '');
      setIsEditingLogo(true);
      return; // Disable admin 3-click while editing
    }
    // Prevent text selection logic here if needed?
    // document.getSelection()?.removeAllRanges();

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
    // ...
    if (isEditing) return;
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

  const navClasses = `fixed z-50 transition-all duration-300 ease-in-out ${scrolled
    ? 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-xl py-2'
    : 'bg-white dark:bg-gray-800 py-4 shadow-lg'
    } ${isBuilderOpen ? 'md:left-[320px] md:w-[calc(100%-320px)] left-0 w-full' : 'left-0 w-full'}`;

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center cursor-pointer select-none group" onClick={handleLogoClick}>
            <div className={`relative h-10 w-auto max-w-[120px] mr-3 overflow-visible flex-shrink-0 ${isEditing ? 'ring-2 ring-primary ring-offset-2 rounded-sm cursor-pointer' : ''}`}>
              {settings?.logo?.trim() ? (
                <img
                  src={settings.logo}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                  <Anchor className="h-full w-full text-primary transition-transform duration-700 group-hover:rotate-[360deg]" />
                  <div className="absolute inset-0 bg-primary opacity-20 blur-lg rounded-full animate-pulse"></div>
                </div>
              )}
            </div>

            <span className="font-serif text-xl font-bold tracking-wider text-secondary dark:text-white">
              {isEditing ? (
                <input
                  type="text"
                  value={settings?.siteName || ''}
                  onChange={(e) => onUpdateSettings && onUpdateSettings('siteName' as any, '', e.target.value)}
                  className="bg-transparent border-2 border-dashed border-gray-400/50 hover:border-gray-400 focus:border-blue-500 rounded px-2 py-1 outline-none text-xl font-bold font-serif tracking-wider text-secondary dark:text-white w-full min-w-[300px] transition-colors"
                  placeholder="Site Name"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                settings?.siteName || 'Serenity'
              )}
            </span>
          </div>

          {/* Desktop Menu (Visible on Large Screens Only) */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Updated text colors to gray-600 and hover primary */}
            <button onClick={() => scrollToSection('hero')} className="text-gray-600 hover:text-primary transition-colors duration-300 text-sm uppercase tracking-wide font-medium">Home</button>
            <button onClick={() => scrollToSection('rooms')} className="text-gray-600 hover:text-primary transition-colors duration-300 text-sm uppercase tracking-wide font-medium">Rooms</button>
            <button onClick={() => scrollToSection('about')} className="text-gray-600 hover:text-primary transition-colors duration-300 text-sm uppercase tracking-wide font-medium">About</button>
            <button onClick={() => scrollToSection('contact')} className="text-gray-600 hover:text-primary transition-colors duration-300 text-sm uppercase tracking-wide font-medium">Contact</button>

            <button
              onClick={onOpenMyBookings}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-primary transition-colors text-sm font-medium border-l border-gray-300 dark:border-gray-600 pl-6"
            >
              <Search size={16} className="mr-2" /> My Bookings
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-600 hover:text-primary hover:bg-gray-100 transition-all duration-300"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Updated button to solid secondary color for contrast on white */}
            <button onClick={() => scrollToSection('rooms')} className="bg-secondary text-white px-6 py-2.5 rounded-full font-bold hover:bg-primary transition-all duration-300 shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5">
              Book Now
            </button>
          </div>

          {/* Mobile/Tablet Menu Button (Visible on md and below) */}
          <div className="lg:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-secondary hover:text-primary transition-colors p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Menu - Updated background to white */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-2xl animate-slide-down overflow-hidden">
          <div className="px-4 pt-4 pb-6 space-y-2">
            <button onClick={() => scrollToSection('hero')} className="w-full text-left block px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors font-medium">Home</button>
            <button onClick={() => scrollToSection('rooms')} className="w-full text-left block px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors font-medium">Rooms</button>
            <button onClick={() => scrollToSection('about')} className="w-full text-left block px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors font-medium">About</button>
            <button onClick={() => scrollToSection('contact')} className="w-full text-left block px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors font-medium">Contact</button>
            <button onClick={() => { onOpenMyBookings(); setIsOpen(false); }} className="w-full text-left block px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors font-medium border-t border-gray-100 mt-2">Find My Booking</button>

            {/* Dark Mode Toggle - Mobile */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors font-medium"
            >
              {isDark ? <Sun size={18} className="mr-3" /> : <Moon size={18} className="mr-3" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>

            <button onClick={() => scrollToSection('rooms')} className="w-full block px-4 py-3 bg-secondary text-white font-bold rounded-lg mt-4 shadow-lg active:scale-95 transition-transform">
              Book Your Stay
            </button>
          </div>
        </div>
      )}

      {/* Custom Modal for Logo Hotlink URL */}
      {isEditingLogo && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all text-left">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon className="text-primary" size={24} /> Edit Logo URL
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Paste a direct link to your image (like Imgur) to feature it as your logo instead of the default icon.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow"
                  placeholder="https://i.imgur.com/example.png"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsEditingLogo(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <X size={18} /> Cancel
                </button>
                <button
                  onClick={() => {
                    if (onUpdateSettings) {
                      onUpdateSettings('logo' as any, '', logoUrlInput);
                    }
                    setIsEditingLogo(false);
                  }}
                  className="flex-1 px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Check size={18} /> Save URL
                </button>
              </div>
              <button
                onClick={() => {
                  if (onUpdateSettings) {
                    onUpdateSettings('logo' as any, '', '');
                  }
                  setIsEditingLogo(false);
                }}
                className="w-full mt-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors font-medium border border-red-200 dark:border-red-900/50"
              >
                Clear Logo (Use Default Anchor)
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;