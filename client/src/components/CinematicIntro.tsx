import React, { useEffect, useState, useRef } from 'react';

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check reduced motion
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      onComplete();
    }
  }, [onComplete]);

  const handleComplete = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 500); // 500ms fade transition
  };

  const handleError = () => {
    console.error("Failed to load or play cinematic video. Skipping.");
    handleComplete();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-[#000a14] text-white flex items-center justify-center"
      style={{
         opacity: isFadingOut ? 0 : 1,
         transition: 'opacity 500ms ease-in-out',
         // Force hardware acceleration on the container
         transform: 'translateZ(0)'
      }}
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onEnded={handleComplete}
        onError={handleError}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none transform-gpu"
        style={{ backfaceVisibility: 'hidden' }}
      >
        <source src="/cinematic/battleships-intro.mp4" type="video/mp4" />
      </video>

      {/* Fallback Text if video loads slowly */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -z-10">
         <h1 className="text-4xl md:text-6xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-gray-500 via-white to-gray-500 opacity-50">
            BATTLESHIPS
         </h1>
      </div>

      {/* Skip Button */}
      <button 
         onClick={handleComplete}
         aria-label="Skip cinematic intro"
         className="absolute top-6 right-6 z-50 bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/60 text-xs md:text-sm tracking-widest font-bold px-4 py-2 border border-white/20 rounded-md transition-all cursor-pointer transform-gpu"
      >
         SKIP INTRO
      </button>
    </div>
  );
};
