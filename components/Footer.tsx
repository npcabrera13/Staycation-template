import React from 'react';
import { Settings } from '../types';
import { COMPANY_INFO } from '../constants'; // Fallback
import { useNavigate, useLocation } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';

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

  const handleSocialClick = (e: React.MouseEvent, platform: 'facebook' | 'instagram' | 'twitter') => {
    if (isEditing && onSettingChange) {
      e.preventDefault();
      const currentUrl = settings?.social?.[platform] || '';
      const newUrl = prompt(`Enter ${platform} URL:`, currentUrl);
      if (newUrl !== null) {
        // We need to update nested social object.
        // Since onSettingChange signature is (section, key, value), we might need to handle 'social' object entirely
        // OR update signature to support paths. 
        // Simpler: assume onSettingChange handles root sections.
        const newSocials = { ...settings?.social, [platform]: newUrl };
        onSettingChange('social', platform, newUrl); // Wait, my LandingPage handler handles (section, key, value)? 
        // LandingPage: handleSettingChange(section, key, value) => { ... workingSettings[section] = { ...workingSettings[section], [key]: value } }
        // So for social, section='social', key='facebook'.
      }
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
            <h4 className="font-bold text-accent mb-4">Quick Links</h4>
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
            <h4 className="font-bold text-accent mb-4">Contact Us</h4>
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
                <a
                  href={isEditing ? '#' : settings?.social?.facebook}
                  onClick={(e) => handleSocialClick(e, 'facebook')}
                  className={`hover:text-blue-400 transition ${isEditing ? 'cursor-edit border border-dashed border-gray-500 p-1 rounded' : ''}`}
                  title={isEditing ? 'Click to edit Facebook URL' : ''}
                >
                  <Facebook />
                </a>
                <a
                  href={isEditing ? '#' : settings?.social?.instagram}
                  onClick={(e) => handleSocialClick(e, 'instagram')}
                  className={`hover:text-pink-400 transition ${isEditing ? 'cursor-edit border border-dashed border-gray-500 p-1 rounded' : ''}`}
                  title={isEditing ? 'Click to edit Instagram URL' : ''}
                >
                  <Instagram />
                </a>
                <a
                  href={isEditing ? '#' : settings?.social?.tiktok}
                  onClick={(e) => handleSocialClick(e, 'tiktok' as any)}
                  className={`hover:text-pink-600 transition ${isEditing ? 'cursor-edit border border-dashed border-gray-500 p-1 rounded' : ''}`}
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
    </footer>
  );
};

export default Footer;