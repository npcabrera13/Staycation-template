import React, { useState, useRef, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { Room, Booking, Settings } from './types';
import { roomService } from './services/roomService';
import { bookingService } from './services/bookingService';
import { settingsService, DEFAULT_SETTINGS } from './services/settingsService';
import { ChevronLeft, ChevronRight, MapPin, AlertCircle, Loader } from 'lucide-react';
import LandingPage from './components/LandingPage';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';

function AppContent() {
  const navigate = useNavigate();
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
        const [fetchedRooms, fetchedBookings, fetchedSettings] = await Promise.all([
          roomService.getAll(),
          bookingService.getAll(),
          settingsService.getSettings()
        ]);
        setRooms(fetchedRooms);
        setBookings(fetchedBookings);
        setSettings(fetchedSettings);

        // Apply theme
        if (fetchedSettings) {
          document.documentElement.style.setProperty('--color-primary', fetchedSettings.theme.primaryColor);
          if (fetchedSettings.theme.primaryHoverColor) {
            document.documentElement.style.setProperty('--color-primary-hover', fetchedSettings.theme.primaryHoverColor);
          }
          document.documentElement.style.setProperty('--color-secondary', fetchedSettings.theme.secondaryColor);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        // Fallback to defaults to prevent UI hanging
        if (rooms.length === 0) setRooms([]);
        if (bookings.length === 0) setBookings([]);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500 font-serif">Loading Serenity...</p>
        </div>
      </div>
    );
  }

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

  const handleUpdateSettings = async (newSettings: Settings) => {
    try {
      await settingsService.updateSettings(newSettings);
      setSettings(newSettings);

      // Apply theme immediately
      document.documentElement.style.setProperty('--color-primary', newSettings.theme.primaryColor);
      if (newSettings.theme.primaryHoverColor) {
        document.documentElement.style.setProperty('--color-primary-hover', newSettings.theme.primaryHoverColor);
      }
      document.documentElement.style.setProperty('--color-secondary', newSettings.theme.secondaryColor);
    } catch (e) {
      console.error(e);
      showToast("Failed to update settings", "error");
    }
  };

  const handleBooking = async (newBooking: Booking) => {
    try {
      // Optimistic update
      const tempId = Math.random().toString();
      const bookingWithTempId = { ...newBooking, id: tempId };
      setBookings(prev => [...prev, bookingWithTempId]);

      const savedBooking = await bookingService.add(newBooking);

      // Replace temp with real
      setBookings(prev => prev.map(b => b.id === tempId ? savedBooking : b));
    } catch (e) {
      console.error(e);
      // Rollback would go here
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
            onSeed={handleSeed}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onExit={() => navigate('/')}
            onEnterVisualBuilder={() => {
              setStartEditing(true);
              navigate('/');
            }}
          />
        } />

        <Route path="/" element={
          <LandingPage
            rooms={rooms}
            bookings={bookings}
            onRoomSelect={(room, openGallery = false) => {
              setSelectedRoom(room);
              setStartInGallery(openGallery);
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
          settings={settings}
        />
      )}

      <BookingLookupModal
        isOpen={isMyBookingsOpen}
        onClose={() => setIsMyBookingsOpen(false)}
        bookings={bookings}
        rooms={rooms}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </Router>
  );
}

export default App;