import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = (e: React.MouseEvent) => {
        if (!isEditing || isUploading) return;

        e.preventDefault();
        e.stopPropagation();

        // Trigger file input click instead of prompt
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            // Create a unique filename
            const uniqueId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
            const ext = file.name.split('.').pop() || 'jpg';
            const fileName = `uploads/images/${uniqueId}.${ext}`;

            const storageRef = ref(storage, fileName);
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);

            onChange(downloadUrl);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image. Please try again.");
            // Fallback to manual URL prompt if upload fails
            const newUrl = prompt("Enter new image URL:", src);
            if (newUrl && newUrl.trim() !== "") {
                onChange(newUrl.trim());
            }
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Only apply overflow-hidden when displaying actual image, not children with intentional overflow
    const overflowClass = (useChildrenAsPlaceholder && children) ? '' : 'overflow-hidden';

    return (
        <div
            className={`relative ${overflowClass} ${isEditing ? 'cursor-pointer group' : ''} ${className}`}
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

            {isEditing && !isUploading && (
                <div className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                    <div className="bg-primary/90 p-3 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                        <Upload size={24} />
                    </div>
                </div>
            )}

            {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white z-20 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin mb-2" size={28} />
                        <span className="text-xs font-medium">Uploading...</span>
                    </div>
                </div>
            )}

            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    );
};

export default InlineImage;
