import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';

export default function LobbyPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { room, currentPlayerId } = useGameStore();

  useEffect(() => {
    if (!room) {
      // If we land here directly without being in a room, redirect to home
      // In a real app we'd try to join via API/Socket using the roomId parameter
      navigate('/');
    }
  }, [room, navigate]);

  useEffect(() => {
      if (room?.gameState === 'DEPLOYMENT') {
          navigate(`/deploy/${roomId}`);
      }
  }, [room?.gameState, navigate, roomId]);

  if (!room) return null;

  const isHost = room.hostId === socket.id;
  const me = room.players.find(p => p.id === socket.id);

  const toggleReady = () => {
    if (!me) return;
    socket.emit('room:ready', !me.ready);
  };

  const startGame = () => {
    socket.emit('room:start');
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?join=${roomId}`);
    // Show toast here
  };

  return (
    <div className="min-h-screen p-8 relative">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-neon-blue">ARMADA LOBBY</h1>
          <p className="text-white/50 tracking-widest text-sm">ROOM CODE: <span className="text-white font-mono">{roomId}</span></p>
        </div>
        <button 
          onClick={copyInvite}
          className="border border-white/20 px-4 py-2 rounded text-sm hover:bg-white/10 transition-colors"
        >
          COPY INVITE LINK
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Render Players */}
        {room.players.map((player, index) => (
          <motion.div 
            key={player.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-panel p-6 rounded-xl border-l-4 ${player.ready ? 'border-l-neon-blue' : 'border-l-white/20'}`}
          >
            <div className="text-xs text-white/40 mb-2">COMMANDER 0{index + 1}</div>
            <div className="text-xl font-bold mb-4">{player.nickname} {player.id === room.hostId && '(HOST)'}</div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${player.ready ? 'bg-neon-blue shadow-[0_0_10px_#00f3ff]' : 'bg-white/20'}`}></div>
              <span className="text-sm font-bold tracking-wider">{player.ready ? 'READY' : 'STANDBY'}</span>
            </div>
          </motion.div>
        ))}

        {/* Render Empty Slots */}
        {Array.from({ length: room.maxPlayers - room.players.length }).map((_, index) => (
          <div key={`empty-${index}`} className="glass-panel p-6 rounded-xl border border-dashed border-white/20 flex items-center justify-center opacity-50">
            <span className="text-white/30 tracking-widest">AWAITING COMMANDER...</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-12 left-0 w-full flex justify-center gap-6">
        <button 
          onClick={toggleReady}
          className={`px-8 py-3 rounded font-bold tracking-widest transition-colors ${me?.ready ? 'bg-transparent border border-neon-blue text-neon-blue' : 'bg-neon-blue text-navy-900 hover:bg-white'}`}
        >
          {me?.ready ? 'ABORT READY' : 'READY FLEET'}
        </button>

        {isHost && (
          <button 
            onClick={startGame}
            disabled={room.players.length < 2 || !room.players.every(p => p.ready)}
            className="bg-neon-red text-white px-8 py-3 rounded font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500 transition-colors"
          >
            START BATTLE
          </button>
        )}
      </div>
    </div>
  );
}
