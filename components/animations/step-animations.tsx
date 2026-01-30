"use client";

import { motion } from "framer-motion";

// Paso 1: Diagnóstico - Búsqueda con ondas expansivas
export const DiagnosisAnimation = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Magnifying glass */}
        <motion.div
          animate={isActive ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : { scale: 1 }}
          transition={{ duration: 2, repeat: isActive ? Infinity : 0, repeatDelay: 1 }}
          className="relative z-10"
        >
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <motion.circle
              cx="35"
              cy="35"
              r="20"
              stroke="#FF9F32"
              strokeWidth="3"
              fill="none"
              animate={isActive ? { pathLength: [0, 1, 0] } : { pathLength: 0 }}
              transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
            />
            <motion.line
              x1="50"
              y1="50"
              x2="65"
              y2="65"
              stroke="#FF9F32"
              strokeWidth="3"
              strokeLinecap="round"
              animate={isActive ? { pathLength: [0, 1, 0] } : { pathLength: 0 }}
              transition={{ duration: 2, repeat: isActive ? Infinity : 0, delay: 0.5 }}
            />
          </svg>
        </motion.div>

        {/* Expanding waves */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={
              isActive
                ? {
                    scale: [1, 2.5],
                    opacity: [0.6, 0]
                  }
                : { scale: 1, opacity: 0 }
            }
            transition={{
              duration: 2,
              repeat: isActive ? Infinity : 0,
              delay: i * 0.6,
              ease: "easeOut"
            }}
            style={{ originX: 0.5, originY: 0.5 }}
          />
        ))}
      </div>
    </div>
  );
};

// Paso 2: Análisis - Arquitectura con nodos conectados
export const ArchitectureAnimation = ({ isActive }: { isActive: boolean }) => {
  const nodes = [
    { x: 50, y: 30, delay: 0 },
    { x: 20, y: 60, delay: 0.2 },
    { x: 80, y: 60, delay: 0.4 },
    { x: 50, y: 80, delay: 0.6 }
  ];

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
        {/* Connection lines */}
        {isActive && (
          <>
            <motion.line
              x1="50"
              y1="30"
              x2="20"
              y2="60"
              stroke="#FF9F32"
              strokeWidth="1.5"
              strokeDasharray="5,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            <motion.line
              x1="50"
              y1="30"
              x2="80"
              y2="60"
              stroke="#FF9F32"
              strokeWidth="1.5"
              strokeDasharray="5,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
            />
            <motion.line
              x1="20"
              y1="60"
              x2="50"
              y2="80"
              stroke="#FF9F32"
              strokeWidth="1.5"
              strokeDasharray="5,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
            />
            <motion.line
              x1="80"
              y1="60"
              x2="50"
              y2="80"
              stroke="#FF9F32"
              strokeWidth="1.5"
              strokeDasharray="5,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 1.1 }}
            />
          </>
        )}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.g key={i}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="4"
              fill="#FF9F32"
              initial={{ scale: 0, opacity: 0 }}
              animate={
                isActive
                  ? {
                      scale: [0, 1.5, 1],
                      opacity: [0, 1, 1]
                    }
                  : { scale: 0, opacity: 0 }
              }
              transition={{
                duration: 0.5,
                delay: node.delay,
                repeat: isActive ? Infinity : 0,
                repeatDelay: 2
              }}
            />
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="8"
              fill="none"
              stroke="#FF9F32"
              strokeWidth="1"
              opacity="0.3"
              animate={
                isActive
                  ? {
                      scale: [1, 2, 1],
                      opacity: [0.3, 0, 0.3]
                    }
                  : { scale: 1, opacity: 0 }
              }
              transition={{
                duration: 1.5,
                delay: node.delay,
                repeat: isActive ? Infinity : 0,
                repeatDelay: 2
              }}
            />
          </motion.g>
        ))}
      </svg>
    </div>
  );
};

// Paso 3: Migración - Datos fluyendo
export const MigrationAnimation = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
        {/* Cloud source */}
        <motion.g
          animate={isActive ? { y: [0, -5, 0] } : { y: 0 }}
          transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
        >
          <ellipse cx="20" cy="30" rx="12" ry="8" fill="#FF9F32" opacity="0.3" />
          <ellipse cx="25" cy="35" rx="10" ry="6" fill="#FF9F32" opacity="0.5" />
        </motion.g>

        {/* Data packets flowing */}
        {[0, 1, 2, 3].map((i) => (
          <motion.g key={i}>
            <motion.rect
              x="35"
              y={20 + i * 15}
              width="8"
              height="6"
              rx="1"
              fill="#FF9F32"
              initial={{ x: 35 }}
              animate={
                isActive
                  ? {
                      x: [35, 65, 35],
                      opacity: [0.3, 1, 0.3]
                    }
                  : { x: 35, opacity: 0.3 }
              }
              transition={{
                duration: 2,
                repeat: isActive ? Infinity : 0,
                delay: i * 0.4,
                ease: "easeInOut"
              }}
            />
          </motion.g>
        ))}

        {/* Target database */}
        <motion.g
          animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
        >
          <rect x="70" y="20" width="20" height="60" rx="2" fill="none" stroke="#FF9F32" strokeWidth="2" />
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1="72"
              y1={25 + i * 15}
              x2="88"
              y2={25 + i * 15}
              stroke="#FF9F32"
              strokeWidth="1"
              opacity="0.5"
            />
          ))}
        </motion.g>
      </svg>
    </div>
  );
};

// Paso 4: Configuración - Engranajes girando
export const ConfigurationAnimation = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Main gear */}
        <motion.svg
          width="60"
          height="60"
          viewBox="0 0 60 60"
          animate={isActive ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 3, repeat: isActive ? Infinity : 0, ease: "linear" }}
          style={{ originX: 0.5, originY: 0.5 }}
        >
          <path
            d="M30 5 L32 15 L38 15 L35 22 L42 25 L38 32 L30 30 L22 32 L18 25 L25 22 L22 15 L28 15 Z"
            fill="#FF9F32"
            opacity="0.8"
          />
          <circle cx="30" cy="30" r="8" fill="white" />
        </motion.svg>

        {/* Small gear */}
        <motion.svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          className="absolute top-8 right-8"
          animate={isActive ? { rotate: -360 } : { rotate: 0 }}
          transition={{ duration: 2, repeat: isActive ? Infinity : 0, ease: "linear" }}
          style={{ originX: 0.5, originY: 0.5 }}
        >
          <path
            d="M20 3 L21 10 L26 10 L24 16 L28 18 L26 24 L20 22 L14 24 L12 18 L16 16 L14 10 L19 10 Z"
            fill="#FF9E62"
            opacity="0.6"
          />
          <circle cx="20" cy="20" r="5" fill="white" />
        </motion.svg>

        {/* Sparkles */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-primary"
            style={{
              top: `${20 + i * 20}%`,
              left: `${15 + i * 25}%`
            }}
            animate={
              isActive
                ? {
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0]
                  }
                : { scale: 0, opacity: 0 }
            }
            transition={{
              duration: 1.5,
              repeat: isActive ? Infinity : 0,
              delay: i * 0.3
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Paso 5: Despliegue - Cohete despegando
export const DeploymentAnimation = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
        {/* Rocket */}
        <motion.g
          animate={
            isActive
              ? {
                  y: [80, 20, 80],
                  rotate: [0, -5, 0]
                }
              : { y: 80, rotate: 0 }
          }
          transition={{
            duration: 2,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          {/* Rocket body */}
          <path
            d="M45 80 L50 60 L55 80 Z"
            fill="#FF9F32"
          />
          <rect x="47" y="60" width="6" height="15" rx="1" fill="#FF9E62" />
          {/* Rocket window */}
          <circle cx="50" cy="70" r="2" fill="#AA2801" />
          {/* Rocket fins */}
          <path d="M45 80 L40 85 L45 85 Z" fill="#FF9E62" />
          <path d="M55 80 L60 85 L55 85 Z" fill="#FF9E62" />
        </motion.g>

        {/* Fire trail */}
        {[0, 1, 2].map((i) => (
          <motion.g key={i}>
            <motion.path
              d={`M${45 + i * 5} 85 L${47 + i * 5} 95 L${48 + i * 5} 90 Z`}
              fill="#FF9F32"
              opacity="0.6"
              animate={
                isActive
                  ? {
                      pathLength: [0, 1, 0],
                      opacity: [0.8, 0.3, 0.8],
                      scaleY: [1, 1.5, 1]
                    }
                  : { pathLength: 0, opacity: 0 }
              }
              transition={{
                duration: 0.5,
                repeat: isActive ? Infinity : 0,
                delay: i * 0.1
              }}
            />
          </motion.g>
        ))}

        {/* Stars */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.circle
            key={i}
            cx={15 + i * 20}
            cy={30 + (i % 2) * 15}
            r="1.5"
            fill="#FF9F32"
            animate={
              isActive
                ? {
                    opacity: [0.3, 1, 0.3],
                    scale: [1, 1.5, 1]
                  }
                : { opacity: 0.3, scale: 1 }
            }
            transition={{
              duration: 1.5,
              repeat: isActive ? Infinity : 0,
              delay: i * 0.2
            }}
          />
        ))}
      </svg>
    </div>
  );
};

