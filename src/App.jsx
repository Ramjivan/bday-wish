import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Message from './components/Message';
import DiamondGame from './components/DiamondGame';
import { playASMRClick } from './utils/audio';
import { translations } from './translations';

export default function App() {
  const [lang, setLang] = useState('en');
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLetterDone, setIsLetterDone] = useState(false);
  
  // Allow skipping straight to the game via URL: ?game=true
  const [isPlayingGame, setIsPlayingGame] = useState(() => {
    return new URLSearchParams(window.location.search).get('game') === 'true';
  });
  
  const videoRef = useRef(null);
  const audioRef = useRef(new Audio('./hbd.mp3'));
  
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('lang') === 'ru') {
      setLang('ru');
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'ru' : 'en';
    setLang(nextLang);
    const url = new URL(window.location);
    url.searchParams.set('lang', nextLang);
    window.history.pushState({}, '', url);
  };

  const t = translations[lang];

  // NOTE: Adjust these timestamps (in seconds) to match EXACTLY when the actions happen in your generated video!
  const pauseTimestamps = [
    5.0,   // Step 0 target: Video pauses here right before lighting candles (at the 5th second)
  ];

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    
    if (step < pauseTimestamps.length) {
      const targetTime = pauseTimestamps[step];
      // Use synchronous video state to prevent double-firing React state updates!
      if (currentTime >= targetTime && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
        setStep(step + 1); // Safely advance by exactly 1
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setStep(2); // Trigger the final Message component!
  };

  const startAction = () => {
    playASMRClick();
    
    if (step === 0) {
      audioRef.current.loop = true;
      audioRef.current.play().catch(e => console.log('Audio playback requires interaction.', e));
    }
    
    if (videoRef.current) {
      setIsPlaying(true);
      videoRef.current.play().catch(e => console.log(e));
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-black font-sans relative">
      
      {/* Background Video */}
      <video
        ref={videoRef}
        src="./bg_video.mp4"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        style={{ opacity: step === 0 && !isPlaying ? 0 : 1 }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
        playsInline
      />

      <div className="absolute inset-0 z-10 bg-black/20" />

      {/* Language Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={toggleLanguage}
          title={t.lang_tooltip}
          className="w-12 h-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center font-display text-lg tracking-wider hover:bg-white/20 transition-all text-white shadow-lg"
        >
          {lang.toUpperCase()}
        </button>
      </div>

      {/* 2D UI Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 pt-10">
        <AnimatePresence mode="wait">
          {step === 2 && !isPlaying && !isPlayingGame && (
             <Message key="message" lang={lang} onFinish={() => setIsLetterDone(true)} />
          )}
        </AnimatePresence>
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center z-50">
        <AnimatePresence mode="wait">
          {step === 0 && !isPlaying && <ControlButton key="btn0" onClick={startAction} text={t.btn_lights} />}
          {step === 1 && !isPlaying && <ControlButton key="btn1" onClick={startAction} text={t.btn_candles} />}
        </AnimatePresence>
      </div>

      {/* Game Trigger Button */}
      <AnimatePresence>
        {isLetterDone && !isPlayingGame && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[200] pointer-events-auto"
          >
            <button 
              onClick={() => {
                playASMRClick();
                setIsPlayingGame(true);
              }}
              className="px-8 py-4 bg-pink-500/90 hover:bg-pink-500 backdrop-blur-md text-white text-xl md:text-2xl font-bold rounded-2xl shadow-[0_0_20px_rgba(236,72,153,0.5)] transition hover:scale-105 active:scale-95 flex items-center gap-3 border-2 border-pink-400"
            >
              <span>A Special Gift For You</span>
              <span className="text-2xl">💎</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game UI */}
      <AnimatePresence>
         {isPlayingGame && (
           <DiamondGame onBack={() => setIsPlayingGame(false)} />
         )}
      </AnimatePresence>
    </div>
  );
}

const ControlButton = ({ onClick, text }) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20, position: 'absolute' }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="px-8 py-3 rounded-full font-display text-xl md:text-2xl tracking-wide shadow-2xl transition-colors pointer-events-auto border bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md"
  >
    {text}
  </motion.button>
);
