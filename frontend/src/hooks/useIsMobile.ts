import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // matches Tailwind's md: breakpoint

/**
 * Hook that returns true when the viewport is below the mobile breakpoint.
 * Listens to window resize events and updates reactively.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Set initial value
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
