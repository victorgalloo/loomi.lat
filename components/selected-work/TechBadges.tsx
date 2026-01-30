"use client";

import { motion } from "framer-motion";
import { selectedWorkAnimations } from "@/lib/selected-work-animations";
import { cn } from "@/lib/utils";

interface TechBadgesProps {
  technologies: string[];
  className?: string;
  variant?: "default" | "outline" | "filled";
}

/**
 * Animated tech badges with stagger effect
 */
export function TechBadges({
  technologies,
  className,
  variant = "default",
}: TechBadgesProps) {
  const variantStyles = {
    default: "bg-gray-100 text-gray-700 border border-gray-200",
    outline: "bg-transparent text-gray-600 border border-gray-300",
    filled: "bg-[#FF3621]/10 text-[#FF3621] border border-[#FF3621]/20",
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={selectedWorkAnimations.techBadges.container}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {technologies.map((tech) => (
        <motion.span
          key={tech}
          variants={selectedWorkAnimations.techBadges.badge}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-full transition-colors hover:bg-[#FF3621]/10 hover:text-[#FF3621] hover:border-[#FF3621]/30",
            variantStyles[variant]
          )}
        >
          {tech}
        </motion.span>
      ))}
    </motion.div>
  );
}
