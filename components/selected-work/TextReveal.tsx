"use client";

import { motion } from "framer-motion";
import { selectedWorkAnimations } from "@/lib/selected-work-animations";
import { cn } from "@/lib/utils";

interface TextRevealProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
}

/**
 * Text component that reveals character by character on scroll
 */
export function TextReveal({
  text,
  className,
  style,
  as = "h2",
  delay = 0,
}: TextRevealProps) {
  const words = text.split(" ");
  const Tag = as;

  return (
    <Tag className={cn("overflow-hidden", className)} style={style}>
      <motion.span
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.02,
              delayChildren: delay,
            },
          },
        }}
        className="inline-flex flex-wrap"
      >
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className="inline-flex mr-[0.25em]">
            {word.split("").map((char, charIndex) => (
              <motion.span
                key={`${wordIndex}-${charIndex}`}
                variants={selectedWorkAnimations.textReveal.char}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}

/**
 * Simpler text animation that fades in word by word
 */
export function TextFadeIn({
  text,
  className,
  as = "p",
  delay = 0,
}: TextRevealProps) {
  const words = text.split(" ");
  const Tag = as;

  return (
    <Tag className={cn(className)}>
      <motion.span
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05,
              delayChildren: delay,
            },
          },
        }}
        className="inline"
      >
        {words.map((word, index) => (
          <motion.span
            key={index}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.3 },
              },
            }}
            className="inline-block mr-[0.25em]"
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
