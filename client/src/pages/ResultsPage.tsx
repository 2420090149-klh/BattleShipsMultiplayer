import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { room, winnerId, currentPlayerId } = useGameStore();

  if (!room) return null;

  const winner = room.players.find(p => p.id === winnerId);
  const isMe = winnerId === currentPlayerId;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Background glow based on win/loss */}
        <div className={`absolute inset-0 z-0 opacity-10 pointer-events-none ${isMe ? 'bg-neon-blue' : 'bg-neon-red'}`}></div>

        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="z-10 text-center mb-12"
        >
            <h1 className="text-5xl md:text-7xl font-bold tracking-[0.2em] mb-4">
                {isMe ? <span className="text-neon-blue">VICTORY</span> : <span className="text-neon-red">DEFEAT</span>}
            </h1>
            <p className="text-xl tracking-widest text-white/70 uppercase">
                {winner ? `ADMIRAL ${winner.nickname} RULES THE SEAS` : 'DRAW'}
            </p>
        </motion.div>

        <div className="z-10 glass-panel p-8 rounded-xl w-full max-w-2xl">
            <h2 className="text-2xl tracking-widest mb-6 text-center border-b border-white/10 pb-4">BATTLE REPORT</h2>
            
            <div className="space-y-4">
                {room.players.sort((a,b) => b.remainingShips - a.remainingShips).map((player, index) => (
                    <div key={player.id} className="flex justify-between items-center p-4 bg-navy-800 rounded border border-white/5">
                        <div className="flex items-center gap-4">
                            <span className="text-white/40 font-mono">0{index + 1}</span>
                            <span className={`font-bold ${player.id === winnerId ? 'text-neon-blue' : ''}`}>{player.nickname}</span>
                        </div>
                        <div className="flex gap-8 text-sm tracking-widest text-white/50">
                            <span>{player.shots.length} SHOTS</span>
                            <span className={player.remainingShips > 0 ? 'text-green-400' : 'text-neon-red'}>
                                {player.remainingShips > 0 ? 'SURVIVED' : 'DESTROYED'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="z-10 mt-12 flex gap-6">
            <button 
                onClick={() => navigate('/')}
                className="bg-transparent border border-white/20 text-white px-8 py-3 rounded font-bold tracking-widest hover:bg-white/10 transition-colors"
            >
                RETURN TO HQ
            </button>
        </div>
    </div>
  );
}
