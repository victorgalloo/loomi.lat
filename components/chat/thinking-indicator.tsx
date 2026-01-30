import { motion } from "framer-motion";

// Clean thinking animation with wave dots
export const ThinkingIndicator = () => {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-black/5 bg-white px-6 py-5 text-left shadow-sm">
      {/* Text and wave dots */}
      <div className="flex flex-col gap-2.5">
        <p className="text-[15px] font-semibold text-base-foreground">
          Analizando tus datos...
        </p>
        <div className="flex items-center gap-1.5">
          {[0, 0.15, 0.3, 0.45].map((delay, index) => (
            <motion.span
              key={delay}
              className="h-2 w-2 rounded-full bg-primary"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                ease: "easeInOut",
                delay
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

