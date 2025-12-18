import React from 'react';
import { Settings } from '../types';
import { COMPANY_INFO } from '../constants'; // Fallback
import { useNavigate, useLocation } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';

interface FooterProps {
  settings?: Settings;
}

const Footer: React.FC<FooterProps> = ({ settings }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-secondary text-white pt-12 pb-6" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl font-bold mb-4">{settings?.siteName || "Serenity Staycation"}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {settings?.description || "Experience luxury, comfort, and nature combined. Your perfect escape is just a click away."}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-accent mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <button onClick={() => scrollToSection('hero')} className="hover:text-white transition-colors">Home</button>
              </li>
              <li>
                <button onClick={() => scrollToSection('rooms')} className="hover:text-white transition-colors">Rooms</button>
              </li>
              <li>
                <button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">About Us</button>
              </li>
              <li>
                <button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">Contact</button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-accent mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start">
                <MapPin size={16} className="mr-2 mt-1 flex-shrink-0" />
                {settings?.contact.address || COMPANY_INFO.address}
              </li>
              <li className="flex items-center">
                <Phone size={16} className="mr-2 flex-shrink-0" />
                {settings?.contact.phone || COMPANY_INFO.phone}
              </li>
              <li className="flex items-center">
                <Mail size={16} className="mr-2 flex-shrink-0" />
                {settings?.contact.email || COMPANY_INFO.email}
              </li>
              <li className="flex space-x-4 mt-4">
                <a href={`https://${settings?.contact.socials.facebook || COMPANY_INFO.facebook}`} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition"><Facebook /></a>
                <a href={`https://${settings?.contact.socials.instagram || COMPANY_INFO.instagram}`} target="_blank" rel="noreferrer" className="hover:text-pink-400 transition"><Instagram /></a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} {settings?.siteName || "Serenity Staycation"}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;