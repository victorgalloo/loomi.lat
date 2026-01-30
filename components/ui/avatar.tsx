import * as React from "react";

import { cn } from "@/lib/utils";

type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
  fallback?: string;
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, children, fallback = "AC", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-muted to-white text-sm font-semibold text-muted-foreground",
          className
        )}
        {...props}
      >
        {children ?? fallback}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

