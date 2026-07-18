import React from 'react';
import { motion } from 'framer-motion';

export default function Decorations() {
  const confetti = Array.from({ length: 80 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 3,
    color: ['#fbbf24', '#ec4899', '#a855f7', '#3b82f6', '#10b981', '#f43f5e'][Math.floor(Math.random() * 6)]
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Banners */}
      <motion.div 
        initial={{ y: -100 }} 
        animate={{ y: 0 }} 
        transition={{ duration: 1.5, type: 'spring', bounce: 0.4 }}
        className="absolute top-0 left-0 w-full h-24 flex justify-around opacity-90"
      >
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={`banner-${i}`} className="w-0 h-0 border-l-[30px] border-r-[30px] border-t-[50px] border-l-transparent border-r-transparent drop-shadow-md"
               style={{ borderTopColor: ['#fbbf24', '#ec4899', '#a855f7', '#3b82f6'][i % 4] }} />
        ))}
      </motion.div>

      {/* Confetti */}
      {confetti.map(c => (
        <motion.div
          key={c.id}
          initial={{ y: -20, x: `${c.x}vw`, opacity: 0, rotate: 0 }}
          animate={{ y: '100vh', opacity: [0, 1, 1, 0], rotate: 360, x: `${c.x + (Math.random() * 10 - 5)}vw` }}
          transition={{ duration: 4 + Math.random() * 2, delay: c.delay, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 w-3 h-7 rounded-sm shadow-sm"
          style={{ backgroundColor: c.color }}
        />
      ))}
    </div>
  );
}
