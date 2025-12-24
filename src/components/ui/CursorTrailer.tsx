'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Creative cursor trailer component
 * Smooth soccer ball that follows the mouse cursor with requestAnimationFrame
 */
export function CursorTrailer() {
  const [displayPosition, setDisplayPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const targetPosition = useRef({ x: -100, y: -100 });
  const animationFrameId = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isVisible) setIsVisible(true);
    targetPosition.current = { x: e.clientX, y: e.clientY };
  }, [isVisible]);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = !!(
      target.tagName === 'A' ||
      target.tagName === 'BUTTON' ||
      target.closest('a') ||
      target.closest('button') ||
      target.closest('[role="button"]') ||
      target.closest('[data-interactive]')
    );
    
    setIsHovering(isInteractive);
  }, []);

  // Smooth animation using requestAnimationFrame
  useEffect(() => {
    if (!isVisible) return;

    const animate = () => {
      setDisplayPosition((prev) => {
        const dx = targetPosition.current.x - prev.x;
        const dy = targetPosition.current.y - prev.y;
        
        // Smooth interpolation (easing factor)
        const factor = 0.15;
        const newX = prev.x + dx * factor;
        const newY = prev.y + dy * factor;
        
        return { x: newX, y: newY };
      });
      
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    // Only enable on desktop
    if (window.innerWidth < 768) return;

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, [handleMouseMove, handleMouseOver]);

  // Hide on mobile
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setIsVisible(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: `${displayPosition.x}px`,
        top: `${displayPosition.y}px`,
        transform: 'translate(-50%, -50%)',
        willChange: 'transform',
      }}
    >
      <div
        className={`text-3xl transition-all duration-200 ease-out ${
          isHovering 
            ? 'scale-150 opacity-100' 
            : 'scale-100 opacity-70'
        }`}
        style={{
          filter: isHovering ? 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))' : 'drop-shadow(0 0 6px rgba(0, 0, 0, 0.3))',
          transform: `translate(-50%, -50%) ${isHovering ? 'scale(1.5)' : 'scale(1)'}`,
        }}
      >
        ⚽
      </div>
    </div>
  );
}
