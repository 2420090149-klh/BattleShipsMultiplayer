import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();
  const { setCurrentPlayerId } = useGameStore();

  const handleCreate = () => {
    if (!nickname) return;
    setCurrentPlayerId(socket.id!);
    socket.emit('room:create', {
      nickname,
      avatar: 'default',
      color: '#00f3ff',
      maxPlayers: 6
    });
    // The server will emit 'room:joined' which we catch in App.tsx
    // For now we'll just navigate, though it's better to navigate on success
    // Using a setTimeout for now until we add an event listener specifically for navigation
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
      {/* Background Radar Animation */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center">
         <div className="w-[800px] h-[800px] border border-neon-blue rounded-full absolute border-opacity-20 shadow-[0_0_50px_rgba(0,243,255,0.1)]"></div>
         <div className="w-[600px] h-[600px] border border-neon-blue rounded-full absolute border-opacity-30 shadow-[0_0_50px_rgba(0,243,255,0.2)]"></div>
         <div className="w-[400px] h-[400px] border border-neon-blue rounded-full absolute border-opacity-50 shadow-[0_0_50px_rgba(0,243,255,0.3)]">
             <div className="radar-sweep"></div>
         </div>
         <div className="w-2 h-2 bg-neon-blue rounded-full absolute shadow-[0_0_20px_rgba(0,243,255,1)]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="z-10 glass-panel p-10 rounded-2xl text-center max-w-md w-full shadow-[0_0_60px_rgba(0,243,255,0.15)] border-t border-neon-blue/30"
      >
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.3 }}
           className="mb-8"
        >
            <h1 className="text-5xl font-black mb-2 tracking-widest text-neon-blue drop-shadow-[0_0_15px_rgba(0,243,255,0.5)]">BATTLESHIP</h1>
            <h2 className="text-xl font-medium tracking-[0.4em] text-white/60">A R M A D A</h2>
        </motion.div>
        
        <div className="space-y-6">
          <div className="group text-left">
            <label className="block text-xs font-bold mb-2 text-white/50 uppercase tracking-[0.2em] group-focus-within:text-neon-blue transition-colors">Callsign</label>
            <div className="relative">
                <input 
                  type="text" 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-navy-900/80 border-2 border-white/10 p-4 pl-4 rounded-lg text-white font-mono uppercase tracking-widest focus:outline-none focus:border-neon-blue focus:bg-navy-800 transition-all shadow-inner"
                  placeholder="ENTER CALLSIGN"
                  maxLength={12}
                />
            </div>
          </div>

          <button 
            onClick={handleCreate}
            disabled={!nickname}
            className="w-full bg-neon-blue/90 hover:bg-white text-navy-900 font-black py-4 rounded-lg tracking-[0.2em] transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] disabled:opacity-50 disabled:pointer-events-none"
          >
            CREATE ARMADA
          </button>

          <div className="flex items-center gap-4 py-4 opacity-60">
            <div className="h-px bg-gradient-to-r from-transparent to-white/30 flex-1"></div>
            <span className="text-white/50 text-xs tracking-[0.3em] font-bold">OR</span>
            <div className="h-px bg-gradient-to-l from-transparent to-white/30 flex-1"></div>
          </div>

          <div className="flex gap-3">
             <input 
              type="text" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-2/3 bg-navy-900/80 border-2 border-white/10 p-4 rounded-lg text-white font-mono uppercase tracking-widest text-center focus:outline-none focus:border-neon-red focus:bg-navy-800 transition-all shadow-inner placeholder:text-white/20"
              placeholder="ROOM CODE"
              maxLength={6}
            />
            <button 
              onClick={handleJoin}
              disabled={!nickname || joinCode.length < 6}
              className="w-1/3 bg-transparent border-2 border-neon-red text-neon-red font-black py-4 rounded-lg tracking-widest hover:bg-neon-red hover:text-white transition-all transform hover:scale-[1.05] active:scale-95 shadow-[0_0_15px_rgba(255,0,85,0.2)] hover:shadow-[0_0_25px_rgba(255,0,85,0.5)] disabled:opacity-50 disabled:pointer-events-none"
            >
              JOIN
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
