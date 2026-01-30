"use client";

import { motion } from "framer-motion";
import { animations, viewport } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article";
}

/**
 * Wrapper component for scroll-triggered fade-in-up animations
 */
export function AnimatedSection({ 
  children, 
  delay = 0,
  className,
  as = "div"
}: AnimatedSectionProps) {
  const MotionComponent = motion[as];
  const animationProps = delay > 0 
    ? animations.fadeInUpDelayed(delay) 
    : animations.fadeInUp;

  return (
    <MotionComponent
      initial={animationProps.initial}
      whileInView={animationProps.animate}
      viewport={viewport}
      transition={animationProps.transition}
      className={cn(className)}
    >
      {children}
    </MotionComponent>
  );
}


