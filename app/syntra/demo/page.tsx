"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Bot, Sparkles, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ChatLayout } from "@/components/chat/chat-layout";
import { MessageList } from "@/components/chat/message-list";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { SuggestionChips } from "@/components/chat/suggestion-chips";
import { ResultCard } from "@/components/chat/result-card";
import {
  buildAssistantResponse,
  type ChatMessage,
  type AssistantResponse
} from "@/lib/responses";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const buildUserMessage = (content: string): ChatMessage => ({
  id: createId(),
  role: "user",
  content: <MessageBubble role="user">{content}</MessageBubble>
});

const buildAssistantMessage = (response: AssistantResponse): ChatMessage => ({
  id: createId(),
  role: "assistant",
  content: (
    <MessageBubble role="assistant" variant="surface">
      <ResultCard response={response} />
    </MessageBubble>
  )
});

export default function DemoPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const thinkingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSendMessage = (value: string) => {
    if (!value.trim()) return;

    if (thinkingTimeout.current) {
      clearTimeout(thinkingTimeout.current);
      thinkingTimeout.current = null;
    }

    const userMessage = buildUserMessage(value);
    const response = buildAssistantResponse(value);

    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    thinkingTimeout.current = setTimeout(() => {
      setMessages((prev) => [...prev, buildAssistantMessage(response)]);
      setIsThinking(false);
      thinkingTimeout.current = null;
    }, 3400);
  };

  const handleSuggestion = (value: string) => {
    if (isThinking) return;
    handleSendMessage(value);
  };

  useEffect(() => {
    return () => {
      if (thinkingTimeout.current) {
        clearTimeout(thinkingTimeout.current);
        thinkingTimeout.current = null;
      }
    };
  }, []);

  return (
    <main className="relative z-10 flex h-screen flex-col overflow-hidden px-4 pb-8 pt-10 md:px-8" style={{ background: "linear-gradient(135deg, #e8eaf6 0%, #f5f5f5 50%, #e3f2fd 100%)", transform: "translateZ(0)", willChange: "transform", backfaceVisibility: "hidden" }}>
      <div className="mx-auto flex h-full w-full max-w-6xl flex-1 flex-col overflow-hidden">
        <header className="flex w-full flex-col gap-8 text-center">
          <div className="flex items-center justify-between">
            <Link href="/syntra" className="flex items-end gap-3 text-left">
              <img 
                src="/assets/icons/Syntra hor no bg lightmode.svg" 
                alt="Syntra" 
                className="h-10 w-auto cursor-pointer"
              />
              <div className="mb-0.5 flex items-center gap-1.5">
                <span className="text-[9px] font-medium text-muted-foreground">powered by</span>
                <img 
                  src="/assets/icons/databricks1.svg" 
                  alt="Databricks" 
                  className="h-2.5 w-auto"
                />
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/syntra">
                <Button variant="outline" size="sm" className="rounded-full border-black/10">
                  Volver
                </Button>
              </Link>
              <Avatar>
                <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
              </Avatar>
            </div>
          </div>

        </header>

        <div className="mt-8 mb-8 flex w-full flex-1 flex-col min-h-0">
          <ChatLayout>
            <MessageList messages={messages} isThinking={isThinking}>
              {messages.length === 0 && (
                <SuggestionChips
                  onSelect={handleSuggestion}
                  disabled={isThinking}
                  className="px-5 pt-5 pb-3 md:px-6"
                />
              )}
            </MessageList>

            <div className="border-t border-white/20">
              <ChatInput
                onSubmit={handleSendMessage}
                disabled={isThinking}
              />
            </div>
          </ChatLayout>
        </div>
      </div>
    </main>
  );
}

