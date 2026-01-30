"use client";

import { motion } from "framer-motion";

// Seguridad Primero - Escudo con capas de protección animadas
export const SecurityFeature = () => {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Shield with animated layers */}
        <motion.svg
          width="140"
          height="120"
          viewBox="0 0 140 120"
          className="relative z-10"
        >
          {/* Outer shield glow */}
          <motion.path
            d="M70 20 L45 30 L45 50 Q45 70 55 80 Q70 90 85 80 Q95 70 95 50 L95 30 Z"
            fill="none"
            stroke="#FF9F32"
            strokeWidth="3"
            opacity="0.3"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Main shield */}
          <motion.path
            d="M70 20 L45 30 L45 50 Q45 70 55 80 Q70 90 85 80 Q95 70 95 50 L95 30 Z"
            fill="#FF9F32"
            fillOpacity="0.2"
            stroke="#FF9F32"
            strokeWidth="3"
            animate={{
              y: [0, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Checkmark inside */}
          <motion.path
            d="M58 60 L66 68 L82 50"
            fill="none"
            stroke="#FF9F32"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatDelay: 2
            }}
          />
        </motion.svg>

        {/* Floating particles */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-primary"
            style={{
              top: `${20 + i * 20}%`,
              left: `${15 + (i % 2) * 70}%`
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Stack Moderno - Servidores apilados con conexiones animadas
export const StackFeature = () => {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8">
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="140" height="140" viewBox="0 0 140 140" className="relative z-10">
          {/* Server blocks */}
          {[0, 1, 2].map((i) => (
            <motion.g key={i}>
              <motion.rect
                x="30"
                y={30 + i * 35}
                width="80"
                height="25"
                rx="4"
                fill="#FF9F32"
                fillOpacity="0.3"
                stroke="#FF9F32"
                strokeWidth="2"
                animate={{
                  y: [30 + i * 35, 28 + i * 35, 30 + i * 35],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
              {/* Server lines */}
              {[0, 1, 2, 3].map((j) => (
                <line
                  key={j}
                  x1="40"
                  y1={40 + i * 35 + j * 5}
                  x2="100"
                  y2={40 + i * 35 + j * 5}
                  stroke="#FF9F32"
                  strokeWidth="1.5"
                  opacity="0.6"
                />
              ))}
            </motion.g>
          ))}

          {/* Connection lines */}
          <motion.line
            x1="70"
            y1="55"
            x2="70"
            y2="90"
            stroke="#FF9E62"
            strokeWidth="2"
            strokeDasharray="5,5"
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.line
            x1="70"
            y1="90"
            x2="70"
            y2="125"
            stroke="#FF9E62"
            strokeWidth="2"
            strokeDasharray="5,5"
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5,
              ease: "easeInOut"
            }}
          />
        </svg>
      </div>
    </div>
  );
};

// Aislamiento - Cajas separadas con barreras
export const IsolationFeature = () => {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8">
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="140" height="140" viewBox="0 0 140 140" className="relative z-10">
          {/* Left container */}
          <motion.rect
            x="10"
            y="40"
            width="50"
            height="60"
            rx="6"
            fill="none"
            stroke="#FF9F32"
            strokeWidth="2.5"
            strokeDasharray="8,4"
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.02, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Right container */}
          <motion.rect
            x="80"
            y="40"
            width="50"
            height="60"
            rx="6"
            fill="none"
            stroke="#FF9E62"
            strokeWidth="2.5"
            strokeDasharray="8,4"
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.02, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 1,
              ease: "easeInOut"
            }}
          />

          {/* Lock icons */}
          <motion.g>
            <circle cx="35" cy="70" r="8" fill="#FF9F32" fillOpacity="0.3" />
            <motion.path
              d="M35 65 Q35 60 30 60 Q25 60 25 65 L25 70 Q25 75 30 75 Q35 75 35 70 Z"
              fill="none"
              stroke="#FF9F32"
              strokeWidth="2"
              animate={{
                pathLength: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />
          </motion.g>

          <motion.g>
            <circle cx="105" cy="70" r="8" fill="#FF9E62" fillOpacity="0.3" />
            <motion.path
              d="M105 65 Q105 60 100 60 Q95 60 95 65 L95 70 Q95 75 100 75 Q105 75 105 70 Z"
              fill="none"
              stroke="#FF9E62"
              strokeWidth="2"
              animate={{
                pathLength: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 1
              }}
            />
          </motion.g>

          {/* Barrier between */}
          <motion.line
            x1="70"
            y1="20"
            x2="70"
            y2="120"
            stroke="#AA2801"
            strokeWidth="3"
            strokeDasharray="10,5"
            animate={{
              opacity: [0.3, 0.8, 0.3],
              pathLength: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </svg>
      </div>
    </div>
  );
};

// Velocidad - Velocímetro con aguja animada
export const SpeedFeature = () => {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8">
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="140" height="140" viewBox="0 0 140 140" className="relative z-10">
          {/* Gauge arc */}
          <motion.path
            d="M20 100 A50 50 0 0 1 120 100"
            fill="none"
            stroke="#FF9F32"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.3"
          />
          
          {/* Animated gauge arc */}
          <motion.path
            d="M20 100 A50 50 0 0 1 120 100"
            fill="none"
            stroke="#FF9F32"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="157"
            animate={{
              strokeDashoffset: [157, 0, 157],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Needle */}
          <motion.g
            style={{ originX: 70, originY: 100 }}
            animate={{
              rotate: [0, 180, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <line
              x1="70"
              y1="100"
              x2="70"
              y2="50"
              stroke="#FF9F32"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="70" cy="100" r="6" fill="#FF9F32" />
          </motion.g>

          {/* Speed indicators */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.g key={i}>
              <line
                x1={20 + i * 25}
                y1={100}
                x2={20 + i * 25}
                y2={95}
                stroke="#FF9F32"
                strokeWidth="2"
                opacity="0.6"
              />
              <motion.circle
                cx={20 + i * 25}
                cy={100}
                r="2"
                fill="#FF9F32"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            </motion.g>
          ))}

          {/* Center text */}
          <text
            x="70"
            y="115"
            textAnchor="middle"
            className="text-xs font-bold fill-primary"
            style={{ fontSize: "10px" }}
          >
            REAL-TIME
          </text>
        </svg>

        {/* Speed particles */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-primary"
            style={{
              top: `${30 + i * 20}%`,
              left: `${40 + (i % 2) * 20}%`
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    </div>
  );
};

