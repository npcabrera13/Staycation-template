import React, { useState, useRef, useEffect } from 'react';
import { Palette, Type } from 'lucide-react';

interface InlineButtonProps {
    text: string;
    onTextChange: (val: string) => void;
    color: string;
    onColorChange: (val: string) => void;
    isEditing: boolean;
    onClick?: () => void;
    className?: string; // Additional classes for the button itself
}

const InlineButton: React.FC<InlineButtonProps> = ({
    text,
    onTextChange,
    color,
    onColorChange,
    isEditing,
    onClick,
    className = ""
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const presetColors = [
        '#E9C46A', '#F4A261', '#E76F51', '#2A9D8F', '#264653',
        '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#000000', '#ffffff'
    ];

    // Close toolbar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsFocused(false);
                setShowColorPicker(false);
            }
        };

        if (isFocused) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isFocused]);

    const handleButtonClick = (e: React.MouseEvent) => {
        if (isEditing) {
            e.preventDefault();
            e.stopPropagation();
            setIsFocused(true);
        } else if (onClick) {
            onClick();
        }
    };

    if (!isEditing) {
        return (
            <button
                onClick={onClick}
                className={`inline-flex items-center px-10 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-primary transition-all duration-300 transform hover:scale-105 shadow-2xl group cursor-pointer ${className}`}
                style={{ backgroundColor: color, color: color === '#ffffff' ? '#000000' : 'var(--color-secondary)' }}
            >
                {text || "Explore Rooms"}
                <span className="ml-2 group-hover:translate-y-1 transition-transform">↓</span>
            </button>
        );
    }

    return (
        <div className="relative inline-block" ref={wrapperRef}>
            {/* Custom Toolbar Popup */}
            {isFocused && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-white rounded-xl shadow-2xl border border-gray-100 p-3 z-50 animate-fade-in-up md:w-max min-w-[280px] flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Type size={16} className="text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={text}
                            onChange={(e) => onTextChange(e.target.value)}
                            className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-800"
                            placeholder="Button Text"
                            autoFocus
                        />
                    </div>

                    <div className="h-px w-full bg-gray-100" />

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                                <Palette size={14} /> Button Color
                            </span>
                            <div className="flex gap-2 items-center">
                                <span className="text-xs font-mono text-gray-400">{color}</span>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => onColorChange(e.target.value)}
                                    className="w-6 h-6 rounded border-0 cursor-pointer p-0"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-6 gap-1.5 mt-2">
                            {presetColors.map(preset => (
                                <button
                                    key={preset}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onColorChange(preset);
                                    }}
                                    className={`w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-sm ${color === preset ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                    style={{ backgroundColor: preset }}
                                    title={preset}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Triangle pointer */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45 shadow-sm"></div>
                </div>
            )}

            {/* Editing Button */}
            <div
                onClick={handleButtonClick}
                className={`inline-flex items-center px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform shadow-2xl group cursor-pointer border-2 border-dashed ${isFocused ? 'border-white scale-105 shadow-primary/20 bg-white' : 'border-white/50 hover:border-white hover:scale-105'} ${className}`}
                style={{
                    backgroundColor: isFocused ? '#ffffff' : color,
                    color: isFocused ? 'var(--color-primary)' : (color === '#ffffff' ? '#000000' : 'var(--color-secondary)')
                }}
            >
                {text || "Explore Rooms"}
                <span className="ml-2 group-hover:translate-y-1 transition-transform">↓</span>
            </div>
        </div>
    );
};

export default InlineButton;
