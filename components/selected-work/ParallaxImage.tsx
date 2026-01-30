"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useIsMobile } from "@/hooks/useParallax";
import { cn } from "@/lib/utils";

interface ParallaxImageProps {
  src: string;
  alt: string;
  speed?: number;
  className?: string;
  overlay?: boolean;
  priority?: boolean;
}

/**
 * Image component with parallax effect on scroll
 */
export function ParallaxImage({
  src,
  alt,
  speed = 0.3,
  className,
  overlay = false,
  priority = false,
}: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Disable parallax on mobile for performance
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    isMobile ? [0, 0] : [-50 * speed, 50 * speed]
  );

  const scale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    isMobile ? [1, 1, 1] : [1.1, 1, 1.1]
  );

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        className
      )}
    >
      <motion.div
        style={{ y, scale }}
        className="relative w-full h-full"
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          priority={priority}
          sizes="(max-width: 768px) 100vw, 60vw"
        />
      </motion.div>

      {/* Gradient Overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/20 pointer-events-none" />
      )}
    </div>
  );
}
