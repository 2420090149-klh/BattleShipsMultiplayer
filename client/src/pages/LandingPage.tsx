import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';
import { ShipGraphic } from '../components/ShipGraphic';
import { Crosshair, ShieldAlert, RadioTower, Anchor, Terminal } from 'lucide-react';

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
      color: '#00f3ff', // Internal game color logic kept intact
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
      color: '#ff0055' // Internal game color logic kept intact
    });
    setTimeout(() => {
        const store = useGameStore.getState();
        if (store.room) {
            navigate(`/room/${store.room.roomId}`);
        }
    }, 500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#000a14] text-slate-300 flex flex-col justify-between overflow-hidden relative font-sans select-none">
      
      {/* ATMOSPHERIC BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0">
          {/* Subtle naval grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,100,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,100,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_10%,_#000a14_100%)] opacity-90"></div>
          {/* Scanlines */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0JyBoZWlnaHQ9JzQnPjxyZWN0IHdpZHRoPSc0JyBoZWlnaHQ9JzEnIGZpbGw9J3JnYmEoMjU1LDI1NSwyNTUsMC4wNSknLz48L3N2Zz4=')] opacity-30 mix-blend-overlay"></div>
      </div>

      <motion.div 
        className="relative z-10 flex flex-col lg:flex-row flex-1 w-full max-w-7xl mx-auto px-6 py-12 gap-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* LEFT COLUMN: TITLE & RADAR */}
        <div className="flex-1 flex flex-col justify-center">
            <motion.div variants={itemVariants} className="mb-12">
                <div className="flex items-center gap-3 mb-2 text-cyan-700">
                    <Terminal size={16} />
                    <span className="text-xs font-bold tracking-[0.3em]">SYSTEM ONLINE</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-br from-slate-200 to-slate-600 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    BATTLESHIPS
                </h1>
                <h2 className="text-sm md:text-base font-bold tracking-[0.4em] text-cyan-600 mt-2 ml-1">
                    MULTIPLAYER NAVAL COMMAND
                </h2>
            </motion.div>

            {/* ATMOSPHERIC RADAR */}
            <motion.div variants={itemVariants} className="relative hidden lg:flex items-center justify-center w-[400px] h-[400px] opacity-40">
                <div className="absolute inset-0 border border-cyan-900/50 rounded-full"></div>
                <div className="absolute inset-4 border border-cyan-900/30 rounded-full"></div>
                <div className="absolute inset-16 border border-cyan-900/20 rounded-full border-dashed"></div>
                
                {/* Radar Sweep */}
                {!reducedMotion && (
                    <motion.div 
                        className="absolute top-0 right-1/2 bottom-1/2 left-0 origin-bottom-right bg-[conic-gradient(from_180deg_at_bottom_right,_transparent_0deg,_rgba(0,200,255,0.1)_90deg)]"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                )}
                
                {/* Crosshairs */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-cyan-900/30"></div>
                <div className="absolute left-0 right-0 top-1/2 h-px bg-cyan-900/30"></div>

                {/* Blips */}
                <div className="absolute top-[30%] left-[60%] w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(0,200,255,1)] animate-pulse"></div>
                <div className="absolute top-[65%] left-[25%] w-1.5 h-1.5 bg-cyan-600 rounded-full"></div>
            </motion.div>
        </div>

        {/* RIGHT COLUMN: COMMAND CONSOLE */}
        <div className="flex-[0.8] flex flex-col justify-center">
            <motion.div variants={itemVariants} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-xl shadow-2xl relative overflow-hidden">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-700/50"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-700/50"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-700/50"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-700/50"></div>

                {/* CALLSIGN INPUT */}
                <div className="mb-10 group">
                    <label className="flex items-center gap-2 text-xs font-bold mb-3 text-slate-400 uppercase tracking-[0.2em]">
                        <Anchor size={14} className="group-focus-within:text-cyan-500 transition-colors" />
                        Commander Callsign
                        {!nickname && <span className="ml-auto text-[10px] text-red-500 animate-pulse">IDENTIFICATION REQUIRED</span>}
                    </label>
                    <input 
                        type="text" 
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full bg-[#00050a]/80 border border-slate-700/80 p-4 rounded text-slate-200 font-mono uppercase tracking-widest focus:outline-none focus:border-cyan-600 focus:bg-[#000a14] transition-all shadow-inner placeholder:text-slate-700"
                        placeholder="ENTER CALLSIGN"
                        maxLength={12}
                    />
                </div>

                {/* DEPLOY ACTION */}
                <div className="mb-8">
                    <button 
                        onClick={handleCreate}
                        disabled={!nickname}
                        className="w-full bg-slate-800 hover:bg-cyan-900 border border-slate-600 hover:border-cyan-500 text-slate-300 hover:text-white font-bold py-4 rounded tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:pointer-events-none group"
                    >
                        <Crosshair size={18} className="group-hover:text-cyan-400" />
                        DEPLOY NEW FLEET
                    </button>
                    <p className="text-center text-[10px] text-slate-500 mt-3 tracking-widest uppercase">Establish a new naval operation</p>
                </div>

                {/* DIVIDER */}
                <div className="flex items-center gap-4 py-4 opacity-40">
                    <div className="h-px bg-gradient-to-r from-transparent to-slate-500 flex-1"></div>
                    <span className="text-slate-400 text-[10px] tracking-[0.4em] font-bold">OR</span>
                    <div className="h-px bg-gradient-to-l from-transparent to-slate-500 flex-1"></div>
                </div>

                {/* JOIN ACTION */}
                <div className="mt-4">
                    <label className="flex items-center gap-2 text-xs font-bold mb-3 text-slate-400 uppercase tracking-[0.2em]">
                        <RadioTower size={14} />
                        Join Existing Operation
                        <span className="ml-auto text-[10px] text-cyan-700">SECURE CHANNEL</span>
                    </label>
                    <div className="flex gap-3">
                        <input 
                            type="text" 
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            className="flex-[2] bg-[#00050a]/80 border border-slate-700/80 p-4 rounded text-slate-200 font-mono uppercase tracking-widest text-center focus:outline-none focus:border-red-900 focus:bg-[#000a14] transition-all shadow-inner placeholder:text-slate-700"
                            placeholder="ROOM CODE"
                            maxLength={6}
                        />
                        <button 
                            onClick={handleJoin}
                            disabled={!nickname || joinCode.length < 6}
                            className="flex-[1] bg-transparent border border-red-900/50 hover:bg-red-900/30 text-red-500 hover:text-red-400 hover:border-red-500 font-bold py-4 rounded tracking-[0.2em] transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
                        >
                            <ShieldAlert size={16} />
                            JOIN
                        </button>
                    </div>
                </div>

            </motion.div>
        </div>
      </motion.div>

      {/* BOTTOM FLEET PREVIEW */}
      <motion.div 
        className="relative z-10 w-full bg-[#00050a]/80 border-t border-slate-800/50 py-4"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
              <span className="text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase hidden md:block">Fleet Composition</span>
              
              <div className="flex items-center gap-8 md:gap-16 grayscale opacity-70">
                  {/* Small Graphical Representations of Ships */}
                  <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-8"><ShipGraphic type="carrier" isVertical={false} /></div>
                      <span className="text-[8px] tracking-widest text-slate-500">CARRIER</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-6"><ShipGraphic type="battleship" isVertical={false} /></div>
                      <span className="text-[8px] tracking-widest text-slate-500">BATTLESHIP</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-5"><ShipGraphic type="cruiser" isVertical={false} /></div>
                      <span className="text-[8px] tracking-widest text-slate-500">CRUISER</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-4"><ShipGraphic type="destroyer" isVertical={false} /></div>
                      <span className="text-[8px] tracking-widest text-slate-500">DESTROYER</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-3 opacity-80"><ShipGraphic type="submarine" isVertical={false} /></div>
                      <span className="text-[8px] tracking-widest text-slate-500">SUBMARINE</span>
                  </div>
              </div>

              <span className="text-[10px] font-bold tracking-[0.3em] text-cyan-900 uppercase hidden md:block">Awaiting Orders</span>
          </div>
      </motion.div>

    </div>
  );
}
