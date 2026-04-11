import React, { useState } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, Palette, Highlighter } from 'lucide-react';

interface RichTextToolbarProps {
    onFormat: (command: string, value?: string) => void;
    className?: string;
    currentFormat?: {
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        align?: 'left' | 'center' | 'right';
    }
}

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ onFormat, className = '', currentFormat }) => {
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [isBgPaletteOpen, setIsBgPaletteOpen] = useState(false);

    const buttons = [
        { icon: Bold, command: 'bold', label: 'Bold' },
        { icon: Italic, command: 'italic', label: 'Italic' },
        { icon: Underline, command: 'underline', label: 'Underline' },
        { type: 'separator' },
        { icon: AlignLeft, command: 'justifyLeft', label: 'Align Left' },
        { icon: AlignCenter, command: 'justifyCenter', label: 'Center' },
        { icon: AlignRight, command: 'justifyRight', label: 'Align Right' },
    ];

    const colors = [
        '#000000', '#ffffff', '#374151', '#6b7280', '#9ca3af',
        '#ef4444', '#dc2626', '#b91c1c', '#f97316', '#ea580c',
        '#f59e0b', '#d97706', '#eab308', '#ca8a04',
        '#22c55e', '#16a34a', '#15803d', '#10b981', '#059669',
        '#14b8a6', '#0d9488', '#06b6d4', '#0891b2',
        '#3b82f6', '#2563eb', '#1d4ed8', '#6366f1', '#4f46e5',
        '#8b5cf6', '#7c3aed', '#a855f7', '#9333ea',
        '#ec4899', '#db2777', '#be185d', '#f43f5e', '#e11d48'
    ];

    const handleColorClick = (color: string) => {
        onFormat('foreColor', color);
        setIsPaletteOpen(false);
    };

    const handleBgColorClick = (color: string) => {
        // Some browsers use backColor, some use hiliteColor. hiliteColor is the standard for text background
        onFormat('hiliteColor', color);
        setIsBgPaletteOpen(false);
    };

    return (
        <div className={`flex flex-col gap-1 bg-white shadow-xl rounded-lg p-1.5 border border-gray-100 font-sans text-base font-normal tracking-normal normal-case leading-normal text-left text-gray-800 w-full ${className}`}>
            {/* Row 1: Formatting buttons (bold/italic/underline, alignment, color pickers) */}
            <div className="flex items-center gap-0.5 flex-wrap">
                {buttons.map((btn, idx) => {
                    if (btn.type === 'separator') {
                        return <div key={idx} className="w-px h-6 bg-gray-200 mx-0.5" />;
                    }
                    const Icon = btn.icon!;
                    return (
                        <button
                            key={idx}
                            onClick={() => onFormat(btn.command)}
                            onMouseDown={(e) => e.preventDefault()}
                            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-primary transition-colors"
                            title={btn.label}
                        >
                            <Icon size={16} />
                        </button>
                    );
                })}

                <div className="w-px h-6 bg-gray-200 mx-0.5" />

                {/* Text Color Picker */}
                <div className="relative">
                    <button
                        className={`p-2 rounded transition-colors ${isPaletteOpen ? 'bg-gray-100 text-primary' : 'text-gray-600 hover:bg-gray-100 hover:text-primary'}`}
                        onClick={() => {
                            setIsPaletteOpen(!isPaletteOpen);
                            setIsBgPaletteOpen(false);
                        }}
                    >
                        <Palette size={16} />
                    </button>
                    {isPaletteOpen && (
                        <div className="absolute top-full right-0 md:left-0 md:right-auto mt-2 p-2 bg-white shadow-xl rounded-lg border border-gray-100 z-[9999] w-48 animate-fade-in-up" style={{ bottom: 'auto' }}>
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {colors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleColorClick(color)}
                                        onMouseDown={(e) => e.preventDefault()}
                                        className="w-5 h-5 rounded-full border border-gray-200 hover:scale-125 transition-transform shadow-sm"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-500">Custom:</span>
                                <input
                                    type="color"
                                    onChange={(e) => handleColorClick(e.target.value)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="w-6 h-6 rounded cursor-pointer p-0 border border-gray-200"
                                    title="Pick custom color"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Background Color Picker */}
                <div className="relative">
                    <button
                        className={`p-2 rounded transition-colors ${isBgPaletteOpen ? 'bg-gray-100 text-primary' : 'text-gray-600 hover:bg-gray-100 hover:text-primary'}`}
                        onClick={() => {
                            setIsBgPaletteOpen(!isBgPaletteOpen);
                            setIsPaletteOpen(false);
                        }}
                        title="Highlight / Button Color"
                    >
                        <Highlighter size={16} />
                    </button>
                    {isBgPaletteOpen && (
                        <div className="absolute top-full right-0 md:left-0 md:right-auto mt-2 p-2 bg-white shadow-xl rounded-lg border border-gray-100 z-50 w-48 animate-fade-in-up" style={{ bottom: 'auto' }}>
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {colors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleBgColorClick(color)}
                                        onMouseDown={(e) => e.preventDefault()}
                                        className="w-5 h-5 rounded-full border border-gray-200 hover:scale-125 transition-transform shadow-sm"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-500">Custom:</span>
                                <input
                                    type="color"
                                    onChange={(e) => handleBgColorClick(e.target.value)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="w-6 h-6 rounded cursor-pointer p-0 border border-gray-200"
                                    title="Pick custom highlight color"
                                />
                            </div>
                            <button
                                onClick={() => handleBgColorClick('transparent')}
                                onMouseDown={(e) => e.preventDefault()}
                                className="w-full mt-2 text-xs py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Row 2: Font style + size — full width so nothing overflows */}
            <div className="flex items-center gap-2 border-t border-gray-100 pt-1.5">
                <select
                    onChange={(e) => onFormat('fontName', e.target.value)}
                    className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 cursor-pointer py-1 px-2 outline-none focus:border-primary"
                    defaultValue=""
                    title="Font Style"
                >
                    <option value="" disabled>Font Style</option>
                    <optgroup label="Sans-Serif">
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                        <option value="Tahoma, sans-serif">Tahoma</option>
                        <option value="'Segoe UI', sans-serif">Segoe UI</option>
                        <option value="'Century Gothic', sans-serif">Century Gothic</option>
                    </optgroup>
                    <optgroup label="Serif">
                        <option value="'Times New Roman', Times, serif">Times New Roman</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Garamond, serif">Garamond</option>
                        <option value="'Palatino Linotype', Palatino, serif">Palatino</option>
                        <option value="'Cambria', serif">Cambria</option>
                        <option value="'Baskerville', serif">Baskerville</option>
                    </optgroup>
                    <optgroup label="Monospace">
                        <option value="'Courier New', Courier, monospace">Courier New</option>
                        <option value="Consolas, monospace">Consolas</option>
                    </optgroup>
                    <optgroup label="Decorative">
                        <option value="'Brush Script MT', cursive">Brush Script</option>
                        <option value="Impact, fantasy">Impact</option>
                        <option value="'Comic Sans MS', cursive, sans-serif">Comic Sans</option>
                        <option value="'Copperplate', fantasy">Copperplate</option>
                    </optgroup>
                </select>

                <div className="flex items-center gap-1 shrink-0">
                    <Type size={14} className="text-gray-400" />
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded focus-within:border-primary focus-within:ring-1 focus-within:ring-primary overflow-hidden transition-colors">
                        <input
                            type="number"
                            placeholder="Size"
                            min="8"
                            max="300"
                            className="bg-transparent text-sm border-none focus:ring-0 text-gray-700 w-12 p-1 pl-2 outline-none"
                            onBlur={(e) => {
                                if (e.target.value) onFormat('fontSizePx', e.target.value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (e.currentTarget.value) onFormat('fontSizePx', e.currentTarget.value);
                                }
                            }}
                            title="Font size in px"
                        />
                        <span className="text-xs text-gray-400 pr-1.5 pointer-events-none">px</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RichTextToolbar;

