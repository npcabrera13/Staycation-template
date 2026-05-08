import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Navigation, Check } from 'lucide-react';

interface MapPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (locationName: string, embedUrl: string) => void;
    currentLocationName?: string;
}

interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
}

const MapPickerModal: React.FC<MapPickerModalProps> = ({ isOpen, onClose, onSelect, currentLocationName }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedName, setSelectedName] = useState<string | null>(null);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Initial search if current location name is provided
    useEffect(() => {
        if (isOpen && currentLocationName && !query) {
            setQuery(currentLocationName);
        }
    }, [isOpen, currentLocationName]);

    const handleSearch = async (text: string) => {
        setQuery(text);
        if (text.length < 3) {
            setResults([]);
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Using Nominatim (OpenStreetMap) - Free, no key needed
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&addressdetails=1&limit=5`
                );
                const data = await response.json();
                setResults(data);
            } catch (error) {
                console.error('Map search failed:', error);
            } finally {
                setIsLoading(false);
            }
        }, 500);
    };

    const handleSelectResult = (result: SearchResult) => {
        const name = result.display_name;
        // Generate a Google Maps Embed URL from coordinates
        const embedUrl = `https://maps.google.com/maps?q=${result.lat},${result.lon}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        
        setSelectedName(name);
        setPreviewUrl(embedUrl);
        setResults([]); // Clear results after selection
    };

    const handleConfirm = () => {
        if (selectedName && previewUrl) {
            onSelect(selectedName, previewUrl);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center bg-black/60 backdrop-blur-md p-4 pt-12 md:pt-4 animate-fade-in overflow-hidden">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[calc(100svh-5rem)] md:max-h-[90vh] overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <MapPin className="text-primary" /> Select Your Location
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Search for your resort's exact name or address</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-6 pb-2">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text"
                            autoFocus
                            placeholder="Type resort name, street, or city..."
                            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {isLoading && (
                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-spin" size={18} />
                        )}
                        {/* Search Results Dropdown */}
                        {results.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-down">
                                {results.map((res, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectResult(res)}
                                        className="w-full text-left px-5 py-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-start gap-4 group"
                                    >
                                        <MapPin className="text-gray-400 mt-1 shrink-0" size={16} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                                {res.display_name}
                                            </div>
                                            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                Coordinates: {res.lat}, {res.lon}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {previewUrl ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Navigation size={14} className="text-primary" /> Live Preview
                                </div>
                                <div className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">Selected</div>
                            </div>
                            <div className="w-full h-64 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner bg-gray-100 relative">
                                <iframe 
                                    src={previewUrl}
                                    className="w-full h-full"
                                    style={{ border: 0 }}
                                    title="Selected location preview"
                                ></iframe>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-600 dark:text-gray-400 italic">"{selectedName}"</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <Search size={48} className="mb-4 opacity-20" />
                            <p className="text-sm">Search for a place to see the map preview</p>
                            <p className="text-[10px] mt-1 opacity-60">e.g. "Mall of Asia" or "El Nido Palawan"</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!previewUrl}
                        className={`flex-[2] py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            previewUrl 
                                ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:scale-[1.02]' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <Check size={18} /> Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapPickerModal;
