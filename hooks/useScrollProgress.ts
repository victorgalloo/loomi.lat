"use client";

import { useScroll, useSpring, MotionValue } from "framer-motion";
import { RefObject } from "react";

interface UseScrollProgressOptions {
  target?: RefObject<HTMLElement>;
}

interface UseScrollProgressReturn {
  scrollYProgress: MotionValue<number>;
  scrollY: MotionValue<number>;
}

/**
 * Hook for tracking scroll progress with smooth spring animation
 */
export function useScrollProgress(
  options?: UseScrollProgressOptions
): UseScrollProgressReturn {
  const { scrollYProgress, scrollY } = useScroll({
    target: options?.target,
    offset: ["start start", "end end"],
  });

  return { scrollYProgress, scrollY };
}

/**
 * Hook for smooth scroll progress with spring physics
 */
export function useSmoothScrollProgress(): MotionValue<number> {
  const { scrollYProgress } = useScroll();

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return smoothProgress;
}
