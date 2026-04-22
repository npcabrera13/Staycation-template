import React, { useState, useRef, useEffect } from 'react';

const COLORS = [
    '#E9C46A', // Default Gold/Accent
    '#264653', // Default Primary/Teal
    '#2A9D8F', // Green
    '#F4A261', // Orange
    '#E76F51', // Rust
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
    '#d946ef', '#ec4899', '#f43f5e'
];

interface InlineColorBlockProps {
    color: string;
    onChange: (color: string) => void;
    className?: string;
    isEditing: boolean;
}

const InlineColorBlock: React.FC<InlineColorBlockProps> = ({
    color,
    onChange,
    className = "",
    isEditing
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [popupPosition, setPopupPosition] = useState<'above' | 'below'>('below');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isFocused && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            // If element is in bottom 45% of screen, open above; otherwise below
            if (rect.top > window.innerHeight * 0.55) {
                setPopupPosition('above');
            } else {
                setPopupPosition('below');
            }
        }
    }, [isFocused]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };

        if (isFocused) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isFocused]);

    if (!isEditing) {
        return (
            <div
                className={className}
                style={{ backgroundColor: color }}
            />
        );
    }

    return (
        <div
            ref={wrapperRef}
            className={`relative inline-block cursor-pointer hover:z-[40] focus-within:z-[50] group ${isFocused ? 'ring-2 ring-blue-500 ring-offset-4 rounded-full' : 'hover:ring-2 hover:ring-dashed hover:ring-gray-400 hover:ring-offset-4 hover:rounded-full'}`}
            onClick={(e) => {
                e.stopPropagation();
                setIsFocused(!isFocused);
            }}
        >
            <div
                className={className}
                style={{ backgroundColor: color }}
            />

            {isFocused && (
                <div
                    className={`absolute ${popupPosition === 'above' ? 'bottom-full mb-4' : 'top-full mt-4'} -right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-100 p-3 z-[9999] animate-fade-in-up w-max min-w-[280px]`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Triangle pointer */}
                    <div className={`absolute ${popupPosition === 'above' ? '-bottom-2 border-b border-r' : '-top-2 border-t border-l'} right-6 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-3 h-3 bg-white border-gray-100 transform rotate-45 shadow-sm`}></div>

                    <div className="flex flex-col gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-2 block">Divider Color</label>
                            <div className="grid grid-cols-7 gap-1">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => onChange(c)}
                                        className="w-6 h-6 rounded-full border border-gray-200 transition-transform hover:scale-110"
                                        style={{ backgroundColor: c }}
                                        title={c}
                                    />
                                ))}
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <label className="text-xs text-gray-500">Custom:</label>
                                <input
                                    type="color"
                                    value={color && color.startsWith('#') ? color : '#000000'}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer p-0 border-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InlineColorBlock;
