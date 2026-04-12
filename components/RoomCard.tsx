import React, { memo } from 'react';
import { Room } from '../types';
import {
  Users, Wifi, Wind, Coffee, ArrowRight, Waves, ChefHat, Car, Dumbbell, Tv, Shield, Sparkles,
  Utensils, Monitor, Zap, Sun, Umbrella, Music, Briefcase, Key, Bell, Bath, Armchair, Bike,
  ListPlus
} from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onSelect: (room: Room, openGallery?: boolean) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onSelect }) => {

  const iconMap: Record<string, React.ReactNode> = {
    'wifi': <Wifi size={14} />,
    'waves': <Waves size={14} />,
    'wind': <Wind size={14} />,
    'chef-hat': <ChefHat size={14} />,
    'coffee': <Coffee size={14} />,
    'car': <Car size={14} />,
    'dumbbell': <Dumbbell size={14} />,
    'tv': <Tv size={14} />,
    'shield': <Shield size={14} />,
    'sparkles': <Sparkles size={14} />,
    'utensils': <Utensils size={14} />,
    'monitor': <Monitor size={14} />,
    'zap': <Zap size={14} />,
    'sun': <Sun size={14} />,
    'umbrella': <Umbrella size={14} />,
    'music': <Music size={14} />,
    'briefcase': <Briefcase size={14} />,
    'key': <Key size={14} />,
    'bell': <Bell size={14} />,
    'bath': <Bath size={14} />,
    'armchair': <Armchair size={14} />,
    'bike': <Bike size={14} />
  };

  const renderIcon = (amenity: { name: string; icon: string }) => {
    if (iconMap[amenity.icon]) {
      return iconMap[amenity.icon];
    }
    const lowerName = amenity.name.toLowerCase();
    if (lowerName.includes('wifi')) return <Wifi size={14} />;
    if (lowerName.includes('pool')) return <Waves size={14} />;
    if (lowerName.includes('ac')) return <Wind size={14} />;
    if (lowerName.includes('kitchen')) return <ChefHat size={14} />;
    if (lowerName.includes('parking')) return <Car size={14} />;
    return <Sparkles size={14} />;
  };

  return (
    <div
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-gray-100 dark:border-gray-700 flex flex-col h-full min-h-[480px] transform-gpu relative isolation-isolate"
      // This mask-image fixes the safari/chrome bug where border-radius is lost during child transform
      style={{ maskImage: 'radial-gradient(white, black)', WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
    >
      <div
        className="h-64 overflow-hidden relative bg-gray-200 cursor-pointer rounded-t-2xl z-0 flex-shrink-0"
        style={{
          contain: 'paint',
          isolation: 'isolate',
          willChange: 'transform'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(room, true);
        }}
      >
        {/* Wrapper div for transform - transform applied here, not on image */}
        <div className="absolute inset-0 transform group-hover:scale-110 transition-transform duration-[1.5s] ease-out">
          <img
            src={room.image}
            alt={room.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 pointer-events-none">
          <h3 className="text-lg sm:text-xl font-serif font-bold text-white shadow-black drop-shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">{room.name}</h3>
        </div>

        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-white/95 dark:bg-black/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg z-30 flex items-center border border-white/50 dark:border-gray-700">
          <span className="text-primary dark:text-primary mr-0.5">₱</span><span className="text-gray-900 dark:text-white">{room.price.toLocaleString()}</span> <span className="text-gray-500 dark:text-gray-300 font-normal text-xs ml-1">/ night</span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col relative bg-white dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 line-clamp-2 min-h-[2.5rem] leading-relaxed font-light">{room.description}</p>

        <div className="mt-auto space-y-5">
          {/* Amenities Badges */}
          <div className="flex flex-wrap gap-2 min-h-[72px] content-start">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-surface dark:bg-gray-700 text-primary dark:text-gray-200 border border-primary/10 dark:border-gray-600">
              <Users size={12} className="mr-1.5" /> {room.capacity} Guests
            </span>
            {room.amenities.slice(0, 3).map((am, idx) => (
              <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/5 dark:bg-transparent text-primary border border-primary/10 dark:border-primary/40">
                {renderIcon(am)} <span className="ml-1.5">{am.name}</span>
              </span>
            ))}

            {/* Always show an option to view amenities if they exist */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(room, false);
              }}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-primary/50 hover:text-primary transition-colors"
            >
              <ListPlus size={12} className="mr-1.5" />
              {room.amenities.length > 3 ? `+${room.amenities.length - 3} more` : 'Amenities'}
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(room, false);
            }}
            className="w-full bg-secondary text-white py-3.5 rounded-xl font-semibold flex items-center justify-center group-hover:bg-primary transition-all duration-500 shadow-md hover:shadow-lg text-sm sm:text-base overflow-hidden relative cursor-pointer"
          >
            <span className="relative z-10 flex items-center">
              View Details & Book <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(RoomCard);