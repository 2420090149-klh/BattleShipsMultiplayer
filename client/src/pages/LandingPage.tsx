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
      {/* Background Radar Animation Placeholder */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center">
         <div className="w-[800px] h-[800px] border border-neon-blue rounded-full absolute border-opacity-30"></div>
         <div className="w-[600px] h-[600px] border border-neon-blue rounded-full absolute border-opacity-40"></div>
         <div className="w-[400px] h-[400px] border border-neon-blue rounded-full absolute border-opacity-50"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 glass-panel p-10 rounded-xl text-center max-w-md w-full"
      >
        <h1 className="text-4xl font-bold mb-2 tracking-widest text-neon-blue">BATTLESHIP</h1>
        <h2 className="text-2xl font-light tracking-[0.3em] mb-8 text-white/70">ARMADA</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-left mb-1 text-white/50 uppercase tracking-wider">Callsign</label>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-navy-800 border border-white/20 p-3 rounded text-white focus:outline-none focus:border-neon-blue"
              placeholder="Enter your callsign"
            />
          </div>

          <button 
            onClick={handleCreate}
            className="w-full bg-neon-blue text-navy-900 font-bold py-3 rounded tracking-wider hover:bg-white transition-colors"
          >
            CREATE ARMADA
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-white/20 flex-1"></div>
            <span className="text-white/40 text-sm">OR</span>
            <div className="h-px bg-white/20 flex-1"></div>
          </div>

          <div className="flex gap-2">
             <input 
              type="text" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="w-2/3 bg-navy-800 border border-white/20 p-3 rounded text-white focus:outline-none focus:border-neon-red uppercase"
              placeholder="ROOM CODE"
              maxLength={6}
            />
            <button 
              onClick={handleJoin}
              className="w-1/3 bg-transparent border border-neon-red text-neon-red font-bold py-3 rounded hover:bg-neon-red hover:text-white transition-colors"
            >
              JOIN
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
