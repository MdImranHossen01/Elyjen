"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Standard desktop breakpoint
    if (window.innerWidth < 1024) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);
    
    // Global fix for nested scrollables (dropdowns, popovers, etc.)
    // Automatically adds data-lenis-prevent to scrollable elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const scrollable = target.closest('.overflow-y-auto, [role="listbox"], [role="dialog"], [role="menu"], .scroll-area');
      if (scrollable && !scrollable.hasAttribute('data-lenis-prevent')) {
        scrollable.setAttribute('data-lenis-prevent', 'true');
      }
    };

    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return <>{children}</>;
}

