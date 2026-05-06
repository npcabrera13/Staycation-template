import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Move, ZoomIn, Check } from 'lucide-react';

interface GalleryFrameProps {
    src: string;
    alt: string;
    isEditing: boolean;
    objectPosition?: string;
    scale?: number;
    onPositionChange?: (pos: string) => void;
    onScaleChange?: (scale: number) => void;
    className?: string;
    aspectRatio?: string;
    disableDecorations?: boolean;
}

const GalleryFrame: React.FC<GalleryFrameProps> = ({
    src, alt, isEditing,
    objectPosition = "50% 50%",
    scale: externalScale = 1,
    onPositionChange, onScaleChange,
    className = "", aspectRatio = "h-full",
    disableDecorations = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isRepositioning, setIsRepositioning] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentPos, setCurrentPos] = useState(objectPosition);
    const [currentScale, setCurrentScale] = useState(externalScale);
    
    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const pinchStartDistRef = useRef<number | null>(null);
    const pinchStartScaleRef = useRef<number>(1);
    const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Determine if it's a touch device
    const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    const canInteract = isEditing && (!isTouchDevice || isRepositioning);

    useEffect(() => { setCurrentPos(objectPosition); }, [objectPosition]);
    useEffect(() => { setCurrentScale(externalScale); }, [externalScale]);

    const clampScale = (s: number) => Math.min(3, Math.max(1, parseFloat(s.toFixed(2))));

    const applyScale = (s: number) => {
        const clamped = clampScale(s);
        setCurrentScale(clamped);
        return clamped;
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!canInteract) return;
        e.preventDefault();
        const newScale = applyScale(currentScale + (e.deltaY > 0 ? -0.1 : 0.1));
        
        // Debounce the save for wheel events
        if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
        wheelTimeoutRef.current = setTimeout(() => {
            onScaleChange?.(newScale);
        }, 500);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!canInteract) return;
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        
        if (activePointersRef.current.size === 1) {
            e.preventDefault();
            setIsDragging(true);
            try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
        } else if (activePointersRef.current.size === 2) {
            setIsDragging(false);
            const pts = Array.from(activePointersRef.current.values()) as Array<{x: number, y: number}>;
            pinchStartDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            pinchStartScaleRef.current = currentScale;
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!canInteract) return;
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        
        if (activePointersRef.current.size >= 2) {
            const pts = Array.from(activePointersRef.current.values()) as Array<{x: number, y: number}>;
            const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            if (pinchStartDistRef.current) {
                applyScale(pinchStartScaleRef.current * (dist / pinchStartDistRef.current));
            }
        } else if (isDragging && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(100, 100 - ((e.clientX - rect.left) / rect.width) * 100));
            const y = Math.max(0, Math.min(100, 100 - ((e.clientY - rect.top) / rect.height) * 100));
            setCurrentPos(`${Math.round(x)}% ${Math.round(y)}%`);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        activePointersRef.current.delete(e.pointerId);
        
        if (isDragging) {
            setIsDragging(false);
            try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
            onPositionChange?.(currentPos);
        }
        
        if (activePointersRef.current.size < 2) {
            if (pinchStartDistRef.current !== null) {
                // Pinch ended, save scale
                onScaleChange?.(currentScale);
            }
            pinchStartDistRef.current = null;
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden group/frame select-none ${aspectRatio} ${className} ${!disableDecorations ? 'rounded-3xl shadow-lg' : ''} ${canInteract ? `cursor-move ${!disableDecorations ? 'ring-offset-4 ring-primary hover:ring-2' : ''}` : ''} transition-shadow duration-300`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            style={{ touchAction: canInteract ? 'none' : 'auto' }}
        >
            <img
                src={src} alt={alt} loading="lazy" decoding="async" draggable={false}
                style={{ objectPosition: currentPos, transform: `scale(${currentScale})`, transformOrigin: 'center center' }}
                className={`w-full h-full object-cover pointer-events-none ${!isEditing ? 'transition-all duration-700 group-hover/frame:scale-110' : 'transition-transform duration-75'}`}
            />
            
            {/* Desktop Tooltip */}
            {isEditing && !isTouchDevice && (
                <>
                    <div className={`absolute inset-0 bg-primary/10 border-2 border-dashed transition-opacity duration-300 pointer-events-none ${isDragging ? 'opacity-100 border-primary' : 'opacity-0 group-hover/frame:opacity-100 border-white/50'}`} />
                    <div className={`absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[9px] px-2 py-1 rounded-full flex items-center gap-1.5 pointer-events-none transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover/frame:opacity-100'}`}>
                        <Move size={9} /> Drag &nbsp;·&nbsp; <ZoomIn size={9} /> Scroll/Pinch
                    </div>
                </>
            )}

            {/* Mobile Reposition Buttons */}
            {isEditing && isTouchDevice && !isRepositioning && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsRepositioning(true); }}
                    className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-auto shadow-xl z-20 text-xs font-medium border border-white/20 active:scale-95 transition-transform"
                >
                    <Move size={14} /> Adjust Image
                </button>
            )}

            {isEditing && isTouchDevice && isRepositioning && (
                <>
                    <div className="absolute inset-0 bg-black/20 border-2 border-primary pointer-events-none z-10" />
                    <div className="absolute top-4 left-0 w-full flex justify-center pointer-events-none z-20">
                        <div className="bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl">
                            <ZoomIn size={12} /> Pinch to zoom, drag to move
                        </div>
                    </div>
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            setIsRepositioning(false); 
                            // Force save if they just dragged
                            onPositionChange?.(currentPos);
                            onScaleChange?.(currentScale);
                        }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-2.5 rounded-full font-bold pointer-events-auto shadow-[0_10px_25px_rgba(0,0,0,0.5)] z-50 flex items-center gap-2 border border-white/20 active:scale-95 transition-transform"
                    >
                        <Check size={16} /> Done Adjusting
                    </button>
                </>
            )}

            {(isEditing && (isDragging || isRepositioning)) && (
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded-lg pointer-events-none z-20 shadow-md">
                    {Math.round(currentScale * 100)}%
                </div>
            )}
            
            {!isEditing && <div className="absolute inset-0 bg-black/5 group-hover/frame:bg-black/0 pointer-events-none" />}
        </div>
    );
};

export default GalleryFrame;
