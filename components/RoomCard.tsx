import React from 'react';
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
      className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-gray-100 flex flex-col h-full transform-gpu relative isolation-isolate"
      // This mask-image fixes the safari/chrome bug where border-radius is lost during child transform
      style={{ maskImage: 'radial-gradient(white, black)', WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
    >
      <div 
        className="h-64 overflow-hidden relative bg-gray-200 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(room, true);
        }}
      >
        {/* Image */}
        <img 
          src={room.image} 
          alt={room.name} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 pointer-events-none">
           <h3 className="text-lg sm:text-xl font-serif font-bold text-white shadow-black drop-shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">{room.name}</h3>
        </div>

        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-bold text-secondary shadow-sm z-20 flex items-center border border-white/50">
           <span className="text-accent mr-1">₱</span> {room.price.toLocaleString()} <span className="text-gray-400 font-normal text-xs ml-1">/ night</span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col relative bg-white">
        <p className="text-gray-600 text-sm mb-6 line-clamp-3 flex-1 leading-relaxed font-light">{room.description}</p>
        
        <div className="mt-auto space-y-5">
            {/* Amenities Badges */}
            <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-surface text-secondary border border-secondary/10">
                   <Users size={12} className="mr-1.5"/> {room.capacity} Guests
                </span>
                {room.amenities.slice(0, 3).map((am, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-50/50 text-primary border border-primary/10">
                        {renderIcon(am)} <span className="ml-1.5">{am.name}</span>
                    </span>
                ))}
                
                {/* Always show an option to view amenities if they exist */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(room, false);
                    }}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:border-primary/50 hover:text-primary transition-colors"
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
                   View Details & Book <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform duration-300"/>
                </span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;