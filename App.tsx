import React, { useState, useRef, useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RoomCard from './components/RoomCard';
import AIChat from './components/AIChat';
import RevealOnScroll from './components/RevealOnScroll';
import SearchBar from './components/SearchBar';
import { MOCK_ROOMS, INITIAL_BOOKINGS, COMPANY_INFO } from './constants';
import { Room, Booking, Settings, BookingFilter } from './types';
import { roomService } from './services/roomService';
import { bookingService } from './services/bookingService';
import { settingsService, DEFAULT_SETTINGS } from './services/settingsService';
import { ChevronLeft, ChevronRight, MapPin, AlertCircle, Loader, Lock, Mail, AlertTriangle, Phone, User } from 'lucide-react';
import { useLicense } from './components/LicenseProvider';
import LandingPage from './components/LandingPage';
import LicenseProvider from './components/LicenseProvider';
import AdminPasscodeGate from './components/AdminPasscodeGate';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Heavy components — loaded on demand, not on initial page load
// Guests save ~445KB of JS they'd never need
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const SuperAdmin = lazy(() => import('./components/SuperAdmin'));
const BookingModal = lazy(() => import('./components/BookingModal'));
const BookingLookupModal = lazy(() => import('./components/BookingLookupModal'));

// Simple loading bar — only shown as Suspense fallback for Admin/SuperAdmin routes
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
    <div className="w-48 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full"
        style={{ animation: 'loadingSlide 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
      />
    </div>
    <style>{`
      @keyframes loadingSlide {
        0% { width: 0%; margin-left: 0%; }
        50% { width: 60%; margin-left: 20%; }
        100% { width: 0%; margin-left: 100%; }
      }
    `}</style>
  </div>
);

const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

function AppContent() {
  const navigate = useNavigate();
  const { 
    isAdminLocked, 
    isHomepageLocked, 
    contactEmail, 
    contactPhone, 
    providerName,
    expiryDays,
    expiryDate,
    showExpiryWarning,
    setShowExpiryWarning,
    showMissingPasscodeWarning,
    setShowMissingPasscodeWarning,
    licenseKey
  } = useLicense();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [startEditing, setStartEditing] = useState(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [startInGallery, setStartInGallery] = useState(false);

  // Local State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<Settings | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast, showConfirm } = useNotification();

  // Initialize data from Firestore
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Check sessionStorage cache (5 min TTL) to skip Firebase on repeat visits
        const cacheKey = 'staycation_init_cache';
        const cached = sessionStorage.getItem(cacheKey);
        const cacheAge = sessionStorage.getItem(cacheKey + '_ts');
        const isCacheValid = cached && cacheAge && (Date.now() - parseInt(cacheAge)) < 5 * 60 * 1000;

        let fetchedRooms: any[], fetchedSettings: any;

        if (isCacheValid) {
          // Fast path: use cached data, skip Firebase
          const { rooms: cachedRooms, settings: cachedSettings } = JSON.parse(cached);
          fetchedRooms = cachedRooms;
          fetchedSettings = cachedSettings;
        } else {
          // NOTE: We intentionally do NOT fetch bookings here.
          // Bookings are only loaded when a user opens a room modal.
          // This cuts homepage Firebase reads by ~60% for anonymous visitors.
          [fetchedRooms, fetchedSettings] = await Promise.all([
            roomService.getAll(),
            settingsService.getSettings()
          ]);
          // Cache for 5 minutes
          sessionStorage.setItem(cacheKey, JSON.stringify({ rooms: fetchedRooms, settings: fetchedSettings }));
          sessionStorage.setItem(cacheKey + '_ts', Date.now().toString());
        }

        setRooms(fetchedRooms);
        setSettings(fetchedSettings);

        // Apply theme
        if (fetchedSettings) {
          document.title = stripHtml(fetchedSettings.siteName) || "Staycation";

          // Sync favicon to logoUrl
          let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = fetchedSettings.logo || '/vite.svg';

          document.documentElement.style.setProperty('--color-primary', fetchedSettings.theme.primaryColor);
          localStorage.setItem('theme-primary', fetchedSettings.theme.primaryColor);
          if (fetchedSettings.theme.primaryHoverColor) {
            document.documentElement.style.setProperty('--color-primary-hover', fetchedSettings.theme.primaryHoverColor);
            localStorage.setItem('theme-primary-hover', fetchedSettings.theme.primaryHoverColor);
          }
          document.documentElement.style.setProperty('--color-secondary', fetchedSettings.theme.secondaryColor);
          localStorage.setItem('theme-secondary', fetchedSettings.theme.secondaryColor);
          document.documentElement.style.setProperty('--color-accent', fetchedSettings.theme.accentColor || fetchedSettings.theme.primaryColor);
          localStorage.setItem('theme-accent', fetchedSettings.theme.accentColor || fetchedSettings.theme.primaryColor);

          // Apply font family
          document.body.classList.remove('font-sans', 'font-serif', 'font-mono');
          document.body.classList.add(`font-${fetchedSettings.theme.fontFamily || 'sans'}`);

          // BRANDING MIGRATION (Clean up old 'Serenity' or 'AI' defaults if still present)
          let needsUpdate = false;
          const updatedSettings = { ...fetchedSettings };
          
          // 1. Fix "Why Choose Serenity?" if user has a different site name
          if (updatedSettings.about?.subtitle === 'Serenity?' && updatedSettings.siteName && updatedSettings.siteName !== 'Serenity Staycation') {
            updatedSettings.about.subtitle = `${updatedSettings.siteName}?`;
            needsUpdate = true;
          }

          // 2. Fix "Handpicked Locations" migration
          const f1 = updatedSettings.about?.features?.[0];
          if (f1?.title === 'Handpicked Locations') {
            updatedSettings.about.features[0] = {
              title: "Superior Comfort",
              description: "Every room is personally verified for quality and comfort to ensure you have a truly relaxing stay."
            };
            needsUpdate = true;
          }

          // 3. Fix old AI Concierge text or old branding
          const f3 = updatedSettings.about?.features?.[2];
          if (f3?.title === '24/7 Concierge' || f3?.title === 'Personalized Support' || f3?.description?.includes('AI concierge') || f3?.description?.includes('digital concierge')) {
            updatedSettings.about.features[2] = {
              title: "Exceptional Service",
              description: "Our dedicated team is always available to assist you, ensuring a smooth and worry-free experience from start to finish."
            };
            needsUpdate = true;
          }

          if (needsUpdate) {
            console.log("Migrating legacy branding/AI text...");
            settingsService.updateSettings(updatedSettings);
            setSettings(updatedSettings);
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        if (rooms.length === 0) setRooms([]);
        if (bookings.length === 0) setBookings([]);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Fetch bookings immediately if user goes to admin dashboard
  useEffect(() => {
    if (location.pathname === '/admin' && bookings.length === 0) {
      bookingService.getAll().then(fetchedBookings => {
        setBookings(fetchedBookings);
      }).catch(err => {
        console.error("Failed to load admin bookings:", err);
      });
    }
  }, [location.pathname]);

  // No loading gate here — the homepage renders immediately.
  // Only the rooms section in LandingPage checks isLoading to show skeletons.

  const handleUpdateRoom = async (updatedRoom: Room) => {
    try {
      await roomService.update(updatedRoom.id, updatedRoom);
      setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
      showToast("Room updated successfully", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to update room", "error");
    }
  };

  const handleAddRoom = async (newRoom: Room) => {
    try {
      const added = await roomService.add(newRoom);
      setRooms(prev => [...prev, added]);
      showToast("Room added successfully", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to add room", "error");
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    console.log("App: handleDeleteRoom called for ID:", roomId);
    try {
      await roomService.delete(roomId);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      showToast("Room deleted successfully", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to delete room", "error");
    }
  }

  const handleUpdateBooking = async (updatedBooking: Booking) => {
    try {
      await bookingService.update(updatedBooking.id, updatedBooking);
      setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
      showToast("Booking updated successfully", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to update booking", "error");
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await bookingService.delete(bookingId);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      showToast("Booking deleted successfully", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to delete booking", "error");
    }
  };

  const handleDeleteBookings = async (bookingIds: string[]) => {
    try {
      await Promise.all(bookingIds.map(id => bookingService.delete(id)));
      setBookings(prev => prev.filter(b => !bookingIds.includes(b.id)));
      showToast("Bookings deleted successfully", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to delete bookings", "error");
    }
  };

  /**
   * Server-side booking filter handler.
   * Called by AdminDashboard when the filter dropdown changes.
   * Returns only the bookings matching the date range from Firebase.
   */
  const handleFetchFilteredBookings = useCallback(async (filter: BookingFilter): Promise<Booking[]> => {
    try {
      const filtered = await bookingService.getByFilter(filter);
      // Also sync the main bookings state if fetching 'all' (keeps calendar/stats in sync)
      if (filter === 'all') {
        setBookings(filtered);
      }
      return filtered;
    } catch (e) {
      console.error('Failed to fetch filtered bookings:', e);
      return [];
    }
  }, []);

  const handleUpdateSettings = async (newSettings: Settings) => {
    try {
      await settingsService.updateSettings(newSettings);
      setSettings(newSettings);

      // Apply theme immediately
      document.title = stripHtml(newSettings.siteName) || "Staycation";

      // Sync favicon to logoUrl
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = newSettings.logo || '/vite.svg';

      document.documentElement.style.setProperty('--color-primary', newSettings.theme.primaryColor);
      localStorage.setItem('theme-primary', newSettings.theme.primaryColor);
      if (newSettings.theme.primaryHoverColor) {
        document.documentElement.style.setProperty('--color-primary-hover', newSettings.theme.primaryHoverColor);
        localStorage.setItem('theme-primary-hover', newSettings.theme.primaryHoverColor);
      }
      document.documentElement.style.setProperty('--color-secondary', newSettings.theme.secondaryColor);
      localStorage.setItem('theme-secondary', newSettings.theme.secondaryColor);
      // Auto-mirror accent to primary color (accent picker removed from builder)
      document.documentElement.style.setProperty('--color-accent', newSettings.theme.accentColor || newSettings.theme.primaryColor);
      localStorage.setItem('theme-accent', newSettings.theme.accentColor || newSettings.theme.primaryColor);
    } catch (e) {
      console.error(e);
      showToast("Failed to update settings", "error");
    }
  };

  const handleBooking = async (newBooking: Booking) => {
    try {
      // Use set to preserve the ID generated in BookingModal
      await bookingService.set(newBooking);
      setBookings(prev => [...prev, newBooking]);
    } catch (e) {
      console.error(e);
      showToast("Failed to create booking", "error");
    }
  };

  const handleAddBooking = async (newBooking: Booking) => {
    await handleBooking(newBooking);
  };

  const refreshData = async () => {
    const [fetchedRooms, fetchedBookings] = await Promise.all([
      roomService.getAll(),
      bookingService.getAll()
    ]);
    setRooms(fetchedRooms);
    setBookings(fetchedBookings);
  };

  const handleSeed = () => {
    showConfirm({
      title: "Seed Database with Mock Data",
      message: "This will overwrite existing rooms with mock data. This action cannot be undone. Are you sure you want to continue?",
      isDangerous: true,
      confirmLabel: "Yes, Overwrite Data",
      onConfirm: async () => {
        try {
          await Promise.all(MOCK_ROOMS.map(room => roomService.set(room)));
          await refreshData();
          showToast("Database seeded successfully!", "success");
        } catch (e) {
          console.error(e);
          showToast("Failed to seed database.", "error");
        }
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Routes>
        <Route path="/admin" element={
          <AdminPasscodeGate onBack={() => navigate('/')}>
            <Suspense fallback={<PageLoadingFallback />}>
            <div className="relative">
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
                onRefresh={refreshData}
                onFetchFilteredBookings={handleFetchFilteredBookings}
                onSeed={handleSeed}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onExit={() => navigate('/')}
                onEnterVisualBuilder={() => {
                  setStartEditing(true);
                  navigate('/');
                }}
                showExpiryWarning={showExpiryWarning}
                expiryDays={expiryDays}
                expiryDate={expiryDate}
                contactInfo={{
                  email: contactEmail,
                  phone: contactPhone,
                  providerName: providerName
                }}
                showMissingPasscodeWarning={showMissingPasscodeWarning}
                setShowMissingPasscodeWarning={setShowMissingPasscodeWarning}
                licenseKey={licenseKey}
                setShowExpiryWarning={setShowExpiryWarning}
              />
              {/* Admin Lockout Overlay */}
              {isAdminLocked && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backdropFilter: 'blur(6px)' }}>
                  <div className="absolute inset-0 bg-black/60" />
                  <div className="relative max-w-md w-full mx-4 text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-14 h-14 bg-red-500/30 rounded-full flex items-center justify-center">
                          <Lock className="text-red-400" size={28} />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <AlertTriangle className="text-yellow-400" size={18} />
                        <span className="text-yellow-400 text-xs font-semibold uppercase tracking-wider">Access Suspended</span>
                      </div>
                      <h2 className="text-xl font-bold text-white mb-2">Admin Panel Locked</h2>
                      <p className="text-gray-300 text-sm mb-5 leading-relaxed">
                        Your subscription has expired or your admin access has been suspended.
                        Please contact {providerName || 'your service provider'} to renew.
                      </p>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10 mb-4 space-y-2">
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Contact Support</p>
                        {providerName && (
                          <div className="flex items-center justify-center gap-2 text-gray-300 text-sm">
                            <User size={14} className="text-gray-400" />
                            <span className="font-medium">{providerName}</span>
                          </div>
                        )}
                        {contactEmail && (
                          <a href={`mailto:${contactEmail}`} className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium text-sm">
                            <Mail size={14} /> {contactEmail}
                          </a>
                        )}
                        {contactPhone && (
                          <a href={`tel:${contactPhone}`} className="flex items-center justify-center gap-2 text-green-400 hover:text-green-300 transition-colors font-medium text-sm">
                            <Phone size={14} /> {contactPhone}
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => window.location.reload()}
                        className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Retry Connection
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-4">Your data is safe and will be available once renewed.</p>
                  </div>
                </div>
              )}
            </div>
            </Suspense>
          </AdminPasscodeGate>
        } />

        <Route path="/" element={
          isLoading ? <PageLoadingFallback /> : <>
            <LandingPage
              rooms={rooms}
              bookings={bookings}
              onRoomSelect={async (room, openGallery = false) => {
                setSelectedRoom(room);
                setStartInGallery(openGallery);
                // Lazy-load bookings only when a user actually opens a room
                // This avoids fetching all bookings on every homepage visit
                if (bookings.length === 0) {
                  try {
                    const fetchedBookings = await bookingService.getAll();
                    setBookings(fetchedBookings);
                  } catch (e) {
                    console.error('Failed to load bookings:', e);
                  }
                }
              }}
              onAdminEnter={() => {
                setIsAdminAuthenticated(true);
                navigate('/admin');
              }}
              onOpenMyBookings={() => setIsMyBookingsOpen(true)}
              isLoading={isLoading}
              settings={settings}
              isAdmin={isAdminAuthenticated}
              onUpdateSettings={handleUpdateSettings}
              onExitAdmin={() => setIsAdminAuthenticated(false)}
              startEditing={startEditing}
              onEditingStarted={() => setStartEditing(false)}
              onUpdateRoom={async (roomId, updates) => {
                const existingRoom = rooms.find(r => r.id === roomId);
                if (existingRoom) {
                  await handleUpdateRoom({ ...existingRoom, ...updates } as Room);
                }
              }}
            />
            {/* Homepage Lockout Overlay */}
            {isHomepageLocked && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backdropFilter: 'blur(6px)' }}>
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative max-w-md w-full mx-4 text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-14 h-14 bg-red-500/30 rounded-full flex items-center justify-center">
                        <Lock className="text-red-400" size={28} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <AlertTriangle className="text-yellow-400" size={18} />
                      <span className="text-yellow-400 text-xs font-semibold uppercase tracking-wider">Subscription Inactive</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Website Access Suspended</h2>
                    <p className="text-gray-300 text-sm mb-5 leading-relaxed">
                      This website's subscription has expired or has not been activated yet.
                      Please contact {providerName || 'the service provider'} to renew.
                    </p>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10 mb-4 space-y-2">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Contact Support</p>
                      {providerName && (
                        <div className="flex items-center justify-center gap-2 text-gray-300 text-sm">
                          <User size={14} className="text-gray-400" />
                          <span className="font-medium">{providerName}</span>
                        </div>
                      )}
                      {contactEmail && (
                        <a href={`mailto:${contactEmail}`} className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium text-sm">
                          <Mail size={14} /> {contactEmail}
                        </a>
                      )}
                      {contactPhone && (
                        <a href={`tel:${contactPhone}`} className="flex items-center justify-center gap-2 text-green-400 hover:text-green-300 transition-colors font-medium text-sm">
                          <Phone size={14} /> {contactPhone}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Retry Connection
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mt-4">Your data is safe and will be available once the subscription is renewed.</p>
                </div>
              </div>
            )}
          </>
        } />
        <Route path="/superadmin" element={<Suspense fallback={<PageLoadingFallback />}><SuperAdmin /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Modals */}
      {selectedRoom && (
        // Individual Suspense: modal chunk loads without touching the rest of the page
        <Suspense fallback={null}>
          <BookingModal
            room={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            bookings={bookings}
            onBook={handleBooking}
            onUpdateBooking={async (b) => { await handleUpdateBooking(b); }}
            initialGalleryOpen={startInGallery}
            settings={settings}
            onOpenMyBookings={() => setIsMyBookingsOpen(true)}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <BookingLookupModal
          isOpen={isMyBookingsOpen}
          onClose={() => setIsMyBookingsOpen(false)}
          bookings={bookings}
          rooms={rooms}
        />
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <LicenseProvider>
          <NotificationProvider>
            {/* Safety-net Suspense — individual components have their own boundaries now */}
            <Suspense fallback={null}>
              <AppContent />
            </Suspense>
          </NotificationProvider>
        </LicenseProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;