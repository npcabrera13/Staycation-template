import React, { useState, useRef, useEffect } from 'react';
import { Move } from 'lucide-react';

interface GalleryFrameProps {
    src: string;
    alt: string;
    isEditing: boolean;
    objectPosition?: string; // e.g. "50% 50%"
    scale?: number; // e.g. 1.2
    onPositionChange?: (pos: string) => void;
    className?: string;
    aspectRatio?: string; // Tailwind class like "aspect-square" or "h-full"
}

/**
 * A specialized component for gallery images that supports interactive dragging
 * to center the image (object-position) and zooming (scale).
 */
const GalleryFrame: React.FC<GalleryFrameProps> = ({
    src,
    alt,
    isEditing,
    objectPosition = "50% 50%",
    scale = 1,
    onPositionChange,
    className = "",
    aspectRatio = "h-full"
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentPos, setCurrentPos] = useState(objectPosition);

    // Sync internal state with external prop updates
    useEffect(() => {
        setCurrentPos(objectPosition);
    }, [objectPosition]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isEditing) return;
        // Don't prevent default on touch so page scrolling isn't blocked 
        // unless we want strictly "no scroll while dragging"
        e.preventDefault(); 
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !isEditing || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        
        // Invert the calculation: 100 - x% 
        // This makes dragging right move the image RIGHT (showing more of the left side)
        const x = Math.max(0, Math.min(100, 100 - ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, 100 - ((e.clientY - rect.top) / rect.height) * 100));
        
        const newPos = `${Math.round(x)}% ${Math.round(y)}%`;
        setCurrentPos(newPos);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        if (onPositionChange) {
            onPositionChange(currentPos);
        }
    };

    return (
        <div 
            ref={containerRef}
            className={`relative overflow-hidden rounded-3xl shadow-lg group/frame select-none ${aspectRatio} ${className} ${isEditing ? 'cursor-move ring-offset-4 ring-primary hover:ring-2' : ''} transition-shadow duration-300`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            touch-action="none" // Required for Pointer Events to work correctly on touch devices
        >
            <img 
                src={src} 
                alt={alt}
                loading="lazy"
                decoding="async"
                style={{ 
                    objectPosition: currentPos,
                    transform: `scale(${scale})`,
                }}
                className={`w-full h-full object-cover pointer-events-none ${!isEditing ? 'transition-all duration-700 group-hover/frame:scale-110' : ''}`}
                draggable={false}
            />
            
            {/* Editing Overlays */}
            {isEditing && (
                <>
                    <div className={`absolute inset-0 bg-primary/10 border-2 border-dashed transition-opacity duration-300 pointer-events-none ${isDragging ? 'opacity-100 border-primary border-opacity-100' : 'opacity-0 group-hover/frame:opacity-100 border-white/50'}`} />
                    <div className={`absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 transition-opacity pointer-events-none ${isDragging ? 'opacity-100' : 'opacity-0 group-hover/frame:opacity-100'}`}>
                        <Move size={10} /> Drag to Center
                    </div>
                </>
            )}
            
            {/* View Mode Overlay (Subtle shadow/depth) */}
            {!isEditing && <div className="absolute inset-0 bg-black/5 transition-colors group-hover/frame:bg-black/0 pointer-events-none" />}
        </div>
    );
};

export default GalleryFrame;
