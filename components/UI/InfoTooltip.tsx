import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
    text: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
    const [isVisible, setIsVisible] = useState(false);

    const toggle = (e: React.MouseEvent) => {
        // Prevent default click behavior if any
        e.preventDefault();
        e.stopPropagation();
        setIsVisible(!isVisible);
    };

    return (
        <span
            className="relative inline-flex items-center ml-1.5 align-middle"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <button
                type="button"
                onClick={toggle}
                className="text-gray-400 hover:text-primary transition-colors cursor-help focus:outline-none"
                aria-label="Info"
            >
                <HelpCircle size={14} />
            </button>

            {/* Tooltip Popup */}
            {isVisible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] leading-tight rounded shadow-xl z-[60] animate-fade-in pointer-events-none">
                    {text}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
            )}
        </span>
    );
};

export default InfoTooltip;
