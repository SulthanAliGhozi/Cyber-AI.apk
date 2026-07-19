import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  isDark?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, isDark = true }) => {
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) {
      // Pulling down, prevent default scrolling and limit max distance
      if (e.cancelable) e.preventDefault();
      setPullDistance(Math.min(diff * 0.4, 80)); 
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= 60 && !isRefreshing) {
      setIsRefreshing(true);
      await Promise.resolve(onRefresh());
      setIsRefreshing(false);
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  return (
    <div 
      onTouchStart={handleTouchStart} 
      onTouchMove={handleTouchMove} 
      onTouchEnd={handleTouchEnd}
      className="relative w-full min-h-screen"
    >
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center items-center overflow-hidden transition-all duration-300 z-50 pointer-events-none"
        style={{ height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`, opacity: pullDistance / 60 }}
      >
        <div className={`p-2 rounded-full shadow-lg ${isDark ? "bg-neutral-800 text-[#a78bfa]" : "bg-white text-indigo-600"} ${isRefreshing ? 'animate-spin' : ''}`}>
          <RefreshCw className="w-5 h-5" />
        </div>
      </div>
      <div 
        className="transition-transform duration-300 w-full h-full" 
        style={{ transform: `translateY(${isRefreshing ? 60 : pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
};
