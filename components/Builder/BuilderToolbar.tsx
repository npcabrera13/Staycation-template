
import React, { useState } from 'react';
import { Save, X, Edit, RotateCcw, PaintBucket, Image as ImageIcon, Share2, Layout, Settings as SettingsIcon, ChevronDown, ChevronRight, Monitor, Smartphone, Maximize, LogOut, Footprints } from 'lucide-react';
import { Settings } from '../../types';
import InfoTooltip from '../UI/InfoTooltip';

interface BuilderToolbarProps {
    isEditing: boolean;
    onToggleEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    hasChanges: boolean;
    onLogout?: () => void;
    settings?: Settings;
    onUpdateSettings?: (section: keyof Settings, field: string, value: any) => void;
    isMinimized?: boolean;
    onToggleMinimize?: (minimized: boolean) => void;
}

const AccordionItem: React.FC<{
    title: string;
    icon: React.ElementType;
    isOpen: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ title, icon: Icon, isOpen, onClick, children }) => (
    <div className="border-b border-gray-200 last:border-0">
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isOpen ? 'bg-gray-50 text-primary' : 'hover:bg-gray-50 text-gray-700'}`}
        >
            <div className="flex items-center gap-3">
                <Icon size={18} />
                <span className="font-semibold text-sm">{title}</span>
            </div>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {isOpen && <div className="p-4 bg-gray-50/50 space-y-4 animate-fade-in">{children}</div>}
    </div>
);

const BuilderToolbar: React.FC<BuilderToolbarProps> = ({
    isEditing,
    onToggleEdit,
    onSave,
    onCancel,
    hasChanges,
    onLogout,
    settings,
    onUpdateSettings,
    isMinimized = false,
    onToggleMinimize
}) => {
    const [openSection, setOpenSection] = useState<string | null>('theme');
    // Internal state removed in favor of props


    if (!isEditing) {
        return (
            <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-4 animate-bounce-in">
                <button
                    onClick={onToggleEdit}
                    className="bg-primary text-white p-4 rounded-full shadow-2xl hover:bg-primary-hover transition-all hover:scale-110 flex items-center justify-center group"
                    title="Edit Page"
                >
                    <Edit size={24} />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-out whitespace-nowrap">
                        Edit Page
                    </span>
                </button>
                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="bg-white text-gray-500 p-3 rounded-full shadow-xl hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center group border border-gray-200"
                        title="Exit Admin"
                    >
                        <RotateCcw size={20} />
                    </button>
                )}
            </div>
        );
    }

    if (isMinimized) {
        return (
            <div className="fixed top-24 left-4 z-50 animate-slide-right">
                <button
                    onClick={() => onToggleMinimize?.(false)}
                    className="bg-white text-gray-700 p-3 rounded-full shadow-2xl hover:bg-gray-50 border border-gray-200"
                    title="Open Builder Panel"
                >
                    <SettingsIcon size={24} />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 md:top-0 left-0 w-full h-[55vh] md:h-screen md:w-80 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.15)] md:shadow-2xl z-50 flex flex-col md:border-r border-gray-200 animate-slide-up md:animate-slide-right rounded-t-[2rem] md:rounded-none mt-auto">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10 rounded-t-[2rem] md:rounded-none">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <Edit size={20} />
                    <span>Visual Builder</span>
                </div>
                <button onClick={() => onToggleMinimize?.(true)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                {/* 1. Theme Settings */}
                <AccordionItem
                    title="Theme & Colors"
                    icon={PaintBucket}
                    isOpen={openSection === 'theme'}
                    onClick={() => setOpenSection(openSection === 'theme' ? null : 'theme')}
                >
                    {/* Theme Presets */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">🎨 Quick Theme Presets</label>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {[
                                { name: 'Navy & Gold', primary: '#1B2A4A', hover: '#142038', secondary: '#B8860B' },
                                { name: 'Ocean Breeze', primary: '#0077B6', hover: '#005F8A', secondary: '#0096C7' },
                                { name: 'Emerald Luxe', primary: '#064E3B', hover: '#043D2E', secondary: '#059669' },
                                { name: 'Sunset Coral', primary: '#E76F51', hover: '#D45A3C', secondary: '#264653' },
                                { name: 'Royal Purple', primary: '#6D28D9', hover: '#5B21B6', secondary: '#4C1D95' },
                                { name: 'Classic Black', primary: '#111827', hover: '#000000', secondary: '#374151' },
                                { name: 'Rose Garden', primary: '#BE185D', hover: '#9D174D', secondary: '#831843' },
                                { name: 'Teal Modern', primary: '#0D9488', hover: '#0F766E', secondary: '#115E59' },
                                { name: 'Warm Earth', primary: '#92400E', hover: '#78350F', secondary: '#78350F' },
                                { name: 'Sky Fresh', primary: '#2563EB', hover: '#1D4ED8', secondary: '#1E40AF' },
                                { name: 'Forest Pine', primary: '#166534', hover: '#14532D', secondary: '#064E3B' },
                                { name: 'Crimson Bold', primary: '#DC2626', hover: '#B91C1C', secondary: '#991B1B' },
                            ].map(preset => (
                                <button
                                    key={preset.name}
                                    onClick={() => {
                                        onUpdateSettings?.('theme', 'primaryColor', preset.primary);
                                        onUpdateSettings?.('theme', 'primaryHoverColor', preset.hover);
                                        onUpdateSettings?.('theme', 'secondaryColor', preset.secondary);
                                        // Clear overrides so they inherit the new preset theme colors
                                        onUpdateSettings?.('hero', 'buttonColor', '');
                                        onUpdateSettings?.('roomsSection', 'accentColor', '');
                                        onUpdateSettings?.('searchBar', 'buttonColor', '');
                                    }}
                                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all hover:shadow-md hover:scale-[1.02] ${
                                        settings?.theme.primaryColor === preset.primary ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                    <div className="flex -space-x-1 flex-shrink-0">
                                        <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: preset.primary }}></div>
                                        <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: preset.hover }}></div>
                                        <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: preset.secondary }}></div>
                                    </div>
                                    <span className="text-[10px] font-semibold text-gray-600 leading-tight">{preset.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="h-px w-full bg-gray-200 mb-3"></div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">Or customize individually:</label>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Primary Color</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={settings?.theme.primaryColor || '#000000'}
                                onChange={(e) => onUpdateSettings?.('theme', 'primaryColor', e.target.value)}
                                className="w-8 h-8 rounded border-0 cursor-pointer"
                            />
                            <span className="text-xs font-mono text-gray-600">{settings?.theme.primaryColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Primary Hover Color</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={settings?.theme.primaryHoverColor || '#000000'}
                                onChange={(e) => onUpdateSettings?.('theme', 'primaryHoverColor', e.target.value)}
                                className="w-8 h-8 rounded border-0 cursor-pointer"
                            />
                            <span className="text-xs font-mono text-gray-600">{settings?.theme.primaryHoverColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Secondary Color</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={settings?.theme.secondaryColor || '#ffffff'}
                                onChange={(e) => onUpdateSettings?.('theme', 'secondaryColor', e.target.value)}
                                className="w-8 h-8 rounded border-0 cursor-pointer"
                            />
                            <span className="text-xs font-mono text-gray-600">{settings?.theme.secondaryColor}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Global Font Family</label>
                        <select
                            value={settings?.theme.fontFamily || 'sans'}
                            onChange={(e) => onUpdateSettings?.('theme', 'fontFamily', e.target.value)}
                            className="w-full text-xs p-2 border border-gray-300 rounded bg-white text-gray-700 cursor-pointer outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                            <option value="sans">Sans-Serif</option>
                            <option value="serif">Serif (Elegant)</option>
                            <option value="mono">Monospace (Typewriter)</option>
                        </select>
                    </div>
                </AccordionItem>

                {/* 2. Hero Section */}
                <AccordionItem
                    title="Hero Section"
                    icon={ImageIcon}
                    isOpen={openSection === 'hero'}
                    onClick={() => setOpenSection(openSection === 'hero' ? null : 'hero')}
                >
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-500">Background Images (Slider)</label>
                        {(settings?.hero.images || [settings?.hero.image || '']).map((img, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={img}
                                    onChange={(e) => {
                                        const newImages = [...(settings?.hero.images || [settings?.hero.image || ''])];
                                        newImages[index] = e.target.value;
                                        onUpdateSettings?.('hero', 'images', newImages);
                                        // Update primary image if it's the first one
                                        if (index === 0) onUpdateSettings?.('hero', 'image', e.target.value);
                                    }}
                                    className="flex-1 text-xs p-2 border border-gray-300 rounded bg-white text-gray-700"
                                    placeholder="Image URL..."
                                />
                                <button
                                    onClick={() => {
                                        const newImages = (settings?.hero.images || [settings?.hero.image || '']).filter((_, i) => i !== index);
                                        onUpdateSettings?.('hero', 'images', newImages);
                                        if (index === 0 && newImages.length > 0) onUpdateSettings?.('hero', 'image', newImages[0]);
                                    }}
                                    className="text-red-400 hover:text-red-600 p-1"
                                    title="Remove Image"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => {
                                const newImages = [...(settings?.hero.images || [settings?.hero.image || '']), ''];
                                onUpdateSettings?.('hero', 'images', newImages);
                            }}
                            className="w-full py-1 text-xs text-primary border border-primary border-dashed rounded hover:bg-teal-50 flex items-center justify-center gap-1"
                        >
                            + Add Another Image
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center">
                            Slide Interval: {(settings?.hero.slideInterval || 5000) / 1000}s
                            <InfoTooltip text="Time in seconds between each image slide." />
                        </label>
                        <input
                            type="range"
                            min="2000"
                            max="10000"
                            step="500"
                            value={settings?.hero.slideInterval || 5000}
                            onChange={(e) => onUpdateSettings?.('hero', 'slideInterval', parseInt(e.target.value))}
                            className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center">
                            Overlay Opacity: {settings?.hero.overlayOpacity}%
                            <InfoTooltip text="Darkens the image to make white text easier to read." />
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="90"
                            value={settings?.hero.overlayOpacity || 0}
                            onChange={(e) => onUpdateSettings?.('hero', 'overlayOpacity', parseInt(e.target.value))}
                            className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center">
                            Text Readability (Shadow)
                            <InfoTooltip text="Adds a shadow behind text to make it pop against complex backgrounds." />
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {['none', 'sm', 'lg'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => onUpdateSettings?.('hero', 'textShadow', opt)}
                                    className={`px-2 py-2 text-xs capitalize rounded border text-center ${settings?.hero.textShadow === opt || (!settings?.hero.textShadow && opt === 'sm') ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}`}
                                >
                                    {opt === 'none' ? 'None' : opt === 'sm' ? 'Soft' : 'Strong'}
                                </button>
                            ))}
                        </div>
                    </div>
                </AccordionItem>

                {/* 3. Social Links Toggles */}
                <AccordionItem
                    title="Social & Links"
                    icon={Share2}
                    isOpen={openSection === 'social'}
                    onClick={() => setOpenSection(openSection === 'social' ? null : 'social')}
                >
                    <div className="space-y-4">
                        <p className="text-xs text-gray-400 mb-2 leading-relaxed">Toggle which icons appear in your footer. Empty links will be hidden from visitors but remain visible in the editor.</p>
                        <div className="space-y-3">
                            {[
                                { key: 'showFacebook', label: 'Facebook Icon', icon: 'facebook' as const },
                                { key: 'showInstagram', label: 'Instagram Icon', icon: 'instagram' as const },
                                { key: 'showX', label: 'X (Twitter) Icon', icon: 'x' as const },
                                { key: 'showTiktok', label: 'TikTok Icon', icon: 'tiktok' as const },
                                { key: 'showAirbnb', label: 'Airbnb Icon', icon: 'airbnb' as const },
                                { key: 'showCustom', label: 'Custom Link Icon', icon: 'customUrl' as const },
                            ].map(({ key, label }) => (
                                <label key={key} className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-xs font-bold text-gray-600 group-hover:text-primary transition-colors">{label}</span>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={(settings?.social as any)?.[key] !== false} // Default to true if undefined
                                            onChange={(e) => onUpdateSettings?.('social', key, e.target.checked)}
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </AccordionItem>

                {/* 4. About Gallery */}
                <AccordionItem
                    title="About Gallery"
                    icon={ImageIcon}
                    isOpen={openSection === 'about'}
                    onClick={() => setOpenSection(openSection === 'about' ? null : 'about')}
                >
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-500">Gallery Images (Carousel)</label>
                        <p className="text-xs text-gray-400 mb-2">First image is the main image. Additional images appear in the carousel.</p>

                        {/* Main image */}
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={settings?.about?.image || ''}
                                onChange={(e) => onUpdateSettings?.('about', 'image', e.target.value)}
                                className="flex-1 text-xs p-2 border border-gray-300 rounded bg-white text-gray-700"
                                placeholder="Main image URL..."
                            />
                        </div>

                        {/* Additional images */}
                        {(settings?.about?.images || []).map((img, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={img}
                                    onChange={(e) => {
                                        const newImages = [...(settings?.about?.images || [])];
                                        newImages[index] = e.target.value;
                                        onUpdateSettings?.('about', 'images', newImages);
                                    }}
                                    className="flex-1 text-xs p-2 border border-gray-300 rounded bg-white text-gray-700"
                                    placeholder="Additional image URL..."
                                />
                                <button
                                    onClick={() => {
                                        const newImages = (settings?.about?.images || []).filter((_, i) => i !== index);
                                        onUpdateSettings?.('about', 'images', newImages);
                                    }}
                                    className="text-red-400 hover:text-red-600 p-1"
                                    title="Remove Image"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => {
                                const newImages = [...(settings?.about?.images || []), ''];
                                onUpdateSettings?.('about', 'images', newImages);
                            }}
                            className="w-full py-1 text-xs text-primary border border-primary border-dashed rounded hover:bg-teal-50 flex items-center justify-center gap-1"
                        >
                            + Add Another Image
                        </button>
                    </div>
                </AccordionItem>

                {/* 5. Footer Section */}
                <AccordionItem
                    title="Footer"
                    icon={Footprints}
                    isOpen={openSection === 'footer'}
                    onClick={() => setOpenSection(openSection === 'footer' ? null : 'footer')}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Header Color ("Quick Links", "Contact Us")</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={settings?.footer?.headerColor || settings?.theme.primaryColor || '#E9C46A'}
                                    onChange={(e) => onUpdateSettings?.('footer', 'headerColor', e.target.value)}
                                    className="w-8 h-8 rounded border-0 cursor-pointer"
                                />
                                <span className="text-xs font-mono text-gray-600">{settings?.footer?.headerColor || settings?.theme.primaryColor || '#E9C46A'}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Color of section titles in the footer</p>
                        </div>
                    </div>
                </AccordionItem>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
                <button
                    onClick={onSave}
                    disabled={!hasChanges}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-bold shadow-sm transition-all ${hasChanges
                        ? 'bg-primary text-white hover:bg-primary-hover hover:shadow-md'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    <Save size={18} className="mr-2" />
                    Save & Publish
                </button>
                <button
                    onClick={onCancel}
                    className="w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-200 hover:text-red-500 transition-colors"
                >
                    <LogOut size={16} className="mr-2" />
                    {hasChanges ? "Discard & Exit" : "Exit Builder"}
                </button>
            </div>
        </div>
    );
};

export default BuilderToolbar;
