"use client";

import { motion } from "framer-motion";
import { animations, viewport } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

/**
 * Reusable animated section header with title and optional subtitle
 */
export function SectionHeader({ 
  title, 
  subtitle, 
  centered = true,
  className 
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={animations.fadeInUp.initial}
      whileInView={animations.fadeInUp.animate}
      viewport={viewport}
      transition={animations.fadeInUp.transition}
      className={cn(
        "mb-16",
        centered && "text-center",
        className
      )}
    >
      <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className={cn(
          "text-lg text-gray-600",
          centered && "max-w-2xl mx-auto"
        )}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}


