import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';
import { ShipGraphic } from '../components/ShipGraphic';
import { Shield, ShieldAlert, Crosshair } from 'lucide-react';

const GRID_SIZE = 10;

export default function GamePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { room, currentPlayerId, currentTurnId, myFleet, round } = useGameStore();
  const [hideShips, setHideShips] = useState(false);
  
  useEffect(() => {
    if (room?.gameState === 'FINISHED') {
      navigate(`/results/${roomId}`);
    }
  }, [room?.gameState, navigate, roomId]);

  if (!room) return null;

  const me = room.players.find(p => p.id === currentPlayerId);
  const opponents = room.players.filter(p => p.id !== currentPlayerId);
  const isMyTurn = currentTurnId === currentPlayerId;
  const isTargetingMe = room.currentTargetId === currentPlayerId && !isMyTurn;

  const handleAttack = (targetId: string, x: number, y: number) => {
    if (!isMyTurn) return;
    socket.emit('game:attack', { targetId, x, y });
  };

  const renderGrid = (player: any, isMe: boolean) => {
    return (
      <div className="relative inline-grid grid-cols-10 gap-0 border-2 border-white/20 bg-navy-900/50 p-1 md:p-2 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          
          let cellState = 'empty';
          let hasShip = false;

          if (isMe && myFleet) {
            hasShip = myFleet.some(ship => ship.cells.some((c: any) => c.x === x && c.y === y));
          }

          let incomingShot: any = null;
          room.players.forEach(p => {
             const s = p.shots.find((s: any) => s.x === x && s.y === y && s.targetId === player.id);
             if (s) incomingShot = s;
          });

          if (incomingShot) {
            cellState = (incomingShot as any).result;
          }

          let bgColor = 'bg-transparent';
          let zIndex = 'z-0';
          if (cellState === 'hit') { bgColor = 'bg-orange-500/80 shadow-[0_0_15px_rgba(255,100,0,0.8)] animate-pulse border-orange-300'; zIndex = 'z-20'; }
          else if (cellState === 'miss') { bgColor = 'bg-white/40 border-white/80'; zIndex = 'z-20'; }
          else if (hasShip && !hideShips) { bgColor = 'bg-neon-blue/10'; zIndex = 'z-0'; }

          const canAttackThisOpponent = isMyTurn && !(room as any).turnMisses?.includes(player.id);

          return (
            <div 
              key={i} 
              onClick={() => !isMe && !incomingShot && canAttackThisOpponent && handleAttack(player.id, x, y)}
              className={`relative ${zIndex} w-6 h-6 md:w-8 md:h-8 border border-white/5 transition-all ${bgColor} ${!isMe && !incomingShot && canAttackThisOpponent ? 'hover:bg-white/30 cursor-crosshair' : ''}`}
            ></div>
          );
        })}
        {/* Render Ships as Graphics */}
        {player.fleet?.map((ship: any, idx: number) => {
           if (!isMe && !ship.sunk && !player.eliminated) return null;
           
           const minX = Math.min(...ship.cells.map((c:any) => c.x));
           const maxX = Math.max(...ship.cells.map((c:any) => c.x));
           const minY = Math.min(...ship.cells.map((c:any) => c.y));
           const maxY = Math.max(...ship.cells.map((c:any) => c.y));
           const isVerticalPlaced = (maxY - minY) > (maxX - minX);
           
           return (
              <div key={`ship-${idx}`} className={`absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out ${isMe && hideShips ? 'blur-md opacity-30 grayscale saturate-0' : ''}`}>
                 <ShipGraphic type={ship.type} isVertical={isVerticalPlaced} cells={ship.cells} isDestroyed={ship.sunk} />
              </div>
           );
        })}
      </div>
    );
  };

  const themeClass = isMyTurn 
    ? 'bg-red-950/20 shadow-[inset_0_0_150px_rgba(255,0,0,0.15)] border-red-900/30' 
    : isTargetingMe 
    ? 'bg-red-950/40 border-red-500 animate-[pulse_3s_ease-in-out_infinite]' 
    : 'bg-navy-950';

  const targetingPlayer = room.players.find(p => p.id === currentTurnId);

  return (
    <div className={`min-h-screen p-4 md:p-8 flex flex-col h-screen transition-all duration-1000 ${themeClass}`}>
      <header className="flex justify-between items-center mb-8 shrink-0 relative z-20">
        <div>
          <h1 className={`text-2xl font-bold tracking-widest ${isMyTurn || isTargetingMe ? 'text-red-500' : 'text-neon-blue'}`}>ARMADA</h1>
          <p className="text-white/50 text-sm tracking-widest">ROUND {round}</p>
        </div>
        <div className={`px-6 py-2 rounded font-bold tracking-widest border flex items-center gap-2 ${
            isMyTurn ? 'bg-red-600 text-white border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)]' 
            : isTargetingMe ? 'bg-red-950/80 text-red-500 border-red-500 animate-[pulse_2s_ease-in-out_infinite]'
            : 'bg-navy-900 text-white/80 border-white/20'
        }`}>
          {isMyTurn && <Crosshair size={20} />}
          {isTargetingMe && <ShieldAlert size={20} />}
          {isMyTurn ? '🎯 YOUR TURN: SELECT TARGET' 
            : isTargetingMe ? `⚠ YOU ARE UNDER ATTACK: ${targetingPlayer?.nickname.toUpperCase()} IS TARGETING YOU` 
            : `⏳ CURRENT TURN: ${targetingPlayer?.nickname.toUpperCase()}`}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden relative z-20">
        
        {/* Left Column: My Board */}
        <div className="flex flex-col items-center">
           <h2 className="text-xl mb-4 text-white/70 tracking-widest flex items-center justify-between w-full px-4">
              <span>YOUR FLEET</span>
              <button 
                 onClick={() => setHideShips(!hideShips)}
                 className={`text-sm px-3 py-1 rounded border flex items-center gap-2 transition-colors ${hideShips ? 'bg-white/20 text-white border-white/50' : 'bg-transparent text-white/50 border-white/20 hover:text-white'}`}
              >
                  <Shield size={14} /> 👁 {hideShips ? 'Ships Hidden' : 'Hide Ships'}
              </button>
           </h2>
           <div className="glass-panel p-4 rounded-xl mb-6">
             {me && renderGrid(me, true)}
           </div>
           
           {/* Fleet Status Panel */}
           <div className="w-full glass-panel p-4 rounded-xl flex flex-col gap-3 overflow-y-auto max-h-[30vh]">
              <h3 className="text-sm tracking-widest text-white/50 border-b border-white/10 pb-2 mb-2">FLEET STATUS</h3>
              {me?.eliminated ? (
                  <div className="text-neon-red font-bold tracking-widest text-xl text-center py-4">FLEET DESTROYED</div>
              ) : myFleet && myFleet.map((ship, idx) => {
                  const name = ship.type.toUpperCase();
                  const size = ship.cells.length;
                  const hits = ship.hits.length;
                  const sunk = ship.sunk;
                  
                  return (
                      <div key={idx} className={`flex items-center justify-between p-2 rounded border ${sunk ? 'border-red-900/50 bg-red-950/20 opacity-60 grayscale' : 'border-white/5 bg-white/5'}`}>
                          <div className="w-16 h-8 shrink-0 relative mr-3">
                              <ShipGraphic type={ship.type} isVertical={false} isDestroyed={sunk} />
                          </div>
                          <div className="flex-1 flex flex-col">
                              <span className="font-bold text-sm tracking-widest">{name}</span>
                              <span className="text-xs text-white/50">{size} cells</span>
                          </div>
                          <div className="flex flex-col items-end">
                              <span className={`font-mono font-bold ${sunk ? 'text-red-500' : hits > 0 ? 'text-orange-400' : 'text-neon-blue'}`}>{hits}/{size}</span>
                              {sunk && <span className="text-[10px] text-red-500 font-bold tracking-widest">DESTROYED</span>}
                          </div>
                      </div>
                  );
              })}
           </div>
        </div>

        {/* Right Column: Opponents */}
        <div className="lg:col-span-2 overflow-y-auto pr-4">
           <h2 className="text-xl mb-4 text-white/70 tracking-widest">OPPONENT RADAR</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {opponents.map(opp => {
                 const hasMissed = (room as any).turnMisses?.includes(opp.id);
                 const isTargeted = room.currentTargetId === opp.id;
                 const canAttack = isMyTurn && !opp.eliminated && !hasMissed;
                 
                 return (
                 <div 
                    key={opp.id} 
                    onMouseEnter={() => canAttack && socket.emit('game:setTarget', { targetId: opp.id })}
                    onMouseLeave={() => canAttack && socket.emit('game:setTarget', { targetId: null })}
                    onClick={() => canAttack && socket.emit('game:setTarget', { targetId: opp.id })}
                    className={`relative p-4 rounded-xl flex flex-col items-center transition-all duration-300 ease-in-out ${opp.eliminated ? 'opacity-50 grayscale bg-black/50' : isTargeted ? 'bg-red-950/80 shadow-[0_0_30px_rgba(255,0,0,0.3)] border-2 border-red-500 scale-105 z-10' : 'glass-panel opacity-80 hover:opacity-100 cursor-pointer'}`}
                 >
                    {isTargeted && isMyTurn && (
                        <div className="absolute -top-4 bg-red-600 text-white font-bold tracking-widest px-4 py-1 rounded shadow-lg text-sm flex items-center gap-2">
                           <Crosshair size={16} /> ATTACKING: {opp.nickname}
                        </div>
                    )}
                    <div className="flex justify-between w-full mb-2">
                        <span className="font-bold">{opp.nickname}</span>
                        <span className="text-neon-red text-sm tracking-widest">{opp.remainingShips} SHIPS</span>
                    </div>
                    {isMyTurn && !opp.eliminated && (
                        <div className={`text-xs tracking-widest mb-2 ${hasMissed ? 'text-white/30' : isTargeted ? 'text-red-400 animate-pulse font-bold' : 'text-neon-blue'}`}>
                            {hasMissed ? 'TARGET LOST (MISSED)' : isTargeted ? 'LOCKING ON...' : 'TARGET ACQUIRED'}
                        </div>
                    )}
                    <div className={`transition-all duration-300 ${!isMyTurn && !opp.eliminated ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
                       {renderGrid(opp, false)}
                    </div>
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
