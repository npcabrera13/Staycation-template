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
        '#ec4899', '#db2777', '#be185d', '#f43f5e', '#e11d48',
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
        <div className={`flex flex-wrap items-center gap-1 bg-white shadow-xl rounded-lg p-2 border border-gray-100 font-sans text-base font-normal tracking-normal normal-case leading-normal text-left text-gray-800 ${className}`}>
            {buttons.map((btn, idx) => {
                if (btn.type === 'separator') {
                    return <div key={idx} className="w-px h-6 bg-gray-200 mx-1" />;
                }
                const Icon = btn.icon!;
                return (
                    <button
                        key={idx}
                        onClick={() => onFormat(btn.command)}
                        onMouseDown={(e) => e.preventDefault()} // Prevent focus loss for standard buttons
                        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-primary transition-colors"
                        title={btn.label}
                    >
                        <Icon size={16} />
                    </button>
                );
            })}

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Text Color Picker */}
            <div className="relative">
                <button
                    className={`p-2 rounded transition-colors ${isPaletteOpen ? 'bg-gray-100 text-primary' : 'text-gray-600 hover:bg-gray-100 hover:text-primary'}`}
                    onClick={() => {
                        setIsPaletteOpen(!isPaletteOpen);
                        setIsBgPaletteOpen(false);
                    }}
                // Don't prevent default here as we want to handle the click state cleanly, usually fine if focus shifts briefly as long as not blurring tool
                >
                    <Palette size={16} />
                </button>
                {isPaletteOpen && (
                    <div className="absolute top-full left-0 mt-2 p-2 bg-white shadow-xl rounded-lg border border-gray-100 z-[9999] w-48 animate-fade-in-up md:-left-8" style={{ bottom: 'auto' }}>
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
                    <div className="absolute top-full left-0 mt-2 p-2 bg-white shadow-xl rounded-lg border border-gray-100 z-50 w-48 animate-fade-in-up md:-left-8" style={{ bottom: 'auto' }}>
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

            <div className="ml-2 flex items-center border-l border-gray-200 pl-2">
                <select
                    onChange={(e) => onFormat('fontName', e.target.value)}
                    className="bg-transparent text-sm border-none focus:ring-0 text-gray-600 cursor-pointer w-24 py-1"
                    defaultValue=""
                    title="Font Style"
                >
                    <option value="" disabled>Font Style (Default)</option>
                    <optgroup label="Sans-Serif (Modern)">
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                        <option value="Tahoma, sans-serif">Tahoma</option>
                        <option value="'Segoe UI', sans-serif">Segoe UI</option>
                        <option value="Geneva, sans-serif">Geneva</option>
                        <option value="Optima, sans-serif">Optima</option>
                        <option value="'Century Gothic', sans-serif">Century Gothic</option>
                        <option value="'Lucida Grande', sans-serif">Lucida Grande</option>
                        <option value="system-ui, sans-serif">System UI</option>
                    </optgroup>
                    <optgroup label="Serif (Elegant/Traditional)">
                        <option value="'Times New Roman', Times, serif">Times New Roman</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Garamond, serif">Garamond</option>
                        <option value="'Palatino Linotype', Palatino, serif">Palatino</option>
                        <option value="'Bookman Old Style', serif">Bookman</option>
                        <option value="'Cambria', serif">Cambria</option>
                        <option value="'Baskerville', serif">Baskerville</option>
                        <option value="'Playfair Display', serif">Playfair Display</option>
                        <option value="'Merriweather', serif">Merriweather</option>
                    </optgroup>
                    <optgroup label="Monospace (Code/Typewriter)">
                        <option value="'Courier New', Courier, monospace">Courier New</option>
                        <option value="'Lucida Console', Monaco, monospace">Lucida Console</option>
                        <option value="Consolas, monospace">Consolas</option>
                        <option value="'Andale Mono', monospace">Andale Mono</option>
                        <option value="Menlo, monospace">Menlo</option>
                        <option value="Monaco, monospace">Monaco</option>
                    </optgroup>
                    <optgroup label="Decorative / Display">
                        <option value="'Brush Script MT', cursive">Brush Script MT</option>
                        <option value="Impact, fantasy">Impact</option>
                        <option value="'Comic Sans MS', cursive, sans-serif">Comic Sans</option>
                        <option value="'Papyrus', fantasy">Papyrus</option>
                        <option value="'Luminari', fantasy">Luminari</option>
                        <option value="'Bradley Hand', cursive">Bradley Hand</option>
                        <option value="'Copperplate', fantasy">Copperplate</option>
                    </optgroup>
                </select>
            </div>

            <div className="ml-2 flex items-center border-l border-gray-200 pl-2">
                <Type size={14} className="text-gray-400 mr-1" />
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded focus-within:border-primary focus-within:ring-1 focus-within:ring-primary overflow-hidden transition-colors">
                    <input
                        type="number"
                        placeholder="Size"
                        min="8"
                        max="300"
                        className="bg-transparent text-sm border-none focus:ring-0 text-gray-700 w-16 p-1 pl-2 outline-none"
                        onBlur={(e) => {
                            if (e.target.value) onFormat('fontSizePx', e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (e.currentTarget.value) onFormat('fontSizePx', e.currentTarget.value);
                            }
                        }}
                        title="Type custom font size and press Enter"
                    />
                    <span className="text-xs text-gray-400 pr-2 pointer-events-none">px</span>
                </div>
            </div>

        </div>
    );
};

export default RichTextToolbar;
