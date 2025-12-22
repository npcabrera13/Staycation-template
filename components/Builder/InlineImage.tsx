import React, { useState } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';

interface InlineImageProps {
    src: string;
    alt: string;
    isEditing: boolean;
    onChange: (newUrl: string) => void;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    useChildrenAsPlaceholder?: boolean;
}

const InlineImage: React.FC<InlineImageProps> = ({
    src,
    alt,
    isEditing,
    onChange,
    className = '',
    style = {},
    children,
    useChildrenAsPlaceholder = false
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        if (!isEditing) return;

        e.preventDefault();
        e.stopPropagation();

        const newUrl = prompt("Enter new image URL:", src);
        if (newUrl && newUrl.trim() !== "") {
            onChange(newUrl.trim());
        }
    };

    return (
        <div
            className={`relative ${isEditing ? 'cursor-pointer group' : ''} ${className}`}
            onMouseEnter={() => isEditing && setIsHovered(true)}
            onMouseLeave={() => isEditing && setIsHovered(false)}
            onClick={handleClick}
        >
            {useChildrenAsPlaceholder && children ? (
                children
            ) : (
                <img
                    src={src}
                    alt={alt}
                    style={style}
                    className={`w-full h-full object-cover transition-all ${isEditing && isHovered ? 'opacity-70 blur-[2px]' : ''}`}
                />
            )}

            {isEditing && (
                <div className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-lg`}>
                    <div className="bg-primary/90 p-3 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                        <Upload size={24} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default InlineImage;
