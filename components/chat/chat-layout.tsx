import { cn } from "@/lib/utils";

type ChatLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

// Liquid Glass Chat Container - iOS 18 inspired glassmorphism
export const ChatLayout = ({ children, className }: ChatLayoutProps) => {
  return (
    <section
      className={cn(
        "liquid-glass-gradient ambient-glow specular-highlight",
        "relative mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden min-h-0",
        "rounded-[40px]",
        "frosted-border",
        className
      )}
      style={{ transform: "translateZ(0)", willChange: "transform", backfaceVisibility: "hidden" }}
    >
      <div className="relative z-20 flex flex-1 flex-col min-h-0 overflow-hidden">{children}</div>
    </section>
  );
};

