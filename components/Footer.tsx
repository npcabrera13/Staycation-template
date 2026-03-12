import React, { useState } from 'react';
import { Settings } from '../types';
import { COMPANY_INFO } from '../constants'; // Fallback
import { useNavigate, useLocation } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone, X, Check, Link } from 'lucide-react';

import InlineText from './Builder/InlineText';

interface FooterProps {
  settings?: Settings;
  isEditing?: boolean;
  onSettingChange?: (section: keyof Settings, key: string, value: any) => void;
  onAdminEnter?: () => void;
}

const Footer: React.FC<FooterProps> = ({ settings, isEditing, onSettingChange, onAdminEnter }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [editingSocial, setEditingSocial] = useState<'facebook' | 'instagram' | 'x' | 'tiktok' | 'airbnb' | 'customUrl' | null>(null);
  const [socialUrlInput, setSocialUrlInput] = useState('');

  const handleSocialClick = (e: React.MouseEvent, platform: 'facebook' | 'instagram' | 'x' | 'tiktok' | 'airbnb' | 'customUrl') => {
    if (isEditing && onSettingChange) {
      e.preventDefault();
      const currentUrl = settings?.social?.[platform] || '';
      setSocialUrlInput(currentUrl);
      setEditingSocial(platform);
    }
  };

  const handleSaveSocial = () => {
    if (editingSocial && onSettingChange) {
      onSettingChange('social', editingSocial, socialUrlInput);
      setEditingSocial(null);
    }
  };

  const scrollToSection = (id: string) => {
    if (isEditing) return; // Disable cleanup nav in edit mode
    if (location.pathname !== '/') {
      // ... same logic
    } else {
      // ... same logic
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-secondary text-white pt-12 pb-6" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl font-bold mb-4">
              <InlineText
                value={settings?.siteName || "Serenity Staycation"}
                isEditing={!!isEditing}
                onChange={(val) => onSettingChange && onSettingChange('siteName' as any, '', val)} // siteName is root


              />
            </h3>
            <div className="text-gray-300 text-sm leading-relaxed">
              <InlineText
                value={settings?.description || "Experience luxury..."}
                isEditing={!!isEditing}
                onChange={(val) => onSettingChange && onSettingChange('description' as any, '', val)}
                multiline
              />
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold mb-4" style={{ color: settings?.footer?.headerColor || 'var(--color-primary)' }}>
              <InlineText
                value={settings?.footer?.quickLinksText || "Quick Links"}
                isEditing={!!isEditing}
                onChange={(val) => onSettingChange && onSettingChange('footer', 'quickLinksText', val)}
              />
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              {/* Static links usually don't need editing, just the text maybe? Skipping for now as user asked for 'footer text' mostly */}
              <li><span className="hover:text-white transition-colors cursor-pointer">Home</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Rooms</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">About Us</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Contact</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4" style={{ color: settings?.footer?.headerColor || 'var(--color-primary)' }}>
              <InlineText
                value={settings?.footer?.contactUsText || "Contact Us"}
                isEditing={!!isEditing}
                onChange={(val) => onSettingChange && onSettingChange('footer', 'contactUsText', val)}
              />
            </h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start">
                <MapPin size={16} className="mr-2 mt-1 flex-shrink-0" />
                <InlineText
                  value={settings?.contact.address || ''}
                  isEditing={!!isEditing}
                  onChange={(val) => onSettingChange?.('contact', 'address', val)}
                />
              </li>
              <li className="flex items-center">
                <Phone size={16} className="mr-2 flex-shrink-0" />
                <InlineText
                  value={settings?.contact.phone || ''}
                  isEditing={!!isEditing}
                  onChange={(val) => onSettingChange?.('contact', 'phone', val)}
                />
              </li>
              <li className="flex items-center">
                <Mail size={16} className="mr-2 flex-shrink-0" />
                <InlineText
                  value={settings?.contact.email || ''}
                  isEditing={!!isEditing}
                  onChange={(val) => onSettingChange?.('contact', 'email', val)}
                />
              </li>
              <li className="flex space-x-4 mt-4">
                {/* Socials - Click to edit URL in edit mode */}
                {/* Facebook */}
                {settings?.social?.showFacebook !== false && (
                  <a
                    href={isEditing ? '#' : settings?.social?.facebook}
                    onClick={(e) => handleSocialClick(e, 'facebook')}
                    className={`hover:text-blue-400 transition ${!settings?.social?.facebook && !isEditing ? 'hidden' : ''} ${isEditing ? 'cursor-edit border border-dashed border-gray-500 p-1 rounded' : ''}`}
                    title={isEditing ? 'Click to edit Facebook URL' : ''}
                  >
                    <Facebook />
                  </a>
                )}

                {/* Instagram */}
                {settings?.social?.showInstagram !== false && (
                  <a
                    href={isEditing ? '#' : settings?.social?.instagram}
                    onClick={(e) => handleSocialClick(e, 'instagram')}
                    className={`hover:text-pink-400 transition ${!settings?.social?.instagram && !isEditing ? 'hidden' : ''} ${isEditing ? 'cursor-edit border border-dashed border-gray-500 p-1 rounded' : ''}`}
                    title={isEditing ? 'Click to edit Instagram URL' : ''}
                  >
                    <Instagram />
                  </a>
                )}

                {/* TikTok */}
                {settings?.social?.showTiktok !== false && (
                  <a
                    href={isEditing ? '#' : settings?.social?.tiktok}
                    onClick={(e) => handleSocialClick(e, 'tiktok')}
                    className={`hover:text-pink-600 transition ${!settings?.social?.tiktok && !isEditing ? 'hidden' : ''} ${isEditing ? 'cursor-edit border border-dashed border-gray-500 p-1 rounded' : ''}`}
                    title={isEditing ? 'Click to edit TikTok URL' : ''}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="lucide lucide-tiktok"
                    >
                      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
                    </svg>
                  </a>
                )}

                {/* X (formerly Twitter) */}
                {settings?.social?.showX !== false && (
                  <a
                    href={isEditing ? '#' : settings?.social?.x}
                    onClick={(e) => handleSocialClick(e, 'x')}
                    className={`hover:text-gray-400 transition ${!settings?.social?.x && !isEditing ? 'hidden' : ''} ${isEditing ? 'cursor-edit border border-dashed border-gray-500 p-1 rounded' : ''}`}
                    title={isEditing ? 'Click to edit X URL' : ''}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
                  </a>
                )}

                {/* Airbnb */}
                {settings?.social?.showAirbnb !== false && (
                  <a
                    href={isEditing ? '#' : settings?.social?.airbnb}
                    onClick={(e) => handleSocialClick(e, 'airbnb')}
                    className={`hover:text-[#FF5A5F] transition ${!settings?.social?.airbnb && !isEditing ? 'hidden' : ''} ${isEditing ? 'cursor-edit border border-dashed border-gray-500 p-1 rounded' : ''}`}
                    title={isEditing ? 'Click to edit Airbnb URL' : ''}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.001 22.094c-.035 0-2.813-.257-5.908-4.29-3.267-4.26-4.275-8.498-3.003-12.607 1.094-3.535 3.99-5.157 7.021-5.18h.082l.006.002h.67l.119-.001h1.166l.004-.002.102.002h.715c3.023.023 5.927 1.645 7.021 5.18 1.272 4.109.264 8.35-3.006 12.607-3.094 4.033-5.871 4.29-5.906 4.29zm-5.4-8.067c1.164 2.872 3.843 3.513 5.4 3.58 1.558-.067 4.24-7.464 5.4-10.336-1.558-.067-4.24-.708-5.4-3.58-1.157 2.871-3.839 3.512-5.4 3.58 1.56 2.871 4.243 10.268 5.4 10.336-1.157-.068-3.84-7.465-5.4-10.336zM12 9.4c1.435 0 2.6 1.165 2.6 2.6s-1.165 2.6-2.6 2.6-2.6-1.165-2.6-2.6 1.165-2.6 2.6-2.6z" />
                    </svg>
                  </a>
                )}

                {/* Custom URL */}
                {settings?.social?.showCustom !== false && (
                  <a
                    href={isEditing ? '#' : settings?.social?.customUrl}
                    onClick={(e) => handleSocialClick(e, 'customUrl')}
                    className={`hover:text-blue-400 transition ${!settings?.social?.customUrl && !isEditing ? 'hidden' : ''} ${isEditing ? 'cursor-edit border border-dashed border-gray-500 p-1 rounded' : ''} flex items-center gap-1`}
                    title={isEditing ? 'Click to edit Custom URL' : (settings?.social?.customLabel || 'Website')}
                  >
                    <Link size={24} />
                    {(!isEditing && settings?.social?.customLabel) && (
                      <span className="text-sm border-b border-transparent hover:border-current leading-tight">
                        {settings.social.customLabel}
                      </span>
                    )}
                  </a>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()}
          <span className="mx-1">
            <InlineText
              value={settings?.footer?.copyrightText || "All rights reserved."}
              isEditing={!!isEditing}
              onChange={(val) => onSettingChange?.('footer', 'copyrightText', val)}
            />
          </span>
        </div>
      </div>

      {/* Custom URL Editor Modal */}
      {editingSocial && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all text-left">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 capitalize">
              Edit {editingSocial} Link
            </h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter URL
              </label>
              <input
                type="text"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-gray-700 dark:text-gray-200"
                placeholder={`https://${editingSocial}.com/yourpage`}
                value={socialUrlInput}
                onChange={(e) => setSocialUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveSocial();
                  if (e.key === 'Escape') setEditingSocial(null);
                }}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditingSocial(null)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center"
              >
                <X size={16} className="mr-2" /> Cancel
              </button>
              <button
                onClick={handleSaveSocial}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all flex items-center"
              >
                <Check size={16} className="mr-2" /> Save Link
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;