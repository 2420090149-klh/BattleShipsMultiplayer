import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ShipGraphic } from './ShipGraphic';

interface CinematicIntroProps {
  onComplete: () => void;
}

type Stage = 'UNDERWATER' | 'SURFACE' | 'SHIP_REVEAL' | 'SHOWCASE' | 'FLEET_REVEAL' | 'FORMATION' | 'BATTLE_START' | 'BATTLE_PEAK' | 'ZOOM_OUT' | 'TITLE';

const TIMELINE = {
  UNDERWATER: 3000,
  SURFACE: 2000,
  SHIP_REVEAL: 2500,
  SHOWCASE: 3000,
  FLEET_REVEAL: 2500,
  FORMATION: 2000,
  BATTLE_START: 2000,
  BATTLE_PEAK: 3000,
  ZOOM_OUT: 3000,
  TITLE: 4000
};

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<Stage>('UNDERWATER');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Timeline execution
  useEffect(() => {
    let mounted = true;
    
    const runTimeline = async () => {
      const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
      
      const stages: Stage[] = ['SURFACE', 'SHIP_REVEAL', 'SHOWCASE', 'FLEET_REVEAL', 'FORMATION', 'BATTLE_START', 'BATTLE_PEAK', 'ZOOM_OUT', 'TITLE'];
      
      await wait(TIMELINE.UNDERWATER);
      for (const nextStage of stages) {
          if (!mounted) return;
          setStage(nextStage);
          await wait(TIMELINE[nextStage as keyof typeof TIMELINE]);
      }
      
      if (!mounted) return;
      onComplete();
    };
    
    runTimeline();
    return () => { mounted = false; };
  }, [onComplete]);

  // Particle Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let particles: any[] = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    
    const emit = (x: number, y: number, color: string, speed: number, size: number, type: 'bubble'|'spark'|'smoke'|'aircraft'|'torpedo', angle?: number) => {
        particles.push({
            x, y, 
            vx: type === 'aircraft' || type === 'torpedo' ? Math.cos(angle!) * speed : (Math.random() - 0.5) * speed, 
            vy: type === 'aircraft' || type === 'torpedo' ? Math.sin(angle!) * speed : (Math.random() - 0.5) * speed - (type==='bubble'?speed/2:0),
            size: type === 'aircraft' ? size : Math.random() * size + 1,
            color,
            life: 1.0,
            decay: type === 'aircraft' || type === 'torpedo' ? 0.005 : Math.random() * 0.02 + 0.01,
            type,
            angle
        });
    };

    let frameCount = 0;
    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frameCount++;
        
        // Background particles based on stage
        if (stage === 'UNDERWATER' || stage === 'SURFACE') {
            if (frameCount % 3 === 0) emit(Math.random() * canvas.width, canvas.height + 20, 'rgba(255,255,255,0.2)', 2, 4, 'bubble');
        }
        
        if (stage === 'BATTLE_START' || stage === 'BATTLE_PEAK') {
            // Simulated randomized combat particles across the fleet area
            if (Math.random() < (stage === 'BATTLE_PEAK' ? 0.15 : 0.05)) {
                // Focus explosions roughly where the ships are
                const side = Math.random() > 0.5 ? 0.2 : 0.8;
                const ex = canvas.width * side + (Math.random() - 0.5) * canvas.width * 0.2;
                const ey = Math.random() * canvas.height * 0.6 + canvas.height * 0.2;
                
                // Missile trails
                if (Math.random() < 0.3) {
                    for(let i=0; i<10; i++) emit(ex + (Math.random()-0.5)*100, ey - 200 + i*20, 'rgba(255,200,100,0.8)', 2, 2, 'spark');
                }
                
                // Muzzle flash / explosion
                for(let i=0; i<30; i++) emit(ex, ey, 'rgba(255,100,0,0.8)', 15, 3, 'spark');
                
                // Water plume
                for(let i=0; i<20; i++) emit(ex, ey, 'rgba(200,220,255,0.6)', 8, 5, 'bubble');
                
                // Smoke
                for(let i=0; i<15; i++) emit(ex, ey, 'rgba(50,50,50,0.6)', 5, 10, 'smoke');
            }

            // Aircraft and Torpedoes
            if (stage === 'BATTLE_PEAK' && Math.random() < 0.02) {
                // Aircraft from left to right or right to left
                const isLeft = Math.random() > 0.5;
                const ax = isLeft ? 0 : canvas.width;
                const ay = Math.random() * canvas.height * 0.5 + canvas.height * 0.2;
                const angle = isLeft ? 0 : Math.PI;
                emit(ax, ay, 'rgba(200,200,200,1)', 15, 4, 'aircraft', angle);
            }
            if (stage === 'BATTLE_PEAK' && Math.random() < 0.01) {
                // Torpedo (underwater fast bubble trail)
                const isLeft = Math.random() > 0.5;
                const tx = isLeft ? canvas.width * 0.2 : canvas.width * 0.8;
                const ty = Math.random() * canvas.height * 0.5 + canvas.height * 0.3;
                const angle = isLeft ? 0 : Math.PI;
                emit(tx, ty, 'rgba(100,255,255,0.8)', 8, 2, 'torpedo', angle);
            }
        }

        particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            
            if (p.type === 'smoke') {
                p.size += 0.1;
                p.x -= 1; // Wind
            } else if (p.type === 'aircraft') {
                // Drop bombs/smoke trails
                if (Math.random() < 0.2) emit(p.x, p.y, 'rgba(255,255,255,0.3)', 1, 2, 'smoke');
            } else if (p.type === 'torpedo') {
                // Bubble trail
                if (Math.random() < 0.5) emit(p.x, p.y, 'rgba(200,255,255,0.5)', 0.5, 2, 'bubble');
            }
            
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
        
        particles = particles.filter(p => p.life > 0);
        animationId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationId);
    };
  }, [stage]);

  // Framer Motion Variants for 3D Camera/World Transform
  const worldVariants = {
    UNDERWATER: { scale: 3, y: '20vh', rotateX: 0, opacity: 1, z: '-300px' },
    SURFACE: { scale: 1.5, y: '0vh', rotateX: 20, opacity: 1, z: '0px' },
    SHIP_REVEAL: { scale: 1.5, y: '10vh', rotateX: 70, opacity: 1, z: '200px' },
    SHOWCASE: { scale: 1.2, y: '0vh', rotateX: 45, opacity: 1, z: '0px' },
    FLEET_REVEAL: { scale: 0.8, y: '10vh', rotateX: 55, opacity: 1, z: '0px' },
    FORMATION: { scale: 0.8, y: '10vh', rotateX: 55, opacity: 1, z: '0px' },
    BATTLE_START: { scale: 0.9, y: '5vh', rotateX: 50, opacity: 1, z: '100px' },
    BATTLE_PEAK: { scale: 1.0, y: '0vh', rotateX: 45, opacity: 1, z: '200px' },
    ZOOM_OUT: { scale: 0.02, y: '-50vh', rotateX: 75, opacity: 0, z: '-1500px' },
    TITLE: { scale: 0.02, y: '-50vh', rotateX: 75, opacity: 0, z: '-1500px' }
  };

  const showTitle = stage === 'TITLE';

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-black text-white font-sans select-none" ref={containerRef}>
      
      {/* Dynamic Background Layer */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-b from-[#001529] to-[#000a14]"
        initial={{ opacity: 1 }}
        animate={{ opacity: stage === 'ZOOM_OUT' || showTitle ? 0 : 1 }}
        transition={{ duration: 3 }}
      />
      
      {/* Sun Rays breaching surface */}
      <motion.div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent opacity-0 mix-blend-screen"
        animate={{ opacity: stage === 'SURFACE' || stage === 'SHOWCASE' ? 1 : 0 }}
        transition={{ duration: 2 }}
      />
      
      {/* 2.5D World Container */}
      <div className="absolute inset-0 flex items-center justify-center [perspective:1400px]">
         <motion.div 
           className="w-[120vw] h-[120vh] relative transform-style-preserve-3d"
           variants={worldVariants as any}
           initial="UNDERWATER"
           animate={stage}
           transition={{ duration: 3, ease: "easeInOut" }}
         >
            {/* The Ocean Floor / Surface Plane */}
            <div className="absolute inset-0 bg-blue-900/10 border border-blue-500/10 shadow-[0_0_150px_rgba(0,100,255,0.15)] rounded-full blur-[2px]" style={{ transform: 'translateZ(-100px) scale(1.5)' }} />
            
            {(stage !== 'UNDERWATER' && stage !== 'SURFACE') && (
                <>
                    {/* TEAM RED */}
                    <div className={`absolute w-32 h-16 transition-all duration-1000 transform -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] 
                        ${stage === 'SHIP_REVEAL' ? 'top-[50%] left-[50%] scale-[3]' : stage === 'SHOWCASE' ? 'top-[40%] left-[30%] scale-150' : stage === 'FORMATION' ? 'top-[25%] left-[25%]' : 'top-[30%] left-[20%]'}`}>
                        <ShipGraphic type="carrier" isVertical={false} size={5} />
                    </div>
                    <div className={`absolute w-24 h-12 transition-all duration-1000 transform -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]
                        ${stage === 'SHIP_REVEAL' ? 'opacity-0' : stage === 'SHOWCASE' ? 'top-[60%] left-[70%] scale-150' : stage === 'FORMATION' ? 'top-[55%] left-[35%]' : 'top-[50%] left-[30%]'}`}>
                        <ShipGraphic type="battleship" isVertical={false} size={4} />
                    </div>
                    <div className={`absolute w-16 h-10 transition-all duration-1000 transform -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]
                        ${stage === 'SHIP_REVEAL' ? 'opacity-0' : stage === 'SHOWCASE' ? 'top-[30%] left-[60%] scale-150' : stage === 'FORMATION' ? 'top-[65%] left-[15%]' : 'top-[70%] left-[20%]'}`}>
                        <ShipGraphic type="cruiser" isVertical={false} size={3} />
                    </div>
                    <div className={`absolute w-16 h-8 transition-all duration-1000 transform -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]
                        ${stage === 'SHIP_REVEAL' ? 'opacity-0' : stage === 'SHOWCASE' ? 'top-[70%] left-[30%] scale-150' : stage === 'FORMATION' ? 'top-[35%] left-[45%]' : 'top-[40%] left-[40%]'}`}>
                        <ShipGraphic type="destroyer" isVertical={false} size={3} />
                    </div>
                    <div className={`absolute w-12 h-6 transition-all duration-1000 transform -translate-x-1/2 -translate-y-1/2 opacity-60
                        ${stage === 'SHIP_REVEAL' ? 'opacity-0' : stage === 'SHOWCASE' ? 'top-[50%] left-[50%] scale-150' : stage === 'FORMATION' ? 'top-[70%] left-[40%]' : 'top-[60%] left-[10%]'}`}>
                        <ShipGraphic type="submarine" isVertical={false} size={2} />
                    </div>

                    {/* TEAM BLUE (Hidden until FLEET_REVEAL) */}
                    <div className={`transition-all duration-1000 ${(stage === 'SHIP_REVEAL' || stage === 'SHOWCASE') ? 'opacity-0' : 'opacity-100'}`}>
                        <div className={`absolute w-32 h-16 transition-all duration-1000 transform translate-x-1/2 -translate-y-1/2 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] rotate-180
                            ${stage === 'FORMATION' ? 'top-[25%] right-[25%]' : 'top-[30%] right-[20%]'}`}><ShipGraphic type="carrier" isVertical={false} size={5} /></div>
                        <div className={`absolute w-24 h-12 transition-all duration-1000 transform translate-x-1/2 -translate-y-1/2 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] rotate-180
                            ${stage === 'FORMATION' ? 'top-[55%] right-[35%]' : 'top-[50%] right-[30%]'}`}><ShipGraphic type="battleship" isVertical={false} size={4} /></div>
                        <div className={`absolute w-16 h-10 transition-all duration-1000 transform translate-x-1/2 -translate-y-1/2 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] rotate-180
                            ${stage === 'FORMATION' ? 'top-[65%] right-[15%]' : 'top-[70%] right-[20%]'}`}><ShipGraphic type="cruiser" isVertical={false} size={3} /></div>
                        <div className={`absolute w-16 h-8 transition-all duration-1000 transform translate-x-1/2 -translate-y-1/2 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] rotate-180
                            ${stage === 'FORMATION' ? 'top-[35%] right-[45%]' : 'top-[40%] right-[40%]'}`}><ShipGraphic type="destroyer" isVertical={false} size={3} /></div>
                        <div className={`absolute w-12 h-6 transition-all duration-1000 transform translate-x-1/2 -translate-y-1/2 opacity-60 rotate-180
                            ${stage === 'FORMATION' ? 'top-[70%] right-[40%]' : 'top-[60%] right-[10%]'}`}><ShipGraphic type="submarine" isVertical={false} size={2} /></div>
                    </div>
                </>
            )}
         </motion.div>
      </div>

      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Camera Shake Overlay (CSS only) */}
      <motion.div 
         className="absolute inset-0 pointer-events-none z-30 mix-blend-overlay bg-orange-500/0"
         animate={stage === 'BATTLE_PEAK' ? { backgroundColor: ['rgba(255,100,0,0)', 'rgba(255,100,0,0.1)', 'rgba(255,100,0,0)'] } : {}}
         transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
      />

      {/* Title Reveal */}
      <motion.div 
         className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black pointer-events-none"
         initial={{ opacity: 0 }}
         animate={{ opacity: showTitle ? 1 : 0 }}
         transition={{ duration: 1 }}
      >
         {showTitle && (
            <motion.div
               initial={{ scale: 1.1, filter: 'blur(10px)', opacity: 0 }}
               animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
               transition={{ duration: 2, ease: "easeOut" }}
               className="text-center relative"
            >
               <h1 className="text-6xl md:text-8xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-gray-500 via-white to-gray-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  BATTLESHIPS
               </h1>
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 1, duration: 1 }}
               >
                 <h2 className="text-xl md:text-3xl font-bold tracking-[0.5em] text-cyan-500 mt-4">
                    MULTIPLAYER
                 </h2>
               </motion.div>
               {/* Light sweep */}
               <motion.div
                 className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 mix-blend-overlay w-[200%] h-full top-0 left-[-100%]"
                 animate={{ x: ['0%', '100%'] }}
                 transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
               />
            </motion.div>
         )}
      </motion.div>

      {/* Skip Button */}
      <motion.button 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 3 }}
         onClick={onComplete}
         className="absolute bottom-8 right-8 z-50 text-white/50 hover:text-white text-sm tracking-widest font-bold flex items-center gap-2 px-4 py-2 border border-white/10 rounded hover:bg-white/10 transition-all cursor-pointer pointer-events-auto"
      >
         SKIP INTRO <span>→</span>
      </motion.button>
    </div>
  );
};
