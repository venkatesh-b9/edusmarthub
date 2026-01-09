import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function EduSmartHubLogo({ size = 60, className = '', animated = true }: LogoProps) {
  const shieldSize = size;

  return (
    <div className={`relative ${className}`} style={{ width: shieldSize, height: shieldSize * 1.2 }}>
      <svg
        width={shieldSize}
        height={shieldSize * 1.2}
        viewBox="0 0 200 240"
        className="drop-shadow-lg"
      >
        <defs>
          {/* Shield Gradient */}
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="1" />
            <stop offset="100%" stopColor="#1E40AF" stopOpacity="1" />
          </linearGradient>
          
          {/* Brain/Circuitry Gradient - Blue/Cyan */}
          <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="1" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="1" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="1" />
          </linearGradient>
          
          {/* Network Gradient - Orange/Gold */}
          <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="1" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="1" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="1" />
          </linearGradient>
          
          {/* Node Highlight */}
          <radialGradient id="nodeHighlight" cx="50%" cy="30%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* Shield Shape */}
        <path
          d="M100 20 L180 50 L180 150 Q180 200 100 220 Q20 200 20 150 L20 50 Z"
          fill="url(#shieldGradient)"
          stroke="#1E40AF"
          strokeWidth="3"
        />

        {/* Left Half - Brain with Circuitry */}
        <g clipPath="url(#leftHalfClip)">
          {/* Brain Shape - Left Hemisphere */}
          <motion.path
            d="M40 80 Q30 70 25 85 Q20 100 25 115 Q30 130 40 135 Q50 140 60 135 Q70 130 75 115 Q80 100 75 85 Q70 70 60 75 Q50 70 40 80"
            fill="url(#brainGradient)"
            initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
            animate={animated ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 2 }}
          />
          
          {/* Brain Convolutions */}
          <motion.path
            d="M45 90 Q40 85 35 90 Q30 95 35 100"
            fill="none"
            stroke="#93C5FD"
            strokeWidth="1.5"
            initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
            animate={animated ? { pathLength: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }}
          />
          <motion.path
            d="M55 110 Q50 105 45 110 Q40 115 45 120"
            fill="none"
            stroke="#93C5FD"
            strokeWidth="1.5"
            initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
            animate={animated ? { pathLength: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.7, repeat: Infinity }}
          />
          
          {/* Circuit Board Traces */}
          <motion.line
            x1="45"
            y1="90"
            x2="55"
            y2="95"
            stroke="#60A5FA"
            strokeWidth="1.5"
            initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
            animate={animated ? { pathLength: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }}
          />
          <motion.line
            x1="55"
            y1="105"
            x2="65"
            y2="100"
            stroke="#60A5FA"
            strokeWidth="1.5"
            initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
            animate={animated ? { pathLength: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.7, repeat: Infinity }}
          />
          <motion.line
            x1="50"
            y1="100"
            x2="60"
            y2="110"
            stroke="#60A5FA"
            strokeWidth="1.5"
            initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
            animate={animated ? { pathLength: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.9, repeat: Infinity }}
          />
          
          {/* Circuit Nodes */}
          <circle cx="50" cy="92" r="2.5" fill="#93C5FD" />
          <circle cx="60" cy="102" r="2.5" fill="#93C5FD" />
          <circle cx="55" cy="108" r="2" fill="#60A5FA" />
        </g>

        {/* Right Half - Network Nodes */}
        <g clipPath="url(#rightHalfClip)">
          {/* Network Nodes - Orange/Gold with highlights */}
          <circle cx="130" cy="90" r="7" fill="url(#networkGradient)" />
          <circle cx="130" cy="90" r="4" fill="url(#nodeHighlight)" opacity="0.6" />
          
          <circle cx="150" cy="100" r="7" fill="url(#networkGradient)" />
          <circle cx="150" cy="100" r="4" fill="url(#nodeHighlight)" opacity="0.6" />
          
          <circle cx="140" cy="115" r="7" fill="url(#networkGradient)" />
          <circle cx="140" cy="115" r="4" fill="url(#nodeHighlight)" opacity="0.6" />
          
          <circle cx="160" cy="125" r="7" fill="url(#networkGradient)" />
          <circle cx="160" cy="125" r="4" fill="url(#nodeHighlight)" opacity="0.6" />
          
          <circle cx="145" cy="105" r="5" fill="url(#networkGradient)" />
          <circle cx="145" cy="105" r="3" fill="url(#nodeHighlight)" opacity="0.6" />
          
          {/* Network Lines/Edges */}
          <motion.line
            x1="130"
            y1="90"
            x2="150"
            y2="100"
            stroke="#F59E0B"
            strokeWidth="2.5"
            initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
            animate={animated ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.line
            x1="150"
            y1="100"
            x2="140"
            y2="115"
            stroke="#F59E0B"
            strokeWidth="2.5"
            initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
            animate={animated ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.2, repeat: Infinity }}
          />
          <motion.line
            x1="140"
            y1="115"
            x2="160"
            y2="125"
            stroke="#F59E0B"
            strokeWidth="2.5"
            initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
            animate={animated ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.4, repeat: Infinity }}
          />
          <motion.line
            x1="130"
            y1="90"
            x2="145"
            y2="105"
            stroke="#F59E0B"
            strokeWidth="2"
            initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
            animate={animated ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.3, repeat: Infinity }}
          />
          <motion.line
            x1="145"
            y1="105"
            x2="150"
            y2="100"
            stroke="#F59E0B"
            strokeWidth="2"
            initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
            animate={animated ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.5, repeat: Infinity }}
          />
        </g>

        {/* Clipping Paths */}
        <defs>
          <clipPath id="leftHalfClip">
            <path d="M100 20 L20 50 L20 150 Q20 200 100 220 Q100 20 100 20 Z" />
          </clipPath>
          <clipPath id="rightHalfClip">
            <path d="M100 20 L180 50 L180 150 Q180 200 100 220 Q100 20 100 20 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Graduation Cap on Top */}
      <motion.div
        className="absolute -top-6 left-1/2 -translate-x-1/2"
        initial={animated ? { y: 0, rotate: 0 } : {}}
        animate={animated ? { y: [-2, 2, -2], rotate: [0, 2, 0] } : {}}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="relative">
          {/* Cap Base */}
          <div 
            className="h-5 bg-[#1E40AF] rounded-t-lg"
            style={{ 
              width: shieldSize * 0.4,
              marginLeft: (shieldSize - shieldSize * 0.4) / 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} 
          />
          {/* Cap Top Square */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#1E40AF] transform rotate-12 rounded-sm"
            style={{
              width: shieldSize * 0.3,
              height: shieldSize * 0.3,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          />
          {/* Tassel */}
          <motion.div
            className="absolute top-1 right-2 w-1 bg-[#F59E0B] rounded-full"
            style={{ height: shieldSize * 0.15 }}
            animate={animated ? { y: [0, 2, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Shadow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/20 blur-xl rounded-full"
        style={{
          width: shieldSize * 0.8,
          height: shieldSize * 0.15,
          transform: 'translateY(8px)',
        }}
      />
    </div>
  );
}
