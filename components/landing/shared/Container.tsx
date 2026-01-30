"use client";

import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Consistent max-width container with horizontal padding
 */
export function Container({ 
  children, 
  className,
  as: Component = "div" 
}: ContainerProps) {
  return (
    <Component className={cn("max-w-7xl mx-auto px-6 lg:px-8", className)}>
      {children}
    </Component>
  );
}


