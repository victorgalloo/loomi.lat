import * as React from "react";

import { cn } from "@/lib/utils";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal";
  viewportRef?: React.Ref<HTMLDivElement>;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, orientation = "vertical", children, viewportRef, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden",
        orientation === "vertical" ? "h-full" : "w-full",
        className
      )}
      {...props}
    >
      <div
        ref={viewportRef}
        className={cn(
          "h-full w-full overflow-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted/70",
          "transform-gpu will-change-scroll"
        )}
        style={{ 
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          WebkitOverflowScrolling: "touch"
        }}
      >
        {children}
      </div>
    </div>
  )
);
ScrollArea.displayName = "ScrollArea";

