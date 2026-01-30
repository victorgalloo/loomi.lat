"use client";

import { useScroll, useTransform, MotionValue } from "framer-motion";
import { RefObject, useEffect, useState } from "react";

/**
 * Hook for creating parallax effect on scroll
 * @param ref - Reference to the element
 * @param speed - Parallax speed (-1 to 1). Positive = moves up, Negative = moves down
 * @returns MotionValue for y transform
 */
export function useParallax(
  ref: RefObject<HTMLElement>,
  speed: number = 0.5
): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-100 * speed, 100 * speed]);

  return y;
}

/**
 * Hook to detect if device prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}

/**
 * Hook to detect if device is mobile
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
