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
    disableHoverEffect?: boolean;
    onRepositioningChange?: (isRepositioning: boolean) => void;
    isRepositioning?: boolean;
}

const GalleryFrame: React.FC<GalleryFrameProps> = ({
    src, alt, isEditing,
    objectPosition = "50% 50%",
    scale: externalScale = 1,
    onPositionChange, onScaleChange,
    className = "", aspectRatio = "h-full",
    disableDecorations = false,
    disableHoverEffect = false,
    onRepositioningChange,
    isRepositioning: externalRepositioning
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);
    const [localRepositioning, setLocalRepositioning] = useState(false);
    const isRepositioning = externalRepositioning !== undefined ? externalRepositioning : localRepositioning;
    
    const setIsRepositioning = (val: boolean) => {
        if (externalRepositioning === undefined) {
            setLocalRepositioning(val);
        }
        onRepositioningChange?.(val);
    };
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentPos, setCurrentPos] = useState(objectPosition);
    const [currentScale, setCurrentScale] = useState(externalScale);
    
    // Create Refs to track the latest scale and position synchronously. 
    // This avoids stale closures when high-frequency pointermove events fire during dragging/zooming on PCs.
    const currentPosRef = useRef(objectPosition);
    const currentScaleRef = useRef(externalScale);
    
    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const pinchStartDistRef = useRef<number | null>(null);
    const pinchStartScaleRef = useRef<number>(1);
    const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Determine if it's a touch device
    const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    const canInteract = isEditing && (isRepositioning || (!isTouchDevice && isDragging));

    useEffect(() => { 
        setCurrentPos(objectPosition); 
        currentPosRef.current = objectPosition;
    }, [objectPosition]);

    useEffect(() => { 
        setCurrentScale(externalScale); 
        currentScaleRef.current = externalScale;
    }, [externalScale]);

    // Auto-zoom to 1.15x when entering repositioning mode if scale is 1, so the user can immediately drag the image bounds!
    useEffect(() => {
        if (isRepositioning && currentScaleRef.current === 1) {
            const autoScale = 1.15;
            setCurrentScale(autoScale);
            currentScaleRef.current = autoScale;
            onScaleChange?.(autoScale);
        }
    }, [isRepositioning]);

    const clampScale = (s: number) => Math.min(3, Math.max(1, parseFloat(s.toFixed(2))));

    const applyScale = (s: number) => {
        const clamped = clampScale(s);
        setCurrentScale(clamped);
        currentScaleRef.current = clamped;
        return clamped;
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!isEditing || !isRepositioning) return;
        
        // Only zoom if Ctrl (or Cmd on Mac) key is held down. 
        // This prevents accidental zooming when the user is simply trying to scroll up/down the page.
        // Note: Modern browser trackpad pinch gestures naturally trigger wheel events with e.ctrlKey = true under the hood, so pinch-zoom continues to work flawlessly out of the box!
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const newScale = applyScale(currentScaleRef.current + (e.deltaY > 0 ? -0.1 : 0.1));
            
            // Debounce the save for wheel events
            if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
            wheelTimeoutRef.current = setTimeout(() => {
                onScaleChange?.(currentScaleRef.current);
            }, 500);
        }
    };

    const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isEditing || (!isRepositioning && isTouchDevice)) return;
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        lastPointerRef.current = { x: e.clientX, y: e.clientY };
        
        if (activePointersRef.current.size === 1) {
            e.preventDefault();
            setIsDragging(true);
            isDraggingRef.current = true;
            try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
        } else if (activePointersRef.current.size === 2) {
            setIsDragging(false);
            isDraggingRef.current = false;
            const pts = Array.from(activePointersRef.current.values()) as Array<{x: number, y: number}>;
            pinchStartDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            pinchStartScaleRef.current = currentScaleRef.current;
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isEditing) return;
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        
        if (activePointersRef.current.size >= 2) {
            const pts = Array.from(activePointersRef.current.values()) as Array<{x: number, y: number}>;
            const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            if (pinchStartDistRef.current) {
                applyScale(pinchStartScaleRef.current * (dist / pinchStartDistRef.current));
            }
        } else if (isDraggingRef.current && containerRef.current && lastPointerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const dx = e.clientX - lastPointerRef.current.x;
            const dy = e.clientY - lastPointerRef.current.y;
            
            // Sensitivity: We move the "focus" faster when zoomed in
            // objectPosition works by shifting the image inside its fitted box
            // A 1% change in objectPosition shifts the image by (imageSize - elementSize) * 0.01
            const [curX, curY] = currentPosRef.current.split(' ').map(p => parseFloat(p));
            
            // Relative drag: if you drag 10px right, we want the image to shift right
            // Lower percentage means "show more left", so dragging right should decrease percentage
            const moveSpeed = 0.5 / currentScaleRef.current;
            const newX = Math.max(0, Math.min(100, curX - (dx / rect.width * 100 * moveSpeed)));
            const newY = Math.max(0, Math.min(100, curY - (dy / rect.height * 100 * moveSpeed)));
            
            const nextPos = `${Math.round(newX)}% ${Math.round(newY)}%`;
            currentPosRef.current = nextPos;
            setCurrentPos(nextPos);
        }
        lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        activePointersRef.current.delete(e.pointerId);
        lastPointerRef.current = null;
        
        if (isDraggingRef.current) {
            setIsDragging(false);
            isDraggingRef.current = false;
            try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
            onPositionChange?.(currentPosRef.current);
        }
        
        if (activePointersRef.current.size < 2) {
            if (pinchStartDistRef.current !== null) {
                onScaleChange?.(currentScaleRef.current);
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
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            style={{ touchAction: canInteract ? 'none' : 'auto' }}
        >
            <img
                src={src} alt={alt} loading="lazy" decoding="async" draggable={false}
                style={{ 
                    objectPosition: currentPos, 
                    transform: isEditing ? `scale(${currentScale})` : 'none',
                    transformOrigin: 'center center'
                }}
                className={`w-full h-full object-cover pointer-events-none ${!isEditing && !disableHoverEffect ? 'transition-all duration-700 group-hover/frame:scale-110' : 'transition-transform duration-75'}`}
            />
            
            {/* Desktop Tooltip */}
            {isEditing && !isTouchDevice && (
                <>
                    <div className={`absolute inset-0 bg-primary/10 border-2 border-dashed transition-opacity duration-300 pointer-events-none ${isDragging ? 'opacity-100 border-primary' : 'opacity-0 group-hover/frame:opacity-100 border-white/50'}`} />
                    <div className={`absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[9px] px-2 py-1 rounded-full flex items-center gap-1.5 pointer-events-none transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover/frame:opacity-100'}`}>
                        <Move size={9} /> Drag to Move &nbsp;·&nbsp; <ZoomIn size={9} /> Hold Ctrl + Scroll to Zoom
                    </div>
                </>
            )}

            {/* Mobile Reposition Buttons */}
            {isEditing && isTouchDevice && !isRepositioning && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsRepositioning(true); }}
                    className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-auto shadow-xl z-[40] text-xs font-medium border border-white/20 active:scale-95 transition-transform"
                >
                    <Move size={14} /> Adjust Image
                </button>
            )}

            {isEditing && isTouchDevice && isRepositioning && (
                <>
                    <div className="absolute inset-0 border-4 border-primary pointer-events-none z-[60]" />
                    <div className="absolute top-4 left-0 w-full flex justify-center pointer-events-none z-[70]">
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
                        className="absolute bottom-4 right-4 bg-primary text-white px-6 py-2.5 rounded-full font-bold pointer-events-auto shadow-[0_10px_25px_rgba(0,0,0,0.5)] z-[100] flex items-center gap-2 border border-white/20 active:scale-95 transition-transform"
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
            
            {!isEditing && !disableHoverEffect && <div className="absolute inset-0 bg-black/5 group-hover/frame:bg-black/0 pointer-events-none" />}
        </div>
    );
};

export default GalleryFrame;
