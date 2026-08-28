import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';

const GRID_SIZE = 10;

export default function GamePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { room, currentPlayerId, currentTurnId, myFleet, round } = useGameStore();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  
  useEffect(() => {
    if (room?.gameState === 'FINISHED') {
      navigate(`/results/${roomId}`);
    }
  }, [room?.gameState, navigate, roomId]);

  if (!room) return null;

  const me = room.players.find(p => p.id === currentPlayerId);
  const opponents = room.players.filter(p => p.id !== currentPlayerId);
  const isMyTurn = currentTurnId === currentPlayerId;

  const handleAttack = (targetId: string, x: number, y: number) => {
    if (!isMyTurn) return;
    socket.emit('game:attack', { targetId, x, y });
  };

  const renderGrid = (player: any, isMe: boolean) => {
    return (
      <div className="grid grid-cols-10 gap-1 bg-navy-800 p-1 border border-white/10 shrink-0">
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          
          let cellState = 'empty';
          let hasShip = false;

          // Check my fleet for ships
          if (isMe && myFleet) {
            hasShip = myFleet.some(ship => ship.cells.some((c: any) => c.x === x && c.y === y));
          }

          // Check shots fired AT this board
          const shot = player.shots.find((s: any) => s.x === x && s.y === y && s.targetId === player.id);
          // Wait, the backend stores shots on the ATTACKER. 
          // So to find shots on THIS player, we must look at all OTHER players' shots where targetId === player.id
          let incomingShot = null;
          room.players.forEach(p => {
             const s = p.shots.find((s: any) => s.x === x && s.y === y && s.targetId === player.id);
             if (s) incomingShot = s;
          });

          if (incomingShot) {
            cellState = (incomingShot as any).result;
          }

          let bgColor = 'bg-transparent';
          if (cellState === 'hit') bgColor = 'bg-neon-red';
          else if (cellState === 'miss') bgColor = 'bg-white/30';
          else if (hasShip) bgColor = 'bg-neon-blue/40';

          const canAttackThisOpponent = isMyTurn && !(room as any).turnMisses?.includes(player.id);

          return (
            <div 
              key={i} 
              onClick={() => !isMe && !incomingShot && canAttackThisOpponent && handleAttack(player.id, x, y)}
              className={`w-6 h-6 md:w-8 md:h-8 border border-white/5 transition-all ${bgColor} ${!isMe && !incomingShot && canAttackThisOpponent ? 'hover:bg-white/20 cursor-crosshair' : ''}`}
            ></div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col h-screen">
      <header className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-neon-blue">ARMADA</h1>
          <p className="text-white/50 text-sm tracking-widest">ROUND {round}</p>
        </div>
        <div className={`px-6 py-2 rounded font-bold tracking-widest border ${isMyTurn ? 'bg-neon-blue text-navy-900 border-neon-blue animate-pulse' : 'border-white/20 text-white/50'}`}>
          {isMyTurn ? 'YOUR TURN' : 'AWAITING COMMAND'}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
        
        {/* Left Column: My Board */}
        <div className="flex flex-col items-center">
           <h2 className="text-xl mb-4 text-white/70 tracking-widest">YOUR FLEET</h2>
           <div className="glass-panel p-4 rounded-xl">
             {me && renderGrid(me, true)}
           </div>
           {me?.eliminated && (
               <div className="mt-4 text-neon-red font-bold tracking-widest text-xl">FLEET DESTROYED</div>
           )}
        </div>

        {/* Right Column: Opponents */}
        <div className="lg:col-span-2 overflow-y-auto pr-4">
           <h2 className="text-xl mb-4 text-white/70 tracking-widest">OPPONENT RADAR</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {opponents.map(opp => {
                 const hasMissed = (room as any).turnMisses?.includes(opp.id);
                 return (
                 <div key={opp.id} className={`glass-panel p-4 rounded-xl flex flex-col items-center ${opp.eliminated ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex justify-between w-full mb-2">
                        <span className="font-bold">{opp.nickname}</span>
                        <span className="text-neon-red text-sm tracking-widest">{opp.remainingShips} SHIPS</span>
                    </div>
                    {isMyTurn && !opp.eliminated && (
                        <div className={`text-xs tracking-widest mb-2 ${hasMissed ? 'text-white/30' : 'text-neon-blue animate-pulse'}`}>
                            {hasMissed ? 'TARGET LOST (MISSED)' : 'TARGET ACQUIRED'}
                        </div>
                    )}
                    {renderGrid(opp, false)}
                    {opp.eliminated && <div className="mt-2 text-neon-red font-bold">ELIMINATED</div>}
                 </div>
                 )
             })}
           </div>
        </div>

      </div>
    </div>
  );
}
