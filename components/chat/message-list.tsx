import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

import { ChatMessage } from "@/lib/responses";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ThinkingIndicator } from "@/components/chat/thinking-indicator";

type MessageListProps = {
  messages: ChatMessage[];
  isThinking?: boolean;
  children?: React.ReactNode;
};

// Animated list of chat messages, mounted within the central card.
export const MessageList = ({ messages, isThinking = false, children }: MessageListProps) => {
  const hasMessages = messages.length > 0;
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!viewportRef.current) return;
    viewportRef.current.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, isThinking]);

  return (
    <ScrollArea className="flex-1 min-h-0" viewportRef={viewportRef}>
      <div className="flex h-full flex-col gap-8 p-6 md:px-10 md:py-8">
        {hasMessages ? (
          <>
            {messages.map((message) => (
              <div key={message.id}>
                {message.content}
              </div>
            ))}
            {isThinking && (
              <MessageBubble role="assistant" variant="surface">
                <ThinkingIndicator />
              </MessageBubble>
            )}
          </>
        ) : (
          <div className="liquid-glass flex flex-1 flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-white/30 p-12 text-center">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-base-foreground">
                Ready to explore your data
              </p>
              <p className="max-w-sm text-[15px] leading-relaxed text-base-foreground/70">
                Ask a question or choose a suggestion below to get started with your business insights
              </p>
            </div>
          </div>
        )}
      </div>
      {children}
    </ScrollArea>
  );
};

