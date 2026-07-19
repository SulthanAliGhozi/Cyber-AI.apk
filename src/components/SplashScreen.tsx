import { useState, useEffect } from "react";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start fading out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000);

    // Completely remove from DOM after 3 seconds (allowing 1s for fade animation)
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-black flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Glitch & Pulse wrapper */}
      <div className="w-full h-full relative animate-pulse flex items-center justify-center bg-black">
        <picture className="w-full h-full flex items-center justify-center">
          {/* Desktop (min-width: 1024px) */}
          <source media="(min-width: 1024px)" srcSet="/splash-dekstop.png" />
          
          {/* Tablet (min-width: 768px) */}
          <source media="(min-width: 768px)" srcSet="/splash-tablet.png" />
          
          {/* Mobile (default) */}
          <img
            src="/splash-mobile.png"
            alt="Cyber AI Splash Screen"
            className="w-full h-full object-cover object-center"
          />
        </picture>
        
        {/* Loading text overlay */}
        <div className="absolute bottom-10 left-0 right-0 text-center font-mono text-[#a78bfa] text-xs font-bold tracking-widest uppercase animate-pulse">
          INITIALIZING CYBER CORE...
        </div>
      </div>
    </div>
  );
}
