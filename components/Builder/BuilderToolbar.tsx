
import React, { useState, useRef, useEffect } from 'react';
import { Save, X, Edit, RotateCcw, RotateCw, PaintBucket, Image as ImageIcon, Share2, Layout, Settings as SettingsIcon, ChevronDown, ChevronRight, Monitor, Smartphone, Maximize, LogOut, Footprints, SlidersHorizontal, Move } from 'lucide-react';
import { Settings } from '../../types';
import InfoTooltip from '../UI/InfoTooltip';
import { ImageUploadButton } from '../UI/ImageUploadButton';

import GalleryFrame from '../UI/GalleryFrame';

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
    onUndo?: () => void;
    canUndo?: boolean;
    onRedo?: () => void;
    canRedo?: boolean;
    onAdjustHero?: (index: number) => void;
    activeOnboardingStep?: string | null;
}

const THEME_PRESETS = [
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
    { name: 'Lavender Dreams', primary: '#7C3AED', hover: '#6D28D9', secondary: '#DDD6FE' },
    { name: 'Midnight Slate', primary: '#0F172A', hover: '#020617', secondary: '#334155' },
    { name: 'Desert Mirage', primary: '#92400E', hover: '#78350F', secondary: '#FDE68A' },
    { name: 'Tropical Mint', primary: '#065F46', hover: '#064E3B', secondary: '#A7F3D0' },
    { name: 'Coffee Roast', primary: '#4B2C20', hover: '#3E2723', secondary: '#D7CCC8' },
    { name: 'Berry Blast', primary: '#831843', hover: '#701a3e', secondary: '#fce7f3' },
    { name: 'Champagne Elegance', primary: '#C19A6B', hover: '#A07D5A', secondary: '#F5F5DC' },
    { name: 'Sunset Gold', primary: '#E5A93C', hover: '#C48A25', secondary: '#FF8C00' },
    { name: 'Minimalist Ash', primary: '#4A4A4A', hover: '#333333', secondary: '#E5E7EB' },
    { name: 'Deep Ocean', primary: '#003B5C', hover: '#00223E', secondary: '#00CED1' },
    { name: 'Soft Peach', primary: '#F4A460', hover: '#D2691E', secondary: '#FFDAB9' },
    { name: 'Neon Cyber', primary: '#00FFCC', hover: '#00D1A3', secondary: '#FF00FF' },
    { name: 'Ruby Romance', primary: '#E0115F', hover: '#B00E4A', secondary: '#FFB3C6' },
    { name: 'Sakura Spring', primary: '#FFB7C5', hover: '#FF9EAF', secondary: '#FFFFFF' },
    { name: 'Olive Retreat', primary: '#556B2F', hover: '#3E4F22', secondary: '#8FBC8F' },
];

const AccordionItem: React.FC<{
    title: string;
    icon: React.ElementType;
    isOpen: boolean;
    onClick: () => void;
    children: React.ReactNode;
    highlighted?: boolean;
    targetId?: string;
}> = ({ title, icon: Icon, isOpen, onClick, children, highlighted, targetId }) => (
    <div className={`border-b border-gray-200 dark:border-gray-800 last:border-0 relative transition-all ${
        highlighted ? 'onboarding-highlight-glow ring-2 ring-primary border-primary' : ''
    }`} data-onboarding-target={targetId}>
        {highlighted && (
            <div className="absolute -top-3 left-4 z-20 flex items-center gap-1 bg-primary text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow border border-white/10 onboarding-arrow-indicator select-none pointer-events-none whitespace-nowrap">
                <span>⬇️</span>
                <span>Configure here!</span>
            </div>
        )}
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isOpen ? 'bg-gray-50 dark:bg-gray-800/50 text-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
        >
            <div className="flex items-center gap-3">
                <Icon size={18} />
                <span className="font-semibold text-sm">{title}</span>
            </div>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {isOpen && <div className="p-4 bg-gray-50/50 dark:bg-gray-900/30 space-y-4 animate-fade-in">{children}</div>}
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
    onToggleMinimize,
    onUndo,
    canUndo = false,
    onRedo,
    canRedo = false,
    onAdjustHero,
    activeOnboardingStep
}) => {
    const [openSection, setOpenSection] = useState<string | null>('theme');
    const [mobileExpanded, setMobileExpanded] = useState(false);
    const [fontPickerOpen, setFontPickerOpen] = useState<'heading' | 'body' | null>(null);

    // Auto-expand sections in website builder when onboarding step changes!
    useEffect(() => {
        if (activeOnboardingStep === 'social') {
            setOpenSection('social');
        } else if (activeOnboardingStep === 'design') {
            setOpenSection('theme');
        } else if (activeOnboardingStep === 'builder') {
            setOpenSection('hero');
        }
    }, [activeOnboardingStep]);

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
            <div className="fixed top-24 left-4 z-50 flex items-center gap-2 animate-slide-right">
                <button
                    onClick={() => onToggleMinimize?.(false)}
                    className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-3 rounded-full shadow-2xl hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                    title="Open Builder Panel"
                >
                    <SettingsIcon size={24} />
                </button>
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`p-3 rounded-full shadow-2xl border transition-all active:scale-95 ${
                        canUndo 
                            ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700' 
                            : 'bg-white/50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-800 cursor-not-allowed opacity-50'
                    }`}
                    title="Undo Change"
                >
                    <RotateCcw size={20} />
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`p-3 rounded-full shadow-2xl border transition-all active:scale-95 ${
                        canRedo 
                            ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700' 
                            : 'bg-white/50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-800 cursor-not-allowed opacity-50'
                    }`}
                    title="Redo Change"
                >
                    <RotateCw size={20} />
                </button>
            </div>
        );
    }

    const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
        onUpdateSettings?.('theme', 'primaryColor', preset.primary);
        onUpdateSettings?.('theme', 'primaryHoverColor', preset.hover);
        onUpdateSettings?.('theme', 'secondaryColor', preset.secondary);
        onUpdateSettings?.('hero', 'buttonColor', '');
        onUpdateSettings?.('roomsSection', 'accentColor', '');
        onUpdateSettings?.('searchBar', 'buttonColor', '');
    };

    // --- Full Panel Content (shared between desktop sidebar and mobile expanded) ---
    const renderFullPanel = () => (
        <>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                {/* 1. Theme Settings */}
                <AccordionItem
                    title="Theme & Colors"
                    icon={PaintBucket}
                    isOpen={openSection === 'theme'}
                    onClick={() => setOpenSection(openSection === 'theme' ? null : 'theme')}
                    highlighted={activeOnboardingStep === 'design'}
                    targetId="theme-accordion"
                >
                    {/* Theme Presets */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">🎨 Quick Theme Presets</label>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {THEME_PRESETS.map(preset => (
                                <button
                                    key={preset.name}
                                    onClick={() => applyPreset(preset)}
                                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all hover:shadow-md hover:scale-[1.02] ${
                                        settings?.theme.primaryColor === preset.primary ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                                    }`}
                                >
                                    <div className="flex -space-x-1 flex-shrink-0">
                                        <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" style={{ backgroundColor: preset.primary }}></div>
                                        <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" style={{ backgroundColor: preset.hover }}></div>
                                        <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" style={{ backgroundColor: preset.secondary }}></div>
                                    </div>
                                    <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 leading-tight">{preset.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="h-px w-full bg-gray-200 dark:bg-gray-800 mb-3"></div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">Or customize individually:</label>
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
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{settings?.theme.primaryColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Primary Hover Color</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={settings?.theme.primaryHoverColor || '#000000'}
                                onChange={(e) => onUpdateSettings?.('theme', 'primaryHoverColor', e.target.value)}
                                className="w-8 h-8 rounded border-0 cursor-pointer"
                            />
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{settings?.theme.primaryHoverColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Secondary Color</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={settings?.theme.secondaryColor || '#ffffff'}
                                onChange={(e) => onUpdateSettings?.('theme', 'secondaryColor', e.target.value)}
                                className="w-8 h-8 rounded border-0 cursor-pointer"
                            />
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{settings?.theme.secondaryColor}</span>
                        </div>
                    </div>

                    {/* Typography & Fonts */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3">✨ Typography & Fonts</label>

                        {(() => {
                            const HEADING_FONTS = [
                                { name: 'Playfair Display', family: "'Playfair Display', serif", sample: 'Elegant Retreat' },
                                { name: 'Cinzel', family: "'Cinzel', serif", sample: 'GRAND ESTATE' },
                                { name: 'Cormorant Garamond', family: "'Cormorant Garamond', serif", sample: 'Timeless Luxury' },
                                { name: 'EB Garamond', family: "'EB Garamond', serif", sample: 'Refined Estate' },
                                { name: 'Libre Baskerville', family: "'Libre Baskerville', serif", sample: 'Classic Comfort' },
                                { name: 'Merriweather', family: "'Merriweather', serif", sample: 'Premium Living' },
                                { name: 'Montserrat', family: "'Montserrat', sans-serif", sample: 'Urban Escape' },
                                { name: 'Raleway', family: "'Raleway', sans-serif", sample: 'Modern Retreat' },
                                { name: 'Josefin Sans', family: "'Josefin Sans', sans-serif", sample: 'MINIMAL HAVEN' },
                                { name: 'Outfit', family: "'Outfit', sans-serif", sample: 'Modern Haven' },
                                { name: 'Poppins', family: "'Poppins', sans-serif", sample: 'Fresh Escape' },
                                { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", sample: 'Clean Stay' },
                            ];
                            const BODY_FONTS = [
                                { name: 'Inter', family: "'Inter', sans-serif", sample: 'Book your perfect getaway today.' },
                                { name: 'Roboto', family: "'Roboto', sans-serif", sample: 'Book your perfect getaway today.' },
                                { name: 'DM Sans', family: "'DM Sans', sans-serif", sample: 'Book your perfect getaway today.' },
                                { name: 'Nunito', family: "'Nunito', sans-serif", sample: 'Book your perfect getaway today.' },
                                { name: 'Poppins', family: "'Poppins', sans-serif", sample: 'Book your perfect getaway today.' },
                                { name: 'Lora', family: "'Lora', serif", sample: 'Book your perfect getaway today.' },
                                { name: 'Merriweather', family: "'Merriweather', serif", sample: 'Book your perfect getaway today.' },
                                { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", sample: 'Book your perfect getaway today.' },
                            ];

                            const currentHeading = settings?.theme?.headingFont || "'Playfair Display', serif";
                            const currentBody = settings?.theme?.bodyFont || "'Inter', sans-serif";
                            const headingName = HEADING_FONTS.find(f => f.family === currentHeading)?.name || 'Playfair Display';
                            const bodyName = BODY_FONTS.find(f => f.family === currentBody)?.name || 'Inter';

                            const activeFonts = fontPickerOpen === 'heading' ? HEADING_FONTS : BODY_FONTS;
                            const activeCurrentFont = fontPickerOpen === 'heading' ? currentHeading : currentBody;

                            return (
                                <div className="space-y-2 relative">
                                    {/* Compact rows */}
                                    {[
                                        { label: 'Heading', name: headingName, family: currentHeading, type: 'heading' as const },
                                        { label: 'Body', name: bodyName, family: currentBody, type: 'body' as const },
                                    ].map(row => (
                                        <button
                                            key={row.type}
                                            onClick={() => setFontPickerOpen(fontPickerOpen === row.type ? null : row.type)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-left ${
                                                fontPickerOpen === row.type
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                        >
                                            <div>
                                                <span className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{row.label}</span>
                                                <span className="block text-sm text-gray-800 dark:text-gray-100 leading-tight" style={{ fontFamily: row.family }}>{row.name}</span>
                                            </div>
                                            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${fontPickerOpen === row.type ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                    ))}

                                    {/* Inline dropdown picker */}
                                    {fontPickerOpen && (
                                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
                                            <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                                                {activeFonts.map(font => (
                                                    <button
                                                        key={font.name}
                                                        onClick={() => {
                                                            const cssVar = fontPickerOpen === 'heading' ? '--font-heading' : '--font-body';
                                                            const settingKey = fontPickerOpen === 'heading' ? 'headingFont' : 'bodyFont';
                                                            // Apply instantly for live preview
                                                            document.documentElement.style.setProperty(cssVar, font.family);
                                                            localStorage.setItem(`theme-font-${fontPickerOpen}`, font.family);
                                                            onUpdateSettings?.('theme', settingKey, font.family);
                                                            setFontPickerOpen(null);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                                                            activeCurrentFont === font.family
                                                            ? 'bg-primary/5 dark:bg-primary/10'
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                                        }`}
                                                    >
                                                        <div>
                                                            <span className="block text-[9px] text-gray-400 dark:text-gray-500 font-medium">{font.name}</span>
                                                            <span className="block text-sm text-gray-800 dark:text-gray-100" style={{ fontFamily: font.family }}>{font.sample}</span>
                                                        </div>
                                                        {activeCurrentFont === font.family && (
                                                            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-2">
                                                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Mini Live Preview */}
                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2">
                                        <p className="text-base text-gray-900 dark:text-white leading-tight" style={{ fontFamily: currentHeading }}>Luxury Getaway</p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed" style={{ fontFamily: currentBody }}>Experience comfort and elegance at its finest.</p>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                </AccordionItem>

                {/* 2. Hero Section */}
                <AccordionItem
                    title="Hero Section"
                    icon={ImageIcon}
                    isOpen={openSection === 'hero'}
                    onClick={() => setOpenSection(openSection === 'hero' ? null : 'hero')}
                >
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-gray-500">Background Images (Slider)</label>
                        {(settings?.hero.images || [settings?.hero.image || '']).map((img, index) => (
                            <div key={index} className="mb-3">
                                {img ? (
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-3 bg-white dark:bg-gray-800/40 space-y-2">
                                        <div className="relative h-20 rounded-xl overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur-sm text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Slide {index + 1}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex gap-1.5">
                                                <ImageUploadButton
                                                onUploadSuccess={(url) => {
                                                    const newImages = [...(settings?.hero.images || [settings?.hero.image || ''])];
                                                    newImages[index] = url;
                                                    onUpdateSettings?.('hero', 'images', newImages);
                                                    if (index === 0) onUpdateSettings?.('hero', 'image', url);
                                                }}
                                                onUploadError={(err) => console.error(err)}
                                                className="flex-1 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 text-gray-750 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                                                buttonText="Replace Image"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onAdjustHero?.(index);
                                                    // If on mobile expanded sheet, minimize it so they can see the homepage background!
                                                    if (mobileExpanded) setMobileExpanded(false);
                                                }}
                                                className="flex-1 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-[10px] font-bold shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all"
                                            >
                                                <Move size={10} /> Adjust Position
                                            </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = (settings?.hero.images || [settings?.hero.image || '']).filter((_, i) => i !== index);
                                                    onUpdateSettings?.('hero', 'images', newImages);
                                                    if (index === 0 && newImages.length > 0) onUpdateSettings?.('hero', 'image', newImages[0]);
                                                }}
                                                className="w-full py-1.5 px-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-500 border border-red-200/40 rounded-lg text-[10px] font-bold shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all"
                                            >
                                                <X size={10} /> Remove Slide
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-1">
                                        <ImageUploadButton
                                            onUploadSuccess={(url) => {
                                                const newImages = [...(settings?.hero.images || [settings?.hero.image || ''])];
                                                newImages[index] = url;
                                                onUpdateSettings?.('hero', 'images', newImages);
                                                if (index === 0) onUpdateSettings?.('hero', 'image', url);
                                            }}
                                            onUploadError={(err) => console.error(err)}
                                            className="flex-1 py-2 text-xs text-primary border border-primary border-dashed rounded-lg hover:bg-primary/5 flex items-center justify-center gap-1 font-bold"
                                            buttonText="Upload Slide Image"
                                        />
                                        <button
                                            onClick={() => {
                                                const newImages = (settings?.hero.images || [settings?.hero.image || '']).filter((_, i) => i !== index);
                                                onUpdateSettings?.('hero', 'images', newImages);
                                            }}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove slot"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={() => {
                                const newImages = [...(settings?.hero.images || [settings?.hero.image || '']), ''];
                                onUpdateSettings?.('hero', 'images', newImages);
                            }}
                            className="w-full py-2 text-xs text-primary border border-primary border-dashed rounded-xl hover:bg-primary/5 dark:hover:bg-primary/10 flex items-center justify-center gap-1 font-bold active:scale-98 transition-all"
                        >
                            + Add Another Image
                        </button>
                    </div>

                    {/* Mobile Hero Image */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center">
                            📱 Mobile Hero Image (Optional)
                            <InfoTooltip text="Upload a portrait-oriented image optimized for phones. If empty, the desktop image will be used." />
                        </label>
                        {settings?.hero.mobileImage && settings.hero.mobileImage.trim() !== '' ? (
                            <div className="relative h-20 w-16 mx-auto rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm group/mob">
                                <img src={settings.hero.mobileImage} alt="Mobile preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/mob:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                    <ImageUploadButton
                                        onUploadSuccess={(url) => onUpdateSettings?.('hero', 'mobileImage', url)}
                                        onUploadError={(err) => console.error(err)}
                                        className="bg-white text-gray-800 rounded px-2 py-0.5 text-[9px] font-bold shadow"
                                        buttonText="Replace"
                                    />
                                    <button
                                        onClick={() => onUpdateSettings?.('hero', 'mobileImage', '')}
                                        className="bg-red-500 text-white rounded px-2 py-0.5 text-[9px] font-bold shadow"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <ImageUploadButton
                                onUploadSuccess={(url) => onUpdateSettings?.('hero', 'mobileImage', url)}
                                onUploadError={(err) => console.error(err)}
                                className="w-full py-2 text-xs text-primary border border-primary border-dashed rounded-lg hover:bg-primary/5 flex items-center justify-center gap-1 font-bold"
                                buttonText="Upload Mobile Image"
                            />
                        )}
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
                    highlighted={activeOnboardingStep === 'social'}
                    targetId="social-accordion"
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
                                { key: 'showYoutube', label: 'YouTube Icon', icon: 'youtube' as const },
                                { key: 'showCustom', label: 'Custom Link Icon', icon: 'customUrl' as const },
                            ].map(({ key, label }) => {
                                const isCommon = key === 'showFacebook' || key === 'showInstagram' || key === 'showTiktok';
                                return (
                                    <label key={key} className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-xs font-bold text-gray-600 group-hover:text-primary transition-colors">{label}</span>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={(settings?.social as any)?.[key] ?? isCommon}
                                                onChange={(e) => onUpdateSettings?.('social', key, e.target.checked)}
                                            />
                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
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
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 space-y-3">
                <button
                    onClick={onSave}
                    disabled={!hasChanges}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-bold shadow-sm transition-all ${hasChanges
                        ? 'bg-primary text-white hover:bg-primary-hover hover:shadow-md'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        }`}
                >
                    <Save size={18} className="mr-2" />
                    Save & Publish
                </button>
                <button
                    onClick={onCancel}
                    className="w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-red-500 transition-colors"
                >
                    <LogOut size={16} className="mr-2" />
                    {hasChanges ? "Discard & Exit" : "Exit Builder"}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* ===== DESKTOP: Standard Left Sidebar ===== */}
            <div className="hidden md:flex fixed top-0 left-0 h-screen w-80 bg-white dark:bg-gray-950 shadow-2xl z-50 flex-col border-r border-gray-200 dark:border-gray-800 animate-slide-right">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950 sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <Edit size={20} />
                        <span>Visual Builder</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={onUndo}
                            disabled={!canUndo}
                            className={`p-1.5 rounded-full transition-colors ${
                                canUndo 
                                    ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' 
                                    : 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50'
                            }`}
                            title="Undo Change"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <button
                            onClick={onRedo}
                            disabled={!canRedo}
                            className={`p-1.5 rounded-full transition-colors ${
                                canRedo 
                                    ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' 
                                    : 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50'
                            }`}
                            title="Redo Change"
                        >
                            <RotateCw size={18} />
                        </button>
                        <button 
                            onClick={() => onToggleMinimize?.(true)} 
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Minimize Panel"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
                {renderFullPanel()}
            </div>

            {/* ===== MOBILE: Top Mini Palette (collapsed) ===== */}
            {!mobileExpanded && (
                <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-lg animate-slide-down">
                    {/* Mini Header */}
                    <div className="flex items-center justify-between px-3 pt-2 pb-1">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onToggleMinimize?.(true)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                title="Minimize Panel"
                            >
                                <X size={18} />
                            </button>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">🎨 Themes</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={onUndo}
                                disabled={!canUndo}
                                className={`p-1.5 rounded-full transition-colors active:scale-90 ${
                                    canUndo 
                                        ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' 
                                        : 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50'
                                }`}
                                title="Undo Change"
                            >
                                <RotateCcw size={16} />
                            </button>
                            <button
                                onClick={onRedo}
                                disabled={!canRedo}
                                className={`p-1.5 rounded-full transition-colors active:scale-90 ${
                                    canRedo 
                                        ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' 
                                        : 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50'
                                }`}
                                title="Redo Change"
                            >
                                <RotateCw size={16} />
                            </button>
                            {hasChanges && (
                                <button
                                    onClick={onSave}
                                    className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg hover:bg-primary-hover transition-all active:scale-95 animate-pulse-slow"
                                >
                                    <Save size={12} className="inline mr-1" />Save
                                </button>
                            )}
                            <button
                                onClick={() => setMobileExpanded(true)}
                                className="text-gray-500 hover:text-primary dark:text-gray-400 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                title="More Settings"
                            >
                                <SlidersHorizontal size={18} />
                            </button>
                            <button
                                onClick={onCancel}
                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-colors active:scale-90"
                                title="Exit Builder"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Theme Presets Row */}
                    <div className="flex gap-2 overflow-x-auto px-3 pt-2 pb-3 scrollbar-hide">
                        {THEME_PRESETS.map(preset => (
                            <button
                                key={preset.name}
                                onClick={() => applyPreset(preset)}
                                className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all text-[10px] font-semibold whitespace-nowrap ${
                                    settings?.theme.primaryColor === preset.primary
                                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-sm'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm active:scale-95'
                                }`}
                            >
                                <div className="flex -space-x-1">
                                    <div className="w-4 h-4 rounded-full border border-white dark:border-gray-800 shadow-sm" style={{ backgroundColor: preset.primary }}></div>
                                    <div className="w-4 h-4 rounded-full border border-white dark:border-gray-800 shadow-sm" style={{ backgroundColor: preset.secondary }}></div>
                                </div>
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ===== MOBILE: Expanded Full Panel (bottom sheet) ===== */}
            {mobileExpanded && (
                <div className="md:hidden fixed inset-0 z-50 flex flex-col">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileExpanded(false)} />
                    {/* Panel */}
                    <div className="relative mt-auto w-full h-[80vh] bg-white dark:bg-gray-950 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] flex flex-col animate-slide-up">
                        {/* Handle & Header */}
                        <div className="flex flex-col items-center pt-3 pb-2 border-b border-gray-200 dark:border-gray-800 rounded-t-[2rem]">
                            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mb-3" />
                            <div className="flex items-center justify-between w-full px-4">
                                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                    <Edit size={18} />
                                    <span>Visual Builder</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={onUndo}
                                        disabled={!canUndo}
                                        className={`p-1 rounded-full transition-colors active:scale-90 ${
                                            canUndo 
                                                ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' 
                                                : 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50'
                                        }`}
                                        title="Undo Change"
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                    <button
                                        onClick={onRedo}
                                        disabled={!canRedo}
                                        className={`p-1 rounded-full transition-colors active:scale-90 ${
                                            canRedo 
                                                ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' 
                                                : 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50'
                                        }`}
                                        title="Redo Change"
                                    >
                                        <RotateCw size={18} />
                                    </button>
                                    <button onClick={() => setMobileExpanded(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        {renderFullPanel()}
                    </div>
                </div>
            )}

        </>
    );
};

export default BuilderToolbar;
