import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Local Tailwind build — replaces the CDN script
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';

// Dynamically set favicon from env variable (only works on Vercel/Netlify builds)
const faviconUrl = import.meta.env.VITE_FAVICON_URL;
if (faviconUrl) {
  const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  if (link) {
    link.href = faviconUrl;
  } else {
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.href = faviconUrl;
    document.head.appendChild(newLink);
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);