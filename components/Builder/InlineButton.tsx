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
    icon?: React.ReactNode;
    defaultText?: string;
    textColor?: string;
    onTextColorChange?: (val: string) => void;
    fontFamily?: string;
    onFontFamilyChange?: (val: string) => void;
}

const InlineButton: React.FC<InlineButtonProps> = ({
    text,
    onTextChange,
    color,
    onColorChange,
    isEditing,
    onClick,
    className = "",
    icon,
    defaultText = "Explore Rooms",
    textColor,
    onTextColorChange,
    fontFamily = "sans",
    onFontFamilyChange
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Map fontFamily key to actual CSS font-family string
    const fontFamilyMap: Record<string, string> = {
        'sans': 'Arial, Helvetica, sans-serif',
        'serif': 'Georgia, "Times New Roman", serif',
        'mono': '"Courier New", Consolas, monospace',
        'helvetica': '"Helvetica Neue", Helvetica, Arial, sans-serif',
        'verdana': 'Verdana, Geneva, sans-serif',
        'trebuchet': '"Trebuchet MS", Helvetica, sans-serif',
        'tahoma': 'Tahoma, Geneva, Verdana, sans-serif',
        'segoe': '"Segoe UI", sans-serif',
        'century': '"Century Gothic", sans-serif',
        'garamond': 'Garamond, "Times New Roman", serif',
        'palatino': '"Palatino Linotype", Palatino, serif',
        'baskerville': 'Baskerville, "Hoefler Text", serif',
        'cambria': 'Cambria, Georgia, serif',
        'georgia': 'Georgia, serif',
        'times': '"Times New Roman", Times, serif',
        'courier': '"Courier New", Courier, monospace',
        'consolas': 'Consolas, monaco, monospace',
        'impact': 'Impact, Charcoal, sans-serif',
        'comic': '"Comic Sans MS", cursive, sans-serif',
        'brush': '"Brush Script MT", cursive',
        'copperplate': 'Copperplate, "Copperplate Gothic Light", fantasy',
    };
    const resolvedFont = fontFamilyMap[fontFamily] || fontFamilyMap['sans'];

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
                className={`inline-flex items-center justify-center px-10 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-primary transition-all duration-300 transform hover:scale-105 shadow-2xl group cursor-pointer ${className}`}
                style={{ backgroundColor: color, color: textColor || (color === '#ffffff' ? '#000000' : 'var(--color-secondary)'), fontFamily: resolvedFont }}
            >
                {icon}
                {text || defaultText}
            </button>
        );
    }

    return (
        <div className="relative inline-block hover:z-[40] focus-within:z-[50]" ref={wrapperRef}>
            {/* Custom Toolbar Popup */}
            {isFocused && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-white rounded-xl shadow-2xl border border-gray-100 p-3 z-[9999] animate-fade-in-up md:w-max min-w-[280px] flex flex-col gap-3">
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
                                <Palette size={14} /> Button Color (Click box below)
                            </span>
                            <div className="flex gap-2 items-center">
                                <span className="text-xs font-mono text-gray-800 bg-gray-100 px-1 py-0.5 rounded">{color.toUpperCase()}</span>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => onColorChange(e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer p-0 border-2 border-gray-200 hover:border-primary transition-colors"
                                    title="Choose Custom Color"
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

                    <div className="h-px w-full bg-gray-100 mt-2" />

                    <div>
                        <div className="flex items-center justify-between mb-2 mt-2">
                            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                                <Type size={14} /> Font Settings
                            </span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <select
                                value={fontFamily}
                                onChange={(e) => onFontFamilyChange?.(e.target.value)}
                                className="bg-white border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-primary flex-1 font-medium cursor-pointer"
                            >
                                <optgroup label="Sans-Serif">
                                    <option value="sans">Arial (Default)</option>
                                    <option value="helvetica">Helvetica</option>
                                    <option value="verdana">Verdana</option>
                                    <option value="trebuchet">Trebuchet MS</option>
                                    <option value="tahoma">Tahoma</option>
                                    <option value="segoe">Segoe UI</option>
                                    <option value="century">Century Gothic</option>
                                </optgroup>
                                <optgroup label="Serif (Elegant)">
                                    <option value="serif">Georgia</option>
                                    <option value="times">Times New Roman</option>
                                    <option value="garamond">Garamond</option>
                                    <option value="palatino">Palatino</option>
                                    <option value="baskerville">Baskerville</option>
                                    <option value="cambria">Cambria</option>
                                </optgroup>
                                <optgroup label="Monospace">
                                    <option value="mono">Courier New</option>
                                    <option value="consolas">Consolas</option>
                                </optgroup>
                                <optgroup label="Decorative">
                                    <option value="impact">Impact</option>
                                    <option value="comic">Comic Sans</option>
                                    <option value="brush">Brush Script</option>
                                    <option value="copperplate">Copperplate</option>
                                </optgroup>
                            </select>

                            <div className="flex items-center gap-2 border border-gray-200 rounded px-2 py-1 bg-white cursor-pointer hover:border-primary transition-colors">
                                <span className="text-xs font-medium text-gray-500">Color</span>
                                <input
                                    type="color"
                                    value={textColor || '#ffffff'}
                                    onChange={(e) => onTextColorChange?.(e.target.value)}
                                    className="w-5 h-5 rounded cursor-pointer p-0 border-0 bg-transparent"
                                    title="Custom Text Color"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Triangle pointer */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45 shadow-sm"></div>
                </div>
            )}

            {/* Editing Button */}
            <div
                onClick={handleButtonClick}
                className={`inline-flex items-center justify-center px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform shadow-2xl group cursor-pointer border-2 border-dashed ${isFocused ? 'border-primary/50 scale-105 shadow-primary/20 bg-white' : 'border-white/50 hover:border-white hover:scale-105'} ${className}`}
                style={{
                    backgroundColor: isFocused ? '#ffffff' : color,
                    color: isFocused ? 'var(--color-primary)' : (textColor || (color === '#ffffff' ? '#000000' : 'var(--color-secondary)')),
                    fontFamily: resolvedFont
                }}
            >
                {icon}
                {text || defaultText}
            </div>
        </div>
    );
};

export default InlineButton;
