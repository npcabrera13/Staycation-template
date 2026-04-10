import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();
    
    // Check if we're on an admin path using current location
    const isAdminPath = (pathname: string) => 
        pathname.startsWith('/admin') || 
        pathname.startsWith('/superadmin');

    const [clientDark, setClientDark] = useState(() => {
        const themeVersion = localStorage.getItem('themeVersion');
        if (themeVersion !== 'v2') {
            localStorage.setItem('themeVersion', 'v2');
            localStorage.setItem('theme', 'light');
            return false;
        }
        return localStorage.getItem('theme') === 'dark';
    });

    const [adminDark, setAdminDark] = useState(() => {
        return localStorage.getItem('admin-theme') === 'dark';
    });

    // Determine current effective state based on current location
    const currentIsAdmin = isAdminPath(location.pathname);
    const isDark = currentIsAdmin ? adminDark : clientDark;

    useEffect(() => {
        // Apply dark class based on current path's preference
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark, currentIsAdmin]);

    const toggleTheme = () => {
        if (isAdminPath(location.pathname)) {
            setAdminDark(prev => {
                const newVal = !prev;
                localStorage.setItem('admin-theme', newVal ? 'dark' : 'light');
                return newVal;
            });
        } else {
            setClientDark(prev => {
                const newVal = !prev;
                localStorage.setItem('theme', newVal ? 'dark' : 'light');
                return newVal;
            });
        }
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
