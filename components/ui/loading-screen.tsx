'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
        >
          <div className="relative">
            {/* Glow behind logo */}
            <motion.div
              className="absolute inset-0 bg-neon-green/20 blur-[60px] rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* Logo container */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.2
              }}
              className="relative"
            >
              {/* Outer ring */}
              <motion.div
                className="w-24 h-24 rounded-2xl border-2 border-neon-green/30 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                {/* Inner logo */}
                <motion.div
                  className="w-16 h-16 rounded-xl bg-neon-green flex items-center justify-center"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(0,255,102,0.3)',
                      '0 0 40px rgba(0,255,102,0.6)',
                      '0 0 20px rgba(0,255,102,0.3)',
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <motion.span
                    className="text-gray-900 font-bold text-3xl"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    L
                  </motion.span>
                </motion.div>
              </motion.div>

              {/* Orbiting dots */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: i === 0 ? '#00FF66' : i === 1 ? '#FFD93D' : '#FF6B6B',
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: [0, 50, 0, -50, 0],
                    y: [-50, 0, 50, 0, -50],
                    scale: [1, 1.2, 1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>

            {/* Loading text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center"
            >
              <motion.p
                className="text-gray-500 text-sm font-mono"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Initializing<span className="text-neon-green">...</span>
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
