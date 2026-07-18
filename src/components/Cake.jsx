import React from 'react';
import { motion } from 'framer-motion';

export default function Cake({ lit }) {
  return (
    <motion.div 
      initial={{ scale: 0, opacity: 0, y: 100 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: -100 }}
      transition={{ duration: 1.2, type: 'spring', bounce: 0.5 }}
      className="relative flex flex-col items-center mt-20 z-20"
    >
      {/* Candles */}
      <div className="flex gap-10 mb-[-6px] z-10">
        {[1, 7].map((num, i) => (
          <div key={i} className="flex flex-col items-center">
            {/* Flame */}
            <motion.div 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: lit ? 1 : 0, scale: lit ? [1, 1.15, 1] : 0 }}
              transition={{ duration: lit ? 0.15 + Math.random() * 0.1 : 0.5, repeat: lit ? Infinity : 0, repeatType: "mirror", delay: i * 0.4 }}
              className="w-5 h-8 bg-yellow-400 mb-1 shadow-[0_0_20px_rgba(250,204,21,0.9)]"
              style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }}
            />
            {/* Wick */}
            <div className="w-[3px] h-3 bg-gray-700" />
            {/* Candle Body */}
            <div className="w-10 h-24 bg-gradient-to-r from-pink-300 via-pink-100 to-pink-300 rounded-sm flex items-center justify-center border border-pink-300 shadow-sm relative overflow-hidden">
              <span className="text-pink-600 font-display text-3xl z-10 drop-shadow-sm">{num}</span>
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, #fbcfe8 6px, #fbcfe8 12px)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Cake Tiers */}
      <div className="relative flex flex-col items-center drop-shadow-2xl">
        {/* Top Tier */}
        <div className="w-64 h-24 bg-gradient-to-b from-[#fef3c7] to-[#fcd34d] rounded-t-2xl relative overflow-hidden shadow-inner z-30 border-t-8 border-pink-400">
          <div className="absolute top-0 w-full h-8 bg-pink-400 rounded-b-2xl opacity-90 flex justify-around px-4">
              {[...Array(5)].map((_, i) => <div key={`drip1-${i}`} className="w-5 h-6 bg-pink-400 rounded-b-full shadow-sm" style={{ height: `${20 + Math.random() * 25}px` }} />)}
          </div>
        </div>
        
        {/* Middle Tier */}
        <div className="w-80 h-28 bg-gradient-to-b from-[#fdf2f8] to-[#fbcfe8] rounded-t-xl relative overflow-hidden shadow-inner z-20 border-t-8 border-purple-400 -mt-2">
          <div className="absolute top-0 w-full h-8 bg-purple-400 rounded-b-xl flex justify-around px-4">
              {[...Array(7)].map((_, i) => <div key={`drip2-${i}`} className="w-5 h-6 bg-purple-400 rounded-b-full shadow-sm" style={{ height: `${20 + Math.random() * 25}px` }} />)}
          </div>
          <div className="absolute bottom-5 w-full flex justify-center gap-3">
             {[...Array(9)].map((_, i) => <div key={`star-${i}`} className="w-4 h-4 bg-yellow-300 rounded-full shadow-sm" />)}
          </div>
        </div>
        
        {/* Bottom Tier */}
        <div className="w-[400px] h-32 bg-gradient-to-b from-[#e0e7ff] to-[#c7d2fe] rounded-t-xl relative overflow-hidden shadow-inner z-10 border-t-8 border-blue-400 -mt-2">
           <div className="absolute top-0 w-full h-8 bg-blue-400 rounded-b-xl flex justify-around px-4">
              {[...Array(10)].map((_, i) => <div key={`drip3-${i}`} className="w-5 h-6 bg-blue-400 rounded-b-full shadow-sm" style={{ height: `${20 + Math.random() * 25}px` }} />)}
          </div>
          <div className="absolute bottom-6 w-full text-center text-blue-600 font-display tracking-[0.4em] text-xl font-bold">LADA IS 17</div>
        </div>
      </div>
      
      {/* Plate */}
      <div className="w-[480px] h-10 bg-gradient-to-b from-gray-200 to-gray-400 rounded-[50%] shadow-[0_25px_50px_rgba(0,0,0,0.3)] z-0 -mt-5 border-b-4 border-gray-400" />
    </motion.div>
  );
}
