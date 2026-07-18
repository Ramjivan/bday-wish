import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PALETTE = [
  { id: '1', color: '#000000', name: 'Black' },
  { id: '2', color: '#FFFFFF', name: 'White' },
  { id: '3', color: '#EF4444', name: 'Red' }, 
  { id: '4', color: '#22C55E', name: 'Green' }, 
  { id: '5', color: '#3B82F6', name: 'Blue' }, 
  { id: '6', color: '#EAB308', name: 'Yellow' }, 
  { id: '7', color: '#EC4899', name: 'Pink' }, 
  { id: '8', color: '#06B6D4', name: 'Cyan' }, 
  { id: '9', color: '#F97316', name: 'Orange' }, 
  { id: 'A', color: '#A855F7', name: 'Purple' }, 
  { id: 'B', color: '#78350F', name: 'Dark Brown' }, 
  { id: 'C', color: '#FCD34D', name: 'Light Yellow' }, 
  { id: 'D', color: '#FFEDD5', name: 'Peach (Skin)' }, 
  { id: 'E', color: '#FDBA74', name: 'Tan (Skin)' }, 
  { id: 'F', color: '#B45309', name: 'Brown (Skin)' }, 
  { id: 'G', color: '#9CA3AF', name: 'Gray' } 
];

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

export default function DiamondGame({ onBack }) {
  const [grid, setGrid] = useState([]);
  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);
  const [selectedColor, setSelectedColor] = useState(PALETTE[0].id);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const STORAGE_KEY = 'lada_diamond_painting_v3';

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const img = new Image();
    img.src = './lada_mom.jpg';
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d', { willReadFrequently: true });
      
      const aspect = img.height / img.width;
      const cCols = 45; // Increased resolution!
      const cRows = Math.floor(cCols * aspect);
      setCols(cCols);
      setRows(cRows);
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.length === cCols * cRows) {
            setGrid(parsed);
            return;
          }
        } catch (e) {
          console.error("Local storage corrupted");
        }
      }

      c.width = cCols;
      c.height = cRows;
      ctx.drawImage(img, 0, 0, cCols, cRows);
      
      const imgData = ctx.getImageData(0, 0, cCols, cRows).data;
      const newGrid = [];
      
      for (let y = 0; y < cRows; y++) {
        for (let x = 0; x < cCols; x++) {
          const i = (y * cCols + x) * 4;
          const r = imgData[i];
          const g = imgData[i+1];
          const b = imgData[i+2];
          
          let minDistance = Infinity;
          let closestId = PALETTE[0].id;
          
          for (const p of PALETTE) {
            const pRgb = hexToRgb(p.color);
            const dist = Math.sqrt(Math.pow(r-pRgb[0], 2) + Math.pow(g-pRgb[1], 2) + Math.pow(b-pRgb[2], 2));
            if (dist < minDistance) {
              minDistance = dist;
              closestId = p.id;
            }
          }
          
          newGrid.push({ x, y, colorId: closestId, painted: false });
        }
      }
      setGrid(newGrid);
    };
  }, []);

  useEffect(() => {
    if (grid.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(grid));
      if (grid.every(c => c.painted)) {
        setIsFinished(true);
      }
    }
  }, [grid]);

  const playTink = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Randomize pitch slightly for a sparkling effect when swiping
      osc.frequency.setValueAtTime(1200 + Math.random() * 500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch(e) {}
  };

  const paintCell = (idx) => {
    if (isFinished) return;
    setGrid(prev => {
      const newGrid = [...prev];
      if (!newGrid[idx].painted && newGrid[idx].colorId === selectedColor) {
        newGrid[idx].painted = true;
        playTink(); // Play sparkling ASMR sound!
      }
      return newGrid;
    });
  };

  const handleMouseEnter = (idx) => {
    if (isMouseDown) paintCell(idx);
  };

  const quickFill = () => {
    setGrid(prev => prev.map(cell => ({ ...cell, painted: true })));
  };

  const resetPainting = () => {
    if (window.confirm("Are you sure you want to erase your painting?")) {
      setGrid(prev => prev.map(cell => ({ ...cell, painted: false })));
      setIsFinished(false);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Mobile Touch Support for Drag-to-Paint
  const handleTouchStart = (e) => {
    setIsMouseDown(true);
    if (e.touches.length === 1 && !isFinished) {
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el && el.hasAttribute('data-idx')) {
        paintCell(parseInt(el.getAttribute('data-idx'), 10));
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && !isFinished) {
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el && el.hasAttribute('data-idx')) {
        paintCell(parseInt(el.getAttribute('data-idx'), 10));
      }
    }
  };

  const downloadArtwork = () => {
    const link = document.createElement('a');
    link.download = 'lada_diamond_masterpiece.png';
    link.href = './diamond_masterpiece.png';
    link.click();
  };

  const getCursorSvg = (colorHex) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <!-- Gem at top -->
      <path d="M26 2L30 6L26 10L22 6Z" fill="${colorHex}" stroke="#000" stroke-width="1"/>
      <!-- Pen body -->
      <path d="M24 8L8 24L5 21L21 5Z" fill="#ff1493" stroke="#000" stroke-width="1"/>
      <!-- Metal Tip -->
      <path d="M8 24L3 29L1 31L3 31L5 29L8 24Z" fill="#ccc" stroke="#000" stroke-width="1"/>
      <!-- Diamond being held -->
      <circle cx="2" cy="30" r="2" fill="${colorHex}"/>
    </svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") 2 30, crosshair`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-zinc-900 overflow-hidden flex flex-col font-sans"
    >
      <div className="flex-none p-3 md:p-6 flex flex-wrap justify-between items-center bg-zinc-800 shadow-md gap-3">
        <button 
          onClick={onBack}
          className="px-3 md:px-4 py-2 text-sm md:text-base bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition order-1"
        >
          &larr; Back
        </button>
        <h1 className="text-lg md:text-2xl font-bold text-white text-center order-3 w-full md:w-auto md:order-2 md:absolute md:left-1/2 md:-translate-x-1/2">
          Diamond Painting 💎
        </h1>
        <div className="flex gap-2 order-2 md:order-3">
          {isFinished && (
            <button 
              onClick={downloadArtwork}
              className="px-3 md:px-4 py-2 text-sm md:text-base bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition shadow-[0_0_15px_rgba(37,99,235,0.5)]"
            >
              Save
            </button>
          )}
          
          <button 
            onClick={resetPainting}
            className="px-3 md:px-4 py-2 text-sm md:text-base bg-zinc-600 hover:bg-red-500 text-white font-bold rounded-lg transition"
          >
            Reset
          </button>

          {!isFinished && (
            <button 
              onClick={quickFill}
              className="px-3 md:px-4 py-2 text-sm md:text-base bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg transition"
            >
              Fill &starf;
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto flex items-center justify-center p-2 md:p-4 relative">
        {grid.length > 0 ? (
          <div className="relative w-full max-w-[700px] shadow-2xl">
            
            {/* Hidden High-Res Image Underneath (The Masterpiece!) */}
            <img 
              src="./diamond_masterpiece.png"
              className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none rounded-md"
              alt="Hidden Masterpiece"
            />
            
            {/* The Grid Overlay */}
            <div 
              className={`relative z-10 grid touch-none select-none w-full transition-all duration-1000 bg-transparent rounded-md overflow-hidden ${isFinished ? 'border-0' : 'border border-zinc-800'}`}
              style={{ 
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                cursor: !isFinished ? getCursorSvg(PALETTE.find(p => p.id === selectedColor)?.color || '#fff') : 'default'
              }}
              onMouseLeave={() => setIsMouseDown(false)}
              onMouseUp={() => setIsMouseDown(false)}
              onMouseDown={() => setIsMouseDown(true)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => setIsMouseDown(false)}
              onTouchCancel={() => setIsMouseDown(false)}
            >
              {grid.map((cell, idx) => {
                 const isHighlight = selectedColor === cell.colorId && !cell.painted;
                 return (
                   <div 
                     key={idx} 
                     data-idx={idx}
                     className={`relative w-full aspect-square flex items-center justify-center font-bold select-none cursor-pointer overflow-hidden transition-all duration-500
                        ${cell.painted ? 'bg-transparent' : 'bg-zinc-100 outline outline-1 outline-zinc-800/20 -outline-offset-1'} 
                        ${isHighlight && !cell.painted ? 'bg-pink-200' : ''}
                     `}
                     onMouseEnter={() => handleMouseEnter(idx)}
                     onMouseDown={() => paintCell(idx)}
                   >
                      {/* Show color ID numbers only if unpainted */}
                      {!cell.painted && !isFinished && (
                        <span className={`pointer-events-none text-[8px] md:text-[10px] ${isHighlight ? 'text-pink-600 animate-pulse font-extrabold' : 'text-zinc-500/70'}`}>
                          {cell.colorId}
                        </span>
                      )}
                   </div>
                 );
              })}
            </div>

            {/* Russian Mother/Daughter Quote */}
            <AnimatePresence>
              {isFinished && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                  animate={{ opacity: 1, scale: 1, rotate: -6 }}
                  transition={{ duration: 1.5, delay: 2.5 }}
                  className="absolute -bottom-8 -right-4 md:-right-16 z-30 bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-2 border-pink-300 pointer-events-none"
                >
                  <p className="text-pink-600 font-hand text-2xl md:text-4xl font-bold whitespace-nowrap drop-shadow-sm">
                    Лучший дуэт мамы и дочки! 💖
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        ) : (
          <div className="text-white text-xl animate-pulse">Loading canvas...</div>
        )}
      </div>

      <div className="flex-none p-4 bg-zinc-800 border-t border-zinc-700 overflow-x-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] min-h-[100px] flex items-center justify-center">
        {isFinished ? (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-center"
           >
             <h2 className="text-3xl font-bold text-pink-500 mb-2">Masterpiece! 🎨</h2>
             <p className="text-zinc-400">You revealed the beautiful photo!</p>
           </motion.div>
        ) : (
          <div className="flex justify-center items-center gap-2 md:gap-4 min-w-max mx-auto px-4">
            {PALETTE.map(p => {
               const isSelected = selectedColor === p.id;
               const remaining = grid.filter(c => c.colorId === p.id && !c.painted).length;
               const isDone = remaining === 0 && grid.length > 0;

               if (isDone) return null; 

               return (
                 <button
                   key={p.id}
                   onClick={() => setSelectedColor(p.id)}
                   className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${isSelected ? 'bg-zinc-600 scale-110 shadow-lg' : 'hover:bg-zinc-700'}`}
                 >
                   <div 
                     className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/20"
                     style={{ 
                       backgroundColor: p.color,
                       boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.7)' 
                     }}
                   />
                   <span className="text-white font-bold text-sm bg-black/50 px-2 rounded">{p.id}</span>
                 </button>
               );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
