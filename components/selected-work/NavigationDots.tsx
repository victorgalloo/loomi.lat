"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavigationDotsProps {
  totalSections: number;
  activeSection: number;
  onDotClick: (index: number) => void;
  labels?: string[];
}

/**
 * Fixed navigation dots for section navigation
 */
export function NavigationDots({
  totalSections,
  activeSection,
  onDotClick,
  labels,
}: NavigationDotsProps) {
  return (
    <nav
      className="fixed right-6 lg:right-10 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-end gap-4"
      aria-label="Page navigation"
    >
      {Array.from({ length: totalSections }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className="group flex items-center gap-3"
          aria-label={labels?.[index] || `Section ${index + 1}`}
          aria-current={activeSection === index ? "true" : undefined}
        >
          {/* Label (appears on hover) */}
          <span
            className={cn(
              "text-sm font-medium transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0",
              activeSection === index ? "text-[#FF3621]" : "text-gray-500"
            )}
          >
            {labels?.[index] || `0${index + 1}`}
          </span>

          {/* Dot */}
          <motion.div
            animate={
              activeSection === index
                ? { scale: 1.4, backgroundColor: "#FF3621" }
                : { scale: 1, backgroundColor: "#9CA3AF" }
            }
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-2.5 h-2.5 rounded-full cursor-pointer"
          />
        </button>
      ))}
    </nav>
  );
}

/**
 * Progress bar variant for mobile
 */
export function ProgressBar({
  progress,
}: {
  progress: number;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50 md:hidden">
      <motion.div
        className="h-full bg-[#FF3621]"
        style={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
}
