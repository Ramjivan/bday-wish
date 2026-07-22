import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { translations } from '../translations';

export default function Message({ lang, onFinish }) {
  const [activeParaIndex, setActiveParaIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);
  
  const t = translations[lang];

  const paragraphs = [
    { text: t.msg_1, style: "text-3xl md:text-5xl mb-6 font-hand text-[#1a1240]" },
    { text: t.msg_2, style: "font-hand text-xl md:text-3xl leading-[30px] md:leading-[36px] text-[#1a1240]" },
    { text: t.msg_3, style: "font-hand text-xl md:text-3xl leading-[30px] md:leading-[36px] text-[#1a1240] mt-4" },
    { text: t.msg_4, style: "font-bold text-pink-600 block text-2xl md:text-4xl mt-4 font-hand leading-[30px] md:leading-[36px]" },
    { text: t.msg_5, style: "font-hand text-xl md:text-3xl leading-[30px] md:leading-[36px] text-[#1a1240] mt-4" },
    { text: t.msg_6, style: "font-hand text-xl md:text-3xl leading-[30px] md:leading-[36px] text-[#1a1240] mt-4" },
    { text: t.msg_7, style: "pt-6 md:pt-8 pb-4 text-right font-bold text-gray-700 font-hand text-xl md:text-3xl leading-[30px] md:leading-[36px]" },
  ];

  // Notify App.jsx when the letter completely finishes
  useEffect(() => {
    if (activeParaIndex === paragraphs.length && onFinish) {
      const timeout = setTimeout(onFinish, 2000); // 2 second delay after the last line flies
      return () => clearTimeout(timeout);
    }
  }, [activeParaIndex, paragraphs.length, onFinish]);

  useEffect(() => {
    if (activeParaIndex >= paragraphs.length) return;
    
    const currentText = paragraphs[activeParaIndex].text;
    
    if (visibleChars < currentText.length) {
      const timeout = setTimeout(() => {
        setVisibleChars(prev => prev + 1);
      }, 70); // 70ms per char for a slower, more deliberate writing pace
      return () => clearTimeout(timeout);
    } else {
      // Finished writing! Pause so she can finish reading the large text, then fly it to the page!
      const timeout = setTimeout(() => {
        setActiveParaIndex(prev => prev + 1);
        setVisibleChars(0);
      }, 1500); // 1.5 seconds delay before flying
      return () => clearTimeout(timeout);
    }
  }, [activeParaIndex, visibleChars, lang]);

  // Rebalanced paragraphs: 4 on the left, 3 on the right
  const leftParas = paragraphs.slice(0, 4);
  const rightParas = paragraphs.slice(4);

  const renderGridPara = (p, pIndex) => {
    // If the paragraph has completely finished writing and flown to the page
    if (pIndex < activeParaIndex) {
      return (
        <motion.div 
          key={pIndex}
          layoutId={`para-${pIndex}`}
          className={`${p.style} min-h-[30px] md:min-h-[36px] break-words origin-left`}
        >
          {p.text}
        </motion.div>
      );
    }
    
    // If it's currently writing in the center, or hasn't started yet, reserve the exact space invisibly!
    return (
      <div key={pIndex} className={`${p.style} min-h-[30px] md:min-h-[36px] opacity-0 break-words pointer-events-none`}>
        {p.text}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto">
      
      {/* 1. The Two-Column Notebook Layout */}
      <div className="w-full max-w-[95vw] md:max-w-6xl mx-auto md:px-12 h-full pt-4 md:pt-10 overflow-y-auto md:overflow-hidden pb-32 md:pb-0">
        <div className="flex flex-col md:flex-row w-full gap-0 md:gap-24 justify-center mobile-notebook">
          {/* Left Page (indices 0 to 3) */}
          <div className="w-full md:w-1/2 flex flex-col pt-0 md:pt-8 md:pl-8">
            {leftParas.map((p, i) => renderGridPara(p, i))}
          </div>
          
          {/* Right Page (indices 4 to 6) */}
          <div className="w-full md:w-1/2 flex flex-col pt-0 md:pt-8 md:pr-8">
            {rightParas.map((p, i) => renderGridPara(p, i + 4))}
          </div>
        </div>
      </div>

      {/* 2. The Center Stage for Active Typing */}
      <AnimatePresence>
        {activeParaIndex < paragraphs.length && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center px-4 md:px-8 bg-black/40 backdrop-blur-[2px] z-[100]"
          >
            <motion.div 
              layoutId={`para-${activeParaIndex}`}
              // w-full max-w-4xl and text-left locks the container size and text alignment.
              // This guarantees zero jittering or re-centering as the text is typed!
              className="w-full max-w-4xl text-left drop-shadow-2xl bg-black/30 p-8 md:p-12 rounded-3xl border border-white/20 origin-left"
            >
              <div className={`${paragraphs[activeParaIndex].style} !text-white !text-3xl md:!text-5xl !leading-[45px] md:!leading-[60px] !mt-0 !mb-0`}>
                {paragraphs[activeParaIndex].text.split('').map((char, idx) => (
                  <React.Fragment key={idx}>
                    <span className={idx < visibleChars ? "opacity-100" : "opacity-0"}>{char}</span>
                    {idx === visibleChars - 1 && (
                      <span className="relative inline-block w-0 h-full align-bottom">
                        <motion.img 
                          src="./peacock_pen.png" 
                          className="absolute bottom-1 left-0 w-48 md:w-64 h-auto origin-bottom-left pointer-events-none z-[100]"
                          animate={{ rotate: [-4, 6, -2, 7, -1] }}
                          transition={{ repeat: Infinity, duration: 0.12 }}
                          style={{ filter: 'contrast(1.15) brightness(0.95)' }}
                        />
                      </span>
                    )}
                  </React.Fragment>
                ))}
                
                {/* Pen start position before any chars are typed */}
                {visibleChars === 0 && (
                  <span className="relative inline-block w-0 h-full align-bottom">
                    <motion.img 
                      src="/peacock_pen.png" 
                      className="absolute bottom-1 left-0 w-48 md:w-64 h-auto origin-bottom-left pointer-events-none z-[100]"
                      animate={{ rotate: [-4, 6, -2, 7, -1] }}
                      transition={{ repeat: Infinity, duration: 0.12 }}
                      style={{ filter: 'contrast(1.15) brightness(0.95)' }}
                    />
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
