import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  role: "user" | "assistant";
  variant?: "solid" | "surface";
  children: React.ReactNode;
};

// Shared bubble styling for both user and assistant messages.
export const MessageBubble = ({
  role,
  variant = "solid",
  children
}: MessageBubbleProps) => {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end text-right" : "justify-start text-left"
      )}
    >
      <div
        className={cn(
          "max-w-2xl rounded-[24px] px-6 py-4 text-[15px] leading-relaxed",
          isUser && "liquid-glass border border-white/40 bg-gradient-to-br from-primary/90 to-primary text-base-foreground shadow-[0_8px_24px_rgba(255,159,50,0.25)]",
          !isUser &&
            (variant === "solid"
              ? "liquid-glass border border-white/30 text-base-foreground"
              : "border-transparent bg-transparent p-0 shadow-none")
        )}
      >
        {children}
      </div>
    </div>
  );
};

