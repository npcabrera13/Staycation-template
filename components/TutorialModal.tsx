import React, { useState } from 'react';
import { X, ChevronRight, Search, Calendar, MessageCircle, CreditCard, MapPin } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    title: "Welcome to Serenity",
    description: "Your luxury escape begins here. Let us show you how to plan your perfect staycation in just a few simple steps.",
    icon: <MapPin size={64} className="text-primary" />
  },
  {
    title: "Find Your Sanctuary",
    description: "Browse our exclusive collection of rooms. Use the Search bar to filter by dates and guest count to find real-time availability.",
    icon: <Search size={64} className="text-accent" />
  },
  {
    title: "Seamless Booking",
    description: "Select your dates on the calendar. Our secure booking process is instant—no waiting for confirmations.",
    icon: <Calendar size={64} className="text-primary" />
  },
  {
    title: "Ask Our AI Concierge",
    description: "Have a specific question? Tap the chat icon in the bottom right. Our AI Concierge is available 24/7 to help with amenities and policies.",
    icon: <MessageCircle size={64} className="text-accent" />
  },
  {
    title: "Manage Your Stay",
    description: "Already booked? Use 'My Bookings' to view details, check status, or manage your reservation using your email.",
    icon: <CreditCard size={64} className="text-primary" />
  }
];

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
      setTimeout(() => setCurrentStep(0), 300);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-pop flex flex-col min-h-[450px]">
        <div className="absolute top-4 right-4 z-10">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-8 bg-surface p-6 rounded-full shadow-inner animate-fade-in-up ring-4 ring-white">
            {STEPS[currentStep].icon}
          </div>
          
          <h3 className="text-2xl font-serif font-bold text-secondary mb-4 animate-fade-in min-h-[2em] flex items-end justify-center">
            {STEPS[currentStep].title}
          </h3>
          
          <p className="text-gray-500 leading-relaxed animate-fade-in min-h-[5em]">
            {STEPS[currentStep].description}
          </p>
        </div>

        <div className="p-6 bg-gray-50 flex items-center justify-between border-t border-gray-100">
          <div className="flex space-x-1.5">
            {STEPS.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-primary' : 'w-2 bg-gray-300'}`} 
              />
            ))}
          </div>

          <div className="flex space-x-3">
            {currentStep > 0 && (
               <button 
                onClick={handlePrev}
                className="px-4 py-2 text-gray-500 hover:text-gray-800 font-medium text-sm transition-colors"
              >
                Back
              </button>
            )}
            <button 
              onClick={handleNext}
              className="px-6 py-2 bg-secondary text-white rounded-full font-bold text-sm hover:bg-primary transition-all shadow-lg flex items-center"
            >
              {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
              {currentStep !== STEPS.length - 1 && <ChevronRight size={16} className="ml-1" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;