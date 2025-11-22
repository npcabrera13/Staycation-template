import React, { useState, useEffect, useRef } from 'react';

interface RevealProps {
  children: React.ReactNode;
  width?: "fit-content" | "100%";
  delay?: number;
  className?: string;
}

const RevealOnScroll: React.FC<RevealProps> = ({ children, width = "100%", delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Optionally disconnect after revealing to only animate once
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.15, // Trigger when 15% of component is visible
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div 
        ref={ref} 
        style={{ width }}
        className={className}
    >
      <div
        style={{ 
            transitionDuration: '1000ms',
            transitionDelay: `${delay}ms`,
            transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        className={`transform transition-all h-full ${
          isVisible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-12 blur-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default RevealOnScroll;