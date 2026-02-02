'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypingCodeProps {
  code: string;
  typingSpeed?: number;
  startDelay?: number;
}

export function TypingCode({ code, typingSpeed = 25, startDelay = 500 }: TypingCodeProps) {
  const [displayedCode, setDisplayedCode] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          setTimeout(() => setIsTyping(true), startDelay);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted, startDelay]);

  useEffect(() => {
    if (!isTyping) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < code.length) {
        setDisplayedCode(code.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [isTyping, code, typingSpeed]);

  const highlightCode = (text: string) => {
    return text
      .replace(/(\/\/.*)$/gm, '<span class="text-muted">$1</span>')
      .replace(/\b(const|let|var|async|await|return|if|else|function)\b/g, '<span class="text-foreground font-medium">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-terminal-yellow">$1</span>')
      .replace(/'([^']*)'/g, '<span class="text-terminal-green">\'$1\'</span>')
      .replace(/"([^"]*)"/g, '<span class="text-terminal-green">"$1"</span>')
      .replace(/\b(\d+)\b/g, '<span class="text-terminal-yellow">$1</span>')
      .replace(/(\w+)\(/g, '<span class="text-foreground">$1</span>(')
      .replace(/\.(\w+)/g, '.<span class="text-muted-foreground">$1</span>');
  };

  return (
    <div ref={ref} className="relative">
      {/* Terminal window */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-elevated">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-surface-2 border-b border-border">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-terminal-red" />
            <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
            <div className="w-3 h-3 rounded-full bg-terminal-green" />
          </div>
          <span className="text-xs text-muted font-mono ml-3">reasoning.ts</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-terminal-green" />
            <span className="text-xs text-muted font-mono">live</span>
          </div>
        </div>

        {/* Code area */}
        <div className="p-5 sm:p-6 min-h-[280px] sm:min-h-[320px] overflow-x-auto bg-background">
          <pre className="text-sm leading-relaxed font-mono">
            <code
              className="text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: highlightCode(displayedCode) }}
            />
            <motion.span
              className="inline-block w-2.5 h-5 bg-foreground ml-0.5 align-middle"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </pre>
        </div>
      </div>
    </div>
  );
}
