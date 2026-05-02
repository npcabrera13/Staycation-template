import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Plus, X, Image as ImageIcon } from 'lucide-react';
import { ImageUploadButton } from '../UI/ImageUploadButton';
import { useNotification } from '../../contexts/NotificationContext';

interface InlineImageProps {
    src: string;
    alt: string;
    isEditing: boolean;
    onChange: (newUrl: string) => void;
    onAdd?: (newUrl: string) => void;
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
    onAdd,
    className = '',
    style = {},
    children,
    useChildrenAsPlaceholder = false
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlAction, setUrlAction] = useState<'change' | 'add'>('change');
    const { showToast } = useNotification();

    const handleClick = (e: React.MouseEvent) => {
        if (!isEditing) return;

        e.preventDefault();
        e.stopPropagation();

        if (onAdd) {
            // Show choice: Change or Add
            setShowUrlInput(false);
        } else {
            // Only Change is available, go straight to input
            setUrlAction('change');
            setShowUrlInput(true);
        }
        setShowModal(true);
        setUrlInput('');
    };

    const handleSelectChange = () => {
        setUrlAction('change');
        setShowUrlInput(true);
    };

    const handleSelectAdd = () => {
        setUrlAction('add');
        setShowUrlInput(true);
    };

    const handleUrlSubmit = () => {
        if (urlInput && urlInput.trim() !== '') {
            if (urlAction === 'change') {
                onChange(urlInput.trim());
            } else if (urlAction === 'add' && onAdd) {
                onAdd(urlInput.trim());
            }
            setShowModal(false);
            setShowUrlInput(false);
            setUrlInput('');
        }
    };

    const overflowClass = (useChildrenAsPlaceholder && children) ? '' : 'overflow-hidden';

    return (
        <>
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

                {isEditing && (
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                        <div className="bg-primary/90 p-3 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                            <Upload size={24} />
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Container */}
            {showModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { e.stopPropagation(); setShowModal(false); setShowUrlInput(false); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-pop" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                {showUrlInput ? (urlAction === 'change' ? 'Change Image' : 'Add New Image') : 'Image Options'}
                            </h3>
                            <button onClick={() => { setShowModal(false); setShowUrlInput(false); }} className="text-gray-400 hover:text-gray-600 p-1">
                                <X size={18} />
                            </button>
                        </div>

                        {!showUrlInput ? (
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded-xl mb-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Change Image</p>
                                    <div className="flex gap-2">
                                        <ImageUploadButton 
                                            onUploadSuccess={(url) => {
                                                onChange(url);
                                                setShowModal(false);
                                            }}
                                            onUploadError={(err) => showToast(err, "error")}
                                            className="flex-1 flex items-center justify-center gap-2 p-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl transition-all"
                                            buttonText="Upload Photo"
                                        />
                                        <button
                                            onClick={handleSelectChange}
                                            className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl transition-all"
                                        >
                                            <LinkIcon size={16} />
                                            <span className="text-sm font-semibold">Paste Link</span>
                                        </button>
                                    </div>
                                </div>

                                {onAdd && (
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Add New to Gallery</p>
                                        <div className="flex gap-2">
                                            <ImageUploadButton 
                                                onUploadSuccess={(url) => {
                                                    if (onAdd) onAdd(url);
                                                    setShowModal(false);
                                                }}
                                                onUploadError={(err) => showToast(err, "error")}
                                                className="flex-1 flex items-center justify-center gap-2 p-3 bg-green-500/10 hover:bg-green-500/20 text-green-600 border border-green-500/20 rounded-xl transition-all"
                                                buttonText="Upload & Add"
                                            />
                                            <button
                                                onClick={handleSelectAdd}
                                                className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl transition-all"
                                            >
                                                <Plus size={16} />
                                                <span className="text-sm font-semibold">Paste Link</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                    <input
                                        type="text"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder="https://images.unsplash.com/..."
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                                    />
                                </div>
                                {urlInput && (
                                    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                                        <img src={urlInput} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    {onAdd ? (
                                        <button onClick={() => setShowUrlInput(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium">
                                            Back
                                        </button>
                                    ) : (
                                        <button onClick={() => { setShowModal(false); setShowUrlInput(false); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium">
                                            Cancel
                                        </button>
                                    )}
                                    <button onClick={handleUrlSubmit} disabled={!urlInput.trim()} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default InlineImage;
