import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Plus, X } from 'lucide-react';

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
                                <button
                                    onClick={handleSelectChange}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                                >
                                    <div className="bg-blue-100 p-2.5 rounded-lg group-hover:bg-blue-200 transition-colors">
                                        <LinkIcon size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Change Current Image</p>
                                        <p className="text-xs text-gray-500">Replace this image via URL</p>
                                    </div>
                                </button>
                                {onAdd && (
                                    <button
                                        onClick={handleSelectAdd}
                                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                                    >
                                        <div className="bg-green-100 p-2.5 rounded-lg group-hover:bg-green-200 transition-colors">
                                            <Plus size={20} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">Add New Image</p>
                                            <p className="text-xs text-gray-500">Append a new image to the gallery</p>
                                        </div>
                                    </button>
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
