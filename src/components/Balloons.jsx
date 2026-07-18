import React from 'react';
import { motion } from 'framer-motion';

export default function Balloons() {
  const letters = ['L', 'A', 'D', 'A'];
  const colors = ['#ec4899', '#a855f7', '#3b82f6', '#fbbf24'];

  return (
    <div className="absolute inset-0 flex items-center justify-center gap-6 md:gap-12 pointer-events-none z-0 mt-[-10vh]">
      {letters.map((char, i) => (
        <motion.div
          key={i}
          initial={{ y: '100vh', opacity: 0 }}
          animate={{ y: Math.sin(i) * 20, opacity: 1 }}
          transition={{ duration: 2, delay: i * 0.4, type: 'spring', bounce: 0.3 }}
          className="relative flex flex-col items-center"
        >
          {/* Balloon Body */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 3 + Math.random(), repeat: Infinity, ease: "easeInOut", delay: Math.random() }}
            className="w-24 h-32 md:w-32 md:h-40 rounded-[50%] flex items-center justify-center relative"
            style={{ 
              backgroundColor: colors[i], 
              boxShadow: 'inset -12px -12px 24px rgba(0,0,0,0.25), inset 12px 12px 24px rgba(255,255,255,0.4), 0 10px 15px rgba(0,0,0,0.1)' 
            }}
          >
            <span className="font-display text-5xl md:text-7xl text-white drop-shadow-lg">{char}</span>
            {/* Balloon Tie */}
            <div className="absolute -bottom-3 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[10px] border-l-transparent border-r-transparent" style={{ borderBottomColor: colors[i] }} />
          </motion.div>
          
          {/* String */}
          <motion.div 
             animate={{ rotate: [-2, 2, -2] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
             className="w-[1px] h-40 bg-gray-400 opacity-60 mt-3 origin-top" 
          />
        </motion.div>
      ))}
    </div>
  );
}
