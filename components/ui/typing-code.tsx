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
      .replace(/(\/\/.*$)/gm, '<span class="text-gray-500">$1</span>')
      .replace(/\b(const|let|var|async|await|return|if|else|function)\b/g, '<span class="text-neon-purple">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-neon-yellow">$1</span>')
      .replace(/'([^']*)'/g, '<span class="text-neon-green">\'$1\'</span>')
      .replace(/"([^"]*)"/g, '<span class="text-neon-green">"$1"</span>')
      .replace(/\b(\d+)\b/g, '<span class="text-neon-yellow">$1</span>')
      .replace(/(\w+)\(/g, '<span class="text-neon-cyan">$1</span>(')
      .replace(/\.(\w+)/g, '.<span class="text-white">$1</span>');
  };

  return (
    <div ref={ref} className="relative">
      {/* Terminal window */}
      <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-800">
          <div className="flex gap-2">
            <motion.div
              className="w-3 h-3 rounded-full bg-neon-red"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-3 h-3 rounded-full bg-neon-yellow"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-3 h-3 rounded-full bg-neon-green"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
            />
          </div>
          <span className="text-xs text-gray-500 font-mono ml-3">reasoning.ts</span>
          <div className="ml-auto flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-neon-green"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-xs text-gray-500">live</span>
          </div>
        </div>

        {/* Code area */}
        <div className="p-5 sm:p-6 min-h-[280px] sm:min-h-[320px] overflow-x-auto">
          <pre className="text-sm leading-relaxed font-mono">
            <code
              className="text-gray-300"
              dangerouslySetInnerHTML={{ __html: highlightCode(displayedCode) }}
            />
            <motion.span
              className="inline-block w-2.5 h-5 bg-neon-green ml-0.5 align-middle"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </pre>
        </div>
      </div>

      {/* Glow effect behind terminal */}
      <div className="absolute -inset-4 bg-neon-green/5 blur-3xl rounded-full -z-10 animate-pulse-glow" />
    </div>
  );
}
