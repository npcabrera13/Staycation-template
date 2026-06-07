import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Navigation, Check } from 'lucide-react';

interface MapPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (locationName: string, embedUrl: string) => void;
    currentLocationName?: string;
    currentEmbedUrl?: string;
}

interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
}

const cleanGoogleMapUrl = (input: string): string => {
    let value = input.trim();
    if (!value) return '';

    // 1. If it's an <iframe> tag, extract the src attribute
    if (value.includes('<iframe') && value.includes('src="')) {
        const match = value.match(/src="([^"]+)"/);
        if (match && match[1]) {
            value = match[1];
        }
    }

    // 1b. Decode HTML entities (&#39; → ', &amp; → &, etc.)
    // Google Maps "Share → Embed" iframes contain these entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    value = textarea.value;

    // 2. If it's already an embed URL, return it
    if (value.includes('/maps/embed') || value.includes('output=embed')) {
        return value;
    }

    // 3. Check for coordinates format: "lat, lng" (e.g. 15.3031, 120.9092)
    const latLngRegex = /^[-+]?([1-9]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
    if (latLngRegex.test(value)) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(value)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    // 4. Check for Google Maps search / query link formats
    try {
        if (value.includes('google.com/maps')) {
            const urlObj = new URL(value);
            
            const qParam = urlObj.searchParams.get('q');
            if (qParam) {
                return `https://maps.google.com/maps?q=${encodeURIComponent(qParam)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
            }

            if (urlObj.pathname.includes('/place/')) {
                const parts = urlObj.pathname.split('/place/');
                if (parts[1]) {
                    const placeName = decodeURIComponent(parts[1].split('/')[0]).replace(/\+/g, ' ');
                    return `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                }
            }
        }
    } catch (e) {
        console.error('Error parsing Google Maps URL:', e);
    }

    if (value.startsWith('http')) {
        return value;
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(value)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
};

const MapPickerModal: React.FC<MapPickerModalProps> = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    currentLocationName,
    currentEmbedUrl
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    
    // Selected states
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedName, setSelectedName] = useState<string | null>(null);
    
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    
    // Leaflet map refs
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    // 1. Dynamic CDN script loading for Leaflet (JS and CSS)
    useEffect(() => {
        if (!isOpen) return;
        
        if ((window as any).L) {
            setLeafletLoaded(true);
            return;
        }

        // Inject Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.id = 'leaflet-css';
        document.head.appendChild(link);

        // Inject Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.id = 'leaflet-js';
        script.async = true;
        script.onload = () => {
            setLeafletLoaded(true);
        };
        document.body.appendChild(script);

        return () => {
            // Leave script and link injected to avoid re-fetching on next open
        };
    }, [isOpen]);

    // 2. Reverse Geocoding helper (Convert Lat/Lng back to human address)
    const getReverseGeocode = async (lat: number, lon: number): Promise<string> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            if (data && data.address) {
                const addr = data.address;
                const parts: string[] = [];
                
                // Construct a simplified friendly address
                if (addr.hotel || addr.resort || addr.tourism || addr.guest_house) {
                    parts.push(addr.hotel || addr.resort || addr.tourism || addr.guest_house);
                }
                if (addr.amenity || addr.shop) {
                    parts.push(addr.amenity || addr.shop);
                }
                if (addr.road) {
                    parts.push(addr.road);
                }
                if (addr.suburb || addr.village || addr.neighbourhood || addr.quarter) {
                    parts.push(addr.suburb || addr.village || addr.neighbourhood || addr.quarter);
                }
                if (addr.city || addr.town || addr.municipality) {
                    parts.push(addr.city || addr.town || addr.municipality);
                }
                if (addr.province || addr.state) {
                    parts.push(addr.province || addr.state);
                }

                if (parts.length > 0) {
                    return parts.slice(0, 4).join(', '); // Keep it reasonably short
                }
                return data.display_name.split(',').slice(0, 3).join(',').trim();
            }
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
        }
        return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    };

    // 3. Set initial states from props when modal opens
    useEffect(() => {
        if (isOpen) {
            if (currentLocationName) {
                setSelectedName(currentLocationName);
                setQuery(currentLocationName);
            }
            if (currentEmbedUrl) {
                setPreviewUrl(currentEmbedUrl);
            } else {
                // Default fallback: El Nido coordinates
                setPreviewUrl('https://maps.google.com/maps?q=11.224378,119.346372&t=&z=15&ie=UTF8&iwloc=&output=embed');
            }
        }
    }, [isOpen, currentLocationName, currentEmbedUrl]);

    // 4. Initialize and bind Leaflet Map
    useEffect(() => {
        if (!isOpen || !leafletLoaded || !mapContainerRef.current) return;

        const L = (window as any).L;
        if (!L) return;

        // Determine initial map coordinates
        let startLat = 11.224378;
        let startLon = 119.346372;

        const activeUrl = previewUrl || currentEmbedUrl;
        if (activeUrl) {
            const match = activeUrl.match(/q=([-+]?\d+\.\d+),([-+]?\d+\.\d+)/);
            if (match && match[1] && match[2]) {
                startLat = parseFloat(match[1]);
                startLon = parseFloat(match[2]);
            }
        }

        // Initialize map instance
        const map = L.map(mapContainerRef.current, {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([startLat, startLon], 14);
        mapRef.current = map;

        // Load OpenStreetMap Tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Add Draggable Location Marker
        const marker = L.marker([startLat, startLon], { 
            draggable: true,
            autoPan: true
        }).addTo(map);
        markerRef.current = marker;

        // Custom marker icon stylesheet inject (fixes Leaflet icon asset loading 404s in React builds)
        const markerStyle = document.createElement('style');
        markerStyle.innerHTML = `
            .leaflet-default-icon-path {
                background-image: url(https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png);
            }
        `;
        document.head.appendChild(markerStyle);

        // Handle marker drag end
        marker.on('dragend', async () => {
            const pos = marker.getLatLng();
            const embedUrl = `https://maps.google.com/maps?q=${pos.lat},${pos.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
            setPreviewUrl(embedUrl);
            setSelectedName('Loading selected address...');
            
            const address = await getReverseGeocode(pos.lat, pos.lng);
            setSelectedName(address);
        });

        // Handle direct click on map
        map.on('click', async (e: any) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            
            const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
            setPreviewUrl(embedUrl);
            setSelectedName('Loading selected address...');
            
            const address = await getReverseGeocode(lat, lng);
            setSelectedName(address);
        });

        // Refresh Leaflet size context for correct layout
        setTimeout(() => {
            map.invalidateSize();
        }, 200);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
            }
            if (markerStyle.parentNode) {
                markerStyle.parentNode.removeChild(markerStyle);
            }
        };
    }, [isOpen, leafletLoaded]);

    // 5. Nominatim OpenStreetMap Search
    // 5. Nominatim OpenStreetMap Search
    const handleSearch = async (text: string) => {
        setQuery(text);
        if (text.length < 3) {
            setResults([]);
            return;
        }

        // A. Handle coordinates search immediately (e.g. "15.3031, 120.9092")
        const latLngRegex = /^[-+]?([1-9]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
        if (latLngRegex.test(text.trim())) {
            const parts = text.trim().split(',');
            const lat = parseFloat(parts[0]);
            const lon = parseFloat(parts[1]);
            const embedUrl = `https://maps.google.com/maps?q=${lat},${lon}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
            setPreviewUrl(embedUrl);
            setSelectedName('Loading coordinates...');
            
            if (mapRef.current && markerRef.current) {
                mapRef.current.setView([lat, lon], 16);
                markerRef.current.setLatLng([lat, lon]);
            }
            
            const address = await getReverseGeocode(lat, lon);
            setSelectedName(address);
            setResults([]);
            return;
        }

        // B. Handle raw Google Maps URLs and iframes
        if (text.includes('<iframe') || text.includes('google.com/maps') || text.includes('/maps/embed')) {
            const cleaned = cleanGoogleMapUrl(text);
            if (cleaned && cleaned.startsWith('http')) {
                setPreviewUrl(cleaned);
                
                // Try to center Leaflet marker at coordinates if they are in the URL
                const coordMatch = cleaned.match(/q=([-+]?\d+\.\d+),([-+]?\d+\.\d+)/);
                if (coordMatch && coordMatch[1] && coordMatch[2]) {
                    const lat = parseFloat(coordMatch[1]);
                    const lon = parseFloat(coordMatch[2]);
                    if (mapRef.current && markerRef.current) {
                        mapRef.current.setView([lat, lon], 16);
                        markerRef.current.setLatLng([lat, lon]);
                    }
                    setSelectedName('Loading custom map...');
                    const address = await getReverseGeocode(lat, lon);
                    setSelectedName(address);
                }
                setResults([]);
                return;
            }
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(async () => {
            setIsLoading(true);
            try {
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
        }, 400);
    };

    // 6. Handle selection of search result
    const handleSelectResult = async (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        const name = result.display_name.split(',').slice(0, 3).join(',').trim();

        const embedUrl = `https://maps.google.com/maps?q=${lat},${lon}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        setPreviewUrl(embedUrl);
        setSelectedName(name);
        setResults([]); // Clear search list

        // Move Leaflet map view and marker to the chosen coordinate
        if (mapRef.current && markerRef.current) {
            mapRef.current.setView([lat, lon], 16);
            markerRef.current.setLatLng([lat, lon]);
        }
    };

    const handleConfirm = () => {
        if (selectedName && previewUrl) {
            onSelect(selectedName, previewUrl);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start md:items-center justify-center bg-black/70 backdrop-blur-md p-4 pt-12 md:pt-4 animate-fade-in overflow-hidden">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col h-[85vh] max-h-[750px] overflow-hidden animate-scale-in border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <MapPin className="text-primary" /> Select Resort Location
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Search or click directly on the map to pin your staycation location</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search Input Bar */}
                <div className="p-6 pb-3 relative">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Search city, town, address or landmark..."
                            className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {isLoading ? (
                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-spin" size={18} />
                        ) : query && (
                            <button
                                onClick={() => {
                                    setQuery('');
                                    setResults([]);
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Google Maps Helper Link */}
                    <div className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 flex items-center justify-between px-1 select-none">
                        <span>Can't find your resort?</span>
                        <a 
                            href="https://www.google.com/maps" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-semibold flex items-center gap-0.5"
                        >
                            Open Google Maps to copy coordinates or iframe ↗
                        </a>
                    </div>

                    {/* Autocomplete Search Results */}
                    {results.length > 0 && (
                        <div className="absolute left-6 right-6 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-[300] overflow-hidden max-h-60 overflow-y-auto">
                            {results.map((res, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectResult(res)}
                                    className="w-full text-left px-5 py-3.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-start gap-3.5 group"
                                >
                                    <MapPin className="text-gray-400 mt-1 shrink-0" size={15} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                                            {res.display_name}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Map Display Area */}
                <div className="flex-1 px-6 pb-2 relative flex flex-col min-h-0">
                    <div className="flex-1 w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner bg-gray-50 relative">
                        {!leafletLoaded && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-400">
                                <Loader2 className="animate-spin text-primary mb-2" size={24} />
                                <span className="text-xs font-medium">Loading interactive map...</span>
                            </div>
                        )}
                        <div 
                            ref={mapContainerRef} 
                            className="w-full h-full z-10" 
                            style={{ minHeight: '100%' }}
                        />
                    </div>
                </div>

                {/* Selected Location Banner & Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex flex-col gap-4">
                    {selectedName && (
                        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-xl p-3 flex gap-2.5 items-center">
                            <Navigation size={15} className="text-primary animate-pulse shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-primary font-bold uppercase tracking-wider">Pin Location</div>
                                <div className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
                                    {selectedName}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!previewUrl || selectedName === 'Loading selected address...'}
                            className={`flex-[2] py-3 text-xs rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                previewUrl && selectedName !== 'Loading selected address...'
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95' 
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <Check size={16} /> Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapPickerModal;
