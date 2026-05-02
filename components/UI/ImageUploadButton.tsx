import React, { useRef, useState } from 'react';
import { Upload, Loader } from 'lucide-react';
import { uploadToImgBB } from '../../services/imgbbService';

interface ImageUploadButtonProps {
    onUploadSuccess: (url: string) => void;
    onUploadError: (error: string) => void;
    className?: string;
    buttonText?: string;
    isIconOnly?: boolean;
}

export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
    onUploadSuccess,
    onUploadError,
    className = "",
    buttonText = "Upload Image",
    isIconOnly = false
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadToImgBB(file);
            onUploadSuccess(url);
        } catch (error: any) {
            onUploadError(error.message || "Failed to upload image");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    return (
        <div className="relative inline-block">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                title={isIconOnly ? buttonText : undefined}
            >
                {isUploading ? (
                    <Loader size={16} className="animate-spin" />
                ) : (
                    <Upload size={16} className={isIconOnly ? "" : "mr-1.5"} />
                )}
                {!isIconOnly && <span>{isUploading ? "Uploading..." : buttonText}</span>}
            </button>
        </div>
    );
};
