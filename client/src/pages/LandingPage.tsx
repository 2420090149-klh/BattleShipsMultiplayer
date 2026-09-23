import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';
import { ShipGraphic } from '../components/ShipGraphic';
import { Crosshair, RadioTower } from 'lucide-react';

export default function LandingPage() {
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();
  const { setCurrentPlayerId } = useGameStore();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const handleCreate = () => {
    if (!nickname) return;
    setCurrentPlayerId(socket.id!);
    socket.emit('room:create', {
      nickname,
      avatar: 'default',
      color: '#00f3ff',
      maxPlayers: 6
    });
    setTimeout(() => {
        const store = useGameStore.getState();
        if (store.room) {
            navigate(`/room/${store.room.roomId}`);
        }
    }, 500);
  };

  const handleJoin = () => {
    if (!nickname || !joinCode) return;
    setCurrentPlayerId(socket.id!);
    socket.emit('room:join', {
      roomId: joinCode,
      nickname,
      avatar: 'default',
      color: '#ff0055'
    });
    setTimeout(() => {
        const store = useGameStore.getState();
        if (store.room) {
            navigate(`/room/${store.room.roomId}`);
        }
    }, 500);
  };

  // Entrance animations
  const menuVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 1.2, staggerChildren: 0.15, delayChildren: 0.5 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#020508] text-slate-300 flex flex-col justify-center overflow-hidden relative font-sans select-none">
      
      {/* LAYER 1: Deep Ocean Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom,_#081b2e_0%,_#020508_100%)]"></div>

      {/* LAYER 2: Subtle Tactical Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(20,50,100,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(20,50,100,0.1)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
      </div>

      {/* LAYER 3: Distant Radar and Fog */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Subtle Radar far off in the top right corner */}
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] border border-cyan-900/10 rounded-full opacity-30"></div>
          <div className="absolute top-16 right-16 w-[200px] h-[200px] border border-cyan-900/20 rounded-full opacity-20">
              {!reducedMotion && (
                  <motion.div 
                      className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg_at_center,_transparent_0deg,_rgba(0,150,255,0.05)_90deg)]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  />
              )}
          </div>
          
          {/* Drifting Fog */}
          {!reducedMotion && (
            <motion.div 
              className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAnIGhlaWdodD0nMTAwJz48ZmlsdGVyIGlkPSdmJz48ZmVUdXJidWxlbmNlIHR5cGU9J2ZyYWN0YWxOb2lzZScgYmFzZUZyZXF1ZW5jeT0nMC4wMScgbnVtT2N0YXZlcz0nMycgc3RpdGNoVGlsZXM9J3N0aXRjaCcvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPScxMDAnIGhlaWdodD0nMTAwJyBmaWx0ZXI9J3VybCgjZiknIG9wYWNpdHk9JzAuMTUnLz48L3N2Zz4=')] opacity-20 mix-blend-overlay scale-150"
              animate={{ x: [0, -100] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
          )}
      </div>

      {/* LAYER 4: Ambient Ships Cruising (Decorative) */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden opacity-40 grayscale-[50%]">
          {!reducedMotion && (
             <>
                {/* Massive Carrier far back */}
                <motion.div 
                  className="absolute top-[20%] w-64 h-32"
                  initial={{ x: '110vw' }}
                  animate={{ x: '-20vw' }}
                  transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                >
                    <div className="scale-75 origin-center blur-[2px] opacity-30"><ShipGraphic type="carrier" isVertical={false} /></div>
                </motion.div>

                {/* Battleship moving across middle distance */}
                <motion.div 
                  className="absolute top-[50%] w-48 h-24"
                  initial={{ x: '-20vw' }}
                  animate={{ x: '110vw' }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                >
                    <motion.div 
                       animate={{ y: [-2, 2, -2] }} 
                       transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                       className="scale-100 opacity-60"
                    >
                        <ShipGraphic type="battleship" isVertical={false} />
                    </motion.div>
                </motion.div>

                {/* Submarine surfacing occasionally in foreground */}
                <motion.div 
                  className="absolute bottom-[20%] w-32 h-16"
                  initial={{ x: '110vw' }}
                  animate={{ x: '-20vw' }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear", delay: 10 }}
                >
                    <motion.div 
                       animate={{ opacity: [0.1, 0.4, 0.1], y: [10, 0, 10] }} 
                       transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                       className="scale-125 mix-blend-overlay"
                    >
                        <ShipGraphic type="submarine" isVertical={false} />
                    </motion.div>
                </motion.div>
             </>
          )}
      </div>

      {/* LAYER 5: The Game Menu / HUD */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-8 py-12 flex flex-col items-start justify-center h-full">
          
          <motion.div 
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-3xl"
          >
              {/* STATUS HUD */}
              <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(0,200,255,0.8)]"></div>
                      <span className="text-[10px] font-bold text-cyan-500 tracking-[0.3em]">SYSTEM ONLINE</span>
                  </div>
                  <div className="h-3 w-px bg-slate-700"></div>
                  <span className="text-[10px] font-mono text-slate-500 tracking-widest">SECTOR 07 • SECURE</span>
              </motion.div>

              {/* TITLE */}
              <motion.div variants={itemVariants} className="mb-12">
                  <h1 className="text-6xl md:text-8xl font-black tracking-widest text-slate-100 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                      BATTLESHIPS
                  </h1>
                  <h2 className="text-sm md:text-xl font-bold tracking-[0.5em] text-slate-400 mt-2 ml-1">
                      MULTIPLAYER NAVAL WARFARE
                  </h2>
              </motion.div>

              {/* INTERACTIVE MENU */}
              <div className="flex flex-col gap-10">
                  
                  {/* CALLSIGN */}
                  <motion.div variants={itemVariants} className="group max-w-md">
                      <label className="block text-[11px] font-bold mb-2 text-slate-400 uppercase tracking-[0.2em] group-focus-within:text-cyan-400 transition-colors">
                          Commander Callsign
                      </label>
                      <input 
                          type="text" 
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          className="w-full bg-transparent border-b-2 border-slate-700 p-2 text-3xl font-bold uppercase tracking-widest text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-800"
                          placeholder="ENTER NAME"
                          maxLength={12}
                      />
                  </motion.div>

                  {/* ACTIONS */}
                  <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-6 mt-4">
                      
                      {/* CREATE GAME */}
                      <button 
                          onClick={handleCreate}
                          disabled={!nickname}
                          className="relative flex-1 group bg-[#091a2a]/60 hover:bg-[#0c243b] border border-cyan-900/50 hover:border-cyan-400/80 p-6 transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none text-left overflow-hidden"
                      >
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                          
                          <div className="flex items-center gap-4 relative z-10">
                              <div className="bg-cyan-900/30 p-3 rounded group-hover:bg-cyan-500/20 transition-colors">
                                  <Crosshair size={24} className="text-cyan-500" />
                              </div>
                              <div>
                                  <h3 className="text-xl font-bold text-slate-200 tracking-[0.15em] mb-1 group-hover:text-white">CREATE GAME</h3>
                                  <p className="text-[10px] text-slate-400 tracking-widest uppercase">Start a new multiplayer battle</p>
                              </div>
                          </div>
                      </button>

                      {/* JOIN GAME */}
                      <div className="flex-1 flex flex-col justify-center bg-[#050B12]/60 border border-slate-800/50 p-6">
                          <div className="flex items-center gap-3 mb-4">
                              <RadioTower size={16} className="text-slate-500" />
                              <h3 className="text-sm font-bold text-slate-300 tracking-[0.15em]">JOIN GAME</h3>
                          </div>
                          <div className="flex gap-2 h-12">
                              <input 
                                  type="text" 
                                  value={joinCode}
                                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                  className="w-full bg-[#03060a] border border-slate-800 p-2 text-center font-mono text-lg tracking-[0.3em] uppercase text-slate-300 focus:outline-none focus:border-slate-500 transition-colors placeholder:text-slate-800"
                                  placeholder="CODE"
                                  maxLength={6}
                              />
                              <button 
                                  onClick={handleJoin}
                                  disabled={!nickname || joinCode.length < 6}
                                  className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold tracking-widest transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              >
                                  JOIN
                              </button>
                          </div>
                      </div>

                  </motion.div>
              </div>

          </motion.div>
      </div>
    </div>
  );
}
