import React, { useState, useRef, useEffect } from 'react';
import { Move, ZoomIn } from 'lucide-react';

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
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentPos, setCurrentPos] = useState(objectPosition);
    const [currentScale, setCurrentScale] = useState(externalScale);
    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const pinchStartDistRef = useRef<number | null>(null);
    const pinchStartScaleRef = useRef<number>(1);

    useEffect(() => { setCurrentPos(objectPosition); }, [objectPosition]);
    useEffect(() => { setCurrentScale(externalScale); }, [externalScale]);

    const clampScale = (s: number) => Math.min(3, Math.max(1, parseFloat(s.toFixed(2))));

    const applyScale = (s: number) => {
        const clamped = clampScale(s);
        setCurrentScale(clamped);
        onScaleChange?.(clamped);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!isEditing) return;
        e.preventDefault();
        applyScale(currentScale + (e.deltaY > 0 ? -0.1 : 0.1));
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isEditing) return;
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activePointersRef.current.size === 1) {
            e.preventDefault();
            setIsDragging(true);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        } else if (activePointersRef.current.size === 2) {
            setIsDragging(false);
            const pts = Array.from(activePointersRef.current.values());
            pinchStartDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            pinchStartScaleRef.current = currentScale;
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isEditing) return;
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activePointersRef.current.size >= 2) {
            const pts = Array.from(activePointersRef.current.values());
            const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            if (pinchStartDistRef.current) applyScale(pinchStartScaleRef.current * (dist / pinchStartDistRef.current));
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
        if (activePointersRef.current.size < 2) pinchStartDistRef.current = null;
    };

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden group/frame select-none ${aspectRatio} ${className} ${!disableDecorations ? 'rounded-3xl shadow-lg' : ''} ${isEditing ? `cursor-move ${!disableDecorations ? 'ring-offset-4 ring-primary hover:ring-2' : ''}` : ''} transition-shadow duration-300`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            style={{ touchAction: isEditing ? 'none' : 'auto' }}
        >
            <img
                src={src} alt={alt} loading="lazy" decoding="async" draggable={false}
                style={{ objectPosition: currentPos, transform: `scale(${currentScale})`, transformOrigin: 'center center' }}
                className={`w-full h-full object-cover pointer-events-none ${!isEditing ? 'transition-all duration-700 group-hover/frame:scale-110' : 'transition-transform duration-75'}`}
            />
            {isEditing && (
                <>
                    <div className={`absolute inset-0 bg-primary/10 border-2 border-dashed transition-opacity duration-300 pointer-events-none ${isDragging ? 'opacity-100 border-primary' : 'opacity-0 group-hover/frame:opacity-100 border-white/50'}`} />
                    <div className={`absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[9px] px-2 py-1 rounded-full flex items-center gap-1.5 pointer-events-none transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover/frame:opacity-100'}`}>
                        <Move size={9} /> Drag &nbsp;·&nbsp; <ZoomIn size={9} /> Scroll/Pinch
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/40 text-white text-[9px] px-2 py-0.5 rounded-full pointer-events-none opacity-0 group-hover/frame:opacity-80 transition-opacity">
                        {Math.round(currentScale * 100)}%
                    </div>
                </>
            )}
            {!isEditing && <div className="absolute inset-0 bg-black/5 group-hover/frame:bg-black/0 pointer-events-none" />}
        </div>
    );
};

export default GalleryFrame;
