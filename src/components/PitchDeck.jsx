import React from 'react';
import { motion } from 'framer-motion';
import { playASMRClick } from '../utils/audio';

const PitchDeck = ({ sceneIndex, nextScene }) => {
  // Allow clicks to pass through if we are in the game scene
  const isGameScene = sceneIndex === 3;

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center p-8 ${isGameScene ? 'pointer-events-none' : 'pointer-events-auto'}`}>
      
      {sceneIndex === 0 && (
        <motion.div
          key="s0"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 1 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-7xl font-display text-diamond-gold mb-6 tracking-wide drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
            Lada OS 17
          </h1>
          <p className="text-xl md:text-2xl font-body text-gray-300 italic mb-10">
            A brand new chapter of brilliance.
          </p>
          <button 
            onClick={() => { playASMRClick(); nextScene(); }}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full font-display text-lg tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            Initialize
          </button>
        </motion.div>
      )}

      {sceneIndex === 1 && (
        <motion.div
          key="s1"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl"
        >
          <h2 className="text-3xl font-display text-diamond-purple mb-6 uppercase tracking-widest text-center">Exhibit A: The Numbers</h2>
          <ul className="space-y-4 font-body text-lg">
            <motion.li initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 0.5 }}>📅 Age unlocked: 17 years.</motion.li>
            <motion.li initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 1.5 }}>⏰ Days alive: ~6,205.</motion.li>
            <motion.li initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 2.5 }}>💪 Bad days survived: 100%.</motion.li>
            <motion.li initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 3.5 }}>💎 Diamonds painted: genuinely uncountable.</motion.li>
          </ul>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 4.5 }} className="mt-8 text-center">
             <button onClick={() => { playASMRClick(); nextScene(); }} className="px-6 py-2 bg-diamond-purple/20 hover:bg-diamond-purple/40 border border-diamond-purple/50 rounded-full text-white font-bold transition-all">Continue</button>
          </motion.div>
        </motion.div>
      )}

      {sceneIndex === 2 && (
        <motion.div
          key="s2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl text-center"
        >
          <h2 className="text-3xl font-display text-diamond-pink mb-4 uppercase tracking-widest">Core Dependency: Mom</h2>
          <p className="text-gray-400 italic mb-8 font-body text-sm">(A crucial architectural element)</p>
          <div className="space-y-4 text-lg font-body leading-relaxed text-gray-200">
            <motion.p initial={{ opacity:0, y: 10 }} animate={{ opacity:1, y: 0 }} transition={{ delay: 0.5 }}>
              Not everyone gets a truly great one. You did.
            </motion.p>
            <motion.p initial={{ opacity:0, y: 10 }} animate={{ opacity:1, y: 0 }} transition={{ delay: 1.5 }}>
              The kind who shows up — every time, no questions. The kind who holds you when the world is too loud, and worries too much because she loves too much.
            </motion.p>
            <motion.p initial={{ opacity:0, y: 10 }} animate={{ opacity:1, y: 0 }} transition={{ delay: 2.5 }} className="text-diamond-pink font-semibold">
              Having her in your corner is one of your greatest strengths.
            </motion.p>
          </div>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 4.0 }} className="mt-8">
             <button onClick={() => { playASMRClick(); nextScene(); }} className="px-6 py-2 bg-diamond-pink/20 hover:bg-diamond-pink/40 border border-diamond-pink/50 rounded-full text-white font-bold transition-all">Next</button>
          </motion.div>
        </motion.div>
      )}

      {sceneIndex === 3 && (
        <motion.div
          key="s3"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-10 text-center pointer-events-none"
        >
          <h2 className="text-2xl font-display text-white mb-2 drop-shadow-lg">It's your turn.</h2>
          <p className="text-gray-200 font-body drop-shadow-md">Paint the heart. Select a color below and click the symbols on the canvas.</p>
        </motion.div>
      )}

      {sceneIndex === 4 && (
        <motion.div
          key="s4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1 }}
          className="w-full max-w-2xl bg-white notebook-texture p-10 md:p-14 rounded-md shadow-2xl border-l-[12px] border-[#e6ddd0] relative text-black"
        >
          <div className="absolute top-4 bottom-4 left-10 w-px bg-red-300 opacity-50"></div>
          <h2 className="font-hand text-4xl mb-6 pl-6 text-[#1a1240]">Hey Lada,</h2>
          <div className="font-hand text-2xl leading-loose pl-6 text-[#1a1240] space-y-4">
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 2.5 }}>You're 17 today.</motion.p>
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 3.5 }}>The world has had 17 years of you. Your laugh, your voice, your completely correct opinions. That is not nothing. That is actually everything.</motion.p>
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 6.0 }}>This year, I hope you do the thing that scares you. I hope someone makes you laugh until it hurts. And I hope you realize—just once—how extraordinary you genuinely are.</motion.p>
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 9.0 }}>You're going to be brilliant.</motion.p>
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 10.5 }} className="mt-8 text-right">— with love, always.</motion.p>
          </div>
        </motion.div>
      )}

    </div>
  );
};

export default PitchDeck;
