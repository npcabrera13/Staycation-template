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
        '#000000', '#FFFFFF', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6'
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
                    <div className="absolute top-full left-0 mt-2 p-2 bg-white shadow-xl rounded-lg border border-gray-100 grid grid-cols-4 gap-1 z-50 w-32 animate-fade-in-up md:-left-8" style={{ bottom: 'auto' }}>
                        {colors.map(color => (
                            <button
                                key={color}
                                onClick={() => handleColorClick(color)}
                                className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-sm"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
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
                    <div className="absolute top-full left-0 mt-2 p-2 bg-white shadow-xl rounded-lg border border-gray-100 grid grid-cols-4 gap-1 z-50 w-32 animate-fade-in-up md:-left-8" style={{ bottom: 'auto' }}>
                        {colors.map(color => (
                            <button
                                key={color}
                                onClick={() => handleBgColorClick(color)}
                                className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-sm"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                        <button
                            onClick={() => handleBgColorClick('transparent')}
                            className="col-span-4 mt-1 w-full text-xs py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>

            <div className="ml-2 flex items-center">
                <Type size={14} className="text-gray-400 mr-2" />
                <select
                    onChange={(e) => onFormat('fontSizePx', e.target.value)}
                    className="bg-transparent text-sm border-none focus:ring-0 text-gray-600 cursor-pointer w-20 py-1"
                    defaultValue="16"
                >
                    <option value="12">12px</option>
                    <option value="14">14px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                    <option value="20">20px</option>
                    <option value="24">24px</option>
                    <option value="28">28px</option>
                    <option value="32">32px</option>
                    <option value="36">36px</option>
                    <option value="42">42px</option>
                    <option value="48">48px</option>
                    <option value="60">60px</option>
                    <option value="72">72px</option>
                    <option value="96">96px</option>
                    <option value="112">112px</option>
                    <option value="128">128px</option>
                    <option value="144">144px</option>
                    <option value="160">160px</option>
                    <option value="180">180px</option>
                    <option value="200">200px</option>
                </select>
            </div>

        </div>
    );
};

export default RichTextToolbar;
