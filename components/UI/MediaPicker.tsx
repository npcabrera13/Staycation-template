import React, { useState } from 'react';
import { X, Search, Upload as UploadIcon, ImageOff } from 'lucide-react';
import { ImageUploadButton } from './ImageUploadButton';

interface MediaPickerProps {
    /** All image URLs collected from the app — will be deduplicated automatically */
    images: string[];
    onSelect: (url: string) => void;
    onClose: () => void;
    onUploadSuccess?: (url: string) => void;
    onUploadError?: (err: string) => void;
}

const MediaPicker: React.FC<MediaPickerProps> = ({
    images,
    onSelect,
    onClose,
    onUploadSuccess,
    onUploadError,
}) => {
    const [search, setSearch] = useState('');
    const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

    // Deduplicate and filter out empty strings
    const deduped = Array.from(new Set(images.filter(Boolean)));
    const filtered = search
        ? deduped.filter(url => url.toLowerCase().includes(search.toLowerCase()))
        : deduped;

    const handleSelect = (url: string) => {
        onSelect(url);
        onClose();
    };

    const handleUpload = (url: string) => {
        onUploadSuccess?.(url);
        onSelect(url);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                        📷 Choose from Gallery
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Search + Upload */}
                <div className="flex gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter images..."
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                        />
                    </div>
                    <ImageUploadButton
                        onUploadSuccess={handleUpload}
                        onUploadError={onUploadError || (() => {})}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2 flex-shrink-0 transition-colors"
                        buttonText="Upload New"
                    />
                </div>

                {/* Image Grid */}
                <div className="overflow-y-auto flex-1 p-4">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <ImageOff size={36} className="mb-3 opacity-30" />
                            <p className="text-sm font-semibold">No images yet</p>
                            <p className="text-xs mt-1 text-center max-w-xs">
                                Images from your rooms and hero section will appear here. Upload one to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {filtered.map((url, i) => {
                                if (failedUrls.has(url)) return null;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleSelect(url)}
                                        className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all shadow-sm hover:shadow-lg focus:outline-none focus:border-primary"
                                    >
                                        <img
                                            src={url}
                                            alt=""
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                            onError={() => setFailedUrls(prev => new Set([...prev, url]))}
                                        />
                                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="bg-white/95 text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                                                Select
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 text-center">
                    <p className="text-[10px] text-gray-400">
                        {deduped.length} image{deduped.length !== 1 ? 's' : ''} — all images from your rooms and site are shown here
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MediaPicker;
