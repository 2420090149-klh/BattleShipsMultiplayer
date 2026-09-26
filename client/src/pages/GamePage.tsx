import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';
import { ShipGraphic } from '../components/ShipGraphic';
import { MemeOverlay } from '../components/MemeOverlay';
import { Shield, ShieldAlert, Crosshair, Radar, Zap, Target, Eye, Move, Ghost, Cpu, Bomb } from 'lucide-react';

const GRID_SIZE = 10;

export default function GamePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { room, currentPlayerId, currentTurnId, myFleet, round, activePower, setActivePower } = useGameStore();
  const [hideShips, setHideShips] = useState(true);
  const [timeLeft, setTimeLeft] = useState(40);
  const [revealedPower, setRevealedPower] = useState<{ power: string, x: number, y: number } | null>(null);
  const [powerResult, setPowerResult] = useState<{ type: string, message: string, revealed?: any[] } | null>(null);

  const me = room?.players.find(p => p.id === currentPlayerId);
  const opponents = room?.players.filter(p => p.id !== currentPlayerId) || [];
  const isMyTurn = currentTurnId === currentPlayerId;
  const isTargetingMe = room?.currentTargetId === currentPlayerId && !isMyTurn && !me?.eliminated;

  useEffect(() => {
      if (!(room as any)?.turnStartTime) {
          setTimeLeft(40);
          return;
      }
      
      const localStartTime = Date.now();
      setTimeLeft(40);

      const interval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - localStartTime) / 1000);
          const remaining = Math.max(0, 40 - elapsed);
          setTimeLeft(remaining);
      }, 1000);
      
      return () => clearInterval(interval);
  }, [(room as any)?.turnStartTime]);

  useEffect(() => {
    if (room?.gameState === 'FINISHED') {
      navigate(`/results/${roomId}`);
    }
  }, [room?.gameState, navigate, roomId]);

  useEffect(() => {
      const handlePowerCollected = (data: any) => {
          setRevealedPower(data);
          setTimeout(() => setRevealedPower(null), 3000);
      };
      const handlePowerResult = (data: any) => {
          setPowerResult(data);
          setTimeout(() => setPowerResult(null), 5000);
      };
      
      socket.on('game:powerCollected', handlePowerCollected);
      socket.on('game:powerResult', handlePowerResult);
      
      return () => {
          socket.off('game:powerCollected', handlePowerCollected);
          socket.off('game:powerResult', handlePowerResult);
      };
  }, []);

  if (!room) return null;

  const handleAttack = (targetId: string, x: number, y: number) => {
    if (!isMyTurn) return;
    socket.emit('game:attack', { targetId, x, y });
  };

  const renderMiniFleet = (player: any) => {
      const fleet = player.publicFleet || (player.id === currentPlayerId ? myFleet?.map(s => ({ type: s.type, sunk: s.sunk, size: s.cells.length, hitIndices: s.hits.map((h:any) => s.cells.findIndex((c:any) => c.x === h.x && c.y === h.y)).filter((i:any) => i !== -1) })) : null);
      if (!fleet) return null;
      
      return (
          <div className="w-full mt-4">
              <div className="text-[10px] text-white/40 tracking-widest text-center mb-1 font-bold">FLEET STATUS</div>
              <div className="flex flex-wrap items-center justify-center gap-3 p-3 border-4 border-white/10 rounded-xl bg-black/20 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                  {fleet.map((ship: any, idx: number) => (
                      <div key={idx} className={`w-12 h-5 md:w-16 md:h-6 relative transition-all duration-700 ${ship.sunk ? 'opacity-20 grayscale brightness-50' : 'drop-shadow-lg'}`}>
                          <ShipGraphic type={ship.type} isVertical={false} isDestroyed={ship.sunk} size={ship.size} hitIndices={ship.hitIndices} />
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const POWER_DICT: Record<string, { name: string, icon: any, desc: string }> = {
      'SONAR': { name: 'SONAR SCAN', icon: Radar, desc: 'Detect if a ship occupies a single cell.' },
      'DOUBLE_STRIKE': { name: 'DOUBLE STRIKE', icon: Zap, desc: 'Launch two attacks this turn.' },
      'RADAR': { name: 'RADAR SWEEP', icon: Eye, desc: 'Reveal a 3x3 area temporarily.' },
      'SHIELD': { name: 'SHIELD', icon: Shield, desc: 'Block the next incoming hit.' },
      'DEPTH_CHARGE': { name: 'DEPTH CHARGE', icon: Bomb, desc: 'Attack a 2x2 area.' },
      'PRECISION_SHOT': { name: 'PRECISION SHOT', icon: Target, desc: 'Guaranteed hit on a discovered ship.' },
      'GHOST_FLEET': { name: 'GHOST FLEET', icon: Ghost, desc: 'Block information-revealing powers for 1 round.' },
      'RELOCATION': { name: 'RELOCATION', icon: Move, desc: 'Move a surviving ship to a new location.' },
      'INTEL': { name: 'INTEL INTERCEPT', icon: Cpu, desc: 'Reveal the class and damage of a hit ship.' },
      'EMP': { name: 'EMP STRIKE', icon: Zap, desc: 'Disable a target player\'s powers for 1 round.' },
  };

  const renderInventory = () => {
      if (!me?.inventory || me.inventory.length === 0) return null;
      
      const hasEMP = room?.activeEffects?.some(e => e.type === 'EMP' && e.targetId === currentPlayerId);
      
      return (
          <div className="w-full mt-4">
              <div className="text-[10px] text-white/40 tracking-widest text-center mb-1 font-bold">YOUR POWERS</div>
              <div className="flex flex-wrap items-center justify-center gap-2 p-3 border-4 border-neon-blue/20 rounded-xl bg-black/40">
                  {hasEMP && (
                      <div className="w-full text-center text-xs text-red-500 animate-pulse font-bold tracking-widest mb-2">POWERS DISABLED BY EMP</div>
                  )}
                  {me.inventory.map((powerType: string, idx: number) => {
                      const pData = POWER_DICT[powerType];
                      const Icon = pData.icon;
                      const isActive = activePower === powerType;
                      
                      return (
                          <button
                              key={idx}
                              disabled={hasEMP || (!isMyTurn && powerType !== 'SHIELD' && powerType !== 'GHOST_FLEET')}
                              onClick={() => {
                                  if (activePower === powerType) setActivePower(null);
                                  else setActivePower(powerType as any);
                                  
                                  // Some powers are instant and don't need targeting mode
                                  if (['DOUBLE_STRIKE', 'SHIELD', 'GHOST_FLEET'].includes(powerType)) {
                                      socket.emit('game:usePower', { type: powerType });
                                      setActivePower(null);
                                  }
                              }}
                              title={pData.desc}
                              className={`relative p-2 rounded border-2 transition-all group ${hasEMP ? 'opacity-30 grayscale cursor-not-allowed' : isActive ? 'bg-teal-500/30 border-teal-400 shadow-[0_0_15px_rgba(0,255,200,0.5)]' : 'bg-navy-800 border-white/20 hover:border-teal-500 hover:bg-navy-700'}`}
                          >
                              <Icon size={20} className={isActive ? 'text-teal-300' : 'text-white/70'} />
                              {isActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full animate-ping" />}
                          </button>
                      );
                  })}
              </div>
          </div>
      );
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

          const powerCell = player.powerCells?.find((pc: any) => pc.x === x && pc.y === y && !pc.collected);

          let bgColor = 'bg-transparent';
          let zIndex = 'z-0';
          if (cellState === 'hit') { bgColor = 'bg-orange-500/80 shadow-[0_0_15px_rgba(255,100,0,0.8)] animate-pulse border-orange-300'; zIndex = 'z-20'; }
          else if (cellState === 'blocked') { bgColor = 'bg-teal-500/80 shadow-[0_0_15px_rgba(0,255,200,0.8)] border-teal-300'; zIndex = 'z-20'; }
          else if (cellState === 'miss') { bgColor = 'bg-white/40 border-white/80'; zIndex = 'z-20'; }
          else if (hasShip && !hideShips) { bgColor = 'bg-neon-blue/10'; zIndex = 'z-0'; }

          const canAttackThisOpponent = isMyTurn && !(room as any).turnMisses?.includes(player.id);
          const isTargeting = activePower !== null;
          
          let isRadarRevealed = false;
          if (powerResult?.type === 'RADAR' && powerResult.revealed) {
              // powerResult reveals specific coordinates
              isRadarRevealed = powerResult.revealed.some((c:any) => c.x === x && c.y === y);
          }

          return (
            <div 
              key={i} 
              style={{ gridColumn: x + 1, gridRow: y + 1 }}
              onClick={() => {
                if (isMe && powerCell) {
                    socket.emit('game:collectPower', { x, y });
                } else if (!isMe && !incomingShot && canAttackThisOpponent && !isTargeting) {
                    handleAttack(player.id, x, y);
                } else if (!isMe && isTargeting) {
                    if (['SONAR', 'RADAR', 'DEPTH_CHARGE', 'PRECISION_SHOT', 'INTEL', 'EMP'].includes(activePower!)) {
                        socket.emit('game:usePower', { type: activePower, targetId: player.id, x, y });
                        setActivePower(null);
                    }
                }
              }}
              className={`relative ${zIndex} w-6 h-6 md:w-8 md:h-8 border border-white/5 transition-all ${bgColor} 
                ${!isMe && !incomingShot && canAttackThisOpponent && !isTargeting ? 'hover:bg-red-500/50 hover:border-red-400 cursor-crosshair' : ''}
                ${isMe && powerCell ? 'cursor-pointer hover:bg-teal-500/30' : ''}`}
            >
              {isRadarRevealed && !isMe && !cellState && (
                  <div className="absolute inset-0 bg-blue-500/50 border border-blue-400 shadow-[0_0_10px_rgba(0,100,255,0.8)] z-30 flex items-center justify-center">
                     <Radar size={12} className="text-white animate-spin" />
                  </div>
              )}
              {isMe && powerCell && (
                  <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-teal-400/50 shadow-[0_0_8px_rgba(0,255,255,0.8)] animate-[ping_2s_ease-in-out_infinite] mix-blend-screen" />
              )}
            </div>
          );
        })}
        {/* Render Ships as Graphics */}
        {(isMe ? myFleet : player.publicFleet)?.map((ship: any, idx: number) => {
           if (!isMe && !ship.sunk && !player.eliminated) return null;
           if (!isMe && !ship.cells) return null;
           
           const minX = Math.min(...ship.cells.map((c:any) => c.x));
           const maxX = Math.max(...ship.cells.map((c:any) => c.x));
           const minY = Math.min(...ship.cells.map((c:any) => c.y));
           const maxY = Math.max(...ship.cells.map((c:any) => c.y));
           const isVerticalPlaced = (maxY - minY) > (maxX - minX);
           
           return (
              <ShipGraphic 
                 key={`ship-${idx}`}
                 type={ship.type} 
                 isVertical={isVerticalPlaced} 
                 cells={ship.cells} 
                 isDestroyed={ship.sunk} 
                 className={isMe && hideShips ? 'hidden' : ''}
              />
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

  useEffect(() => {
    socket.on('game:kicked', () => {
      navigate('/');
    });
    return () => {
      socket.off('game:kicked');
    };
  }, [navigate]);

  return (
    <div className={`min-h-screen p-4 md:p-8 flex flex-col h-screen transition-all duration-1000 ${themeClass}`}>
      {/* Intense Red Flash Overlay when targeted */}
      {isTargetingMe && (
          <div className="fixed inset-0 bg-red-600/30 z-[100] pointer-events-none animate-[pulse_0.75s_ease-in-out_infinite] mix-blend-color-burn shadow-[inset_0_0_300px_rgba(255,0,0,0.8)]" />
      )}
      {/* Flash warning when timer <= 10s */}
      {isMyTurn && timeLeft <= 10 && (
          <div className="fixed inset-0 bg-yellow-600/30 z-[100] pointer-events-none animate-[pulse_0.5s_ease-in-out_infinite] mix-blend-color-dodge shadow-[inset_0_0_200px_rgba(255,200,0,0.8)] flex items-center justify-center">
              <h1 className="text-6xl font-black text-white/50 tracking-[1em] rotate-[-5deg]">WARNING</h1>
          </div>
      )}
      {/* Power Collected Popup */}
      {revealedPower && (
          <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
             <div className="flex flex-col items-center bg-navy-900 border-4 border-teal-500 shadow-[0_0_50px_rgba(0,255,200,0.5)] p-8 rounded-2xl transform animate-[bounceIn_0.5s_ease-out]">
                <div className="text-teal-400 mb-4 animate-pulse scale-150">
                    {(() => { const Icon = POWER_DICT[revealedPower.power]?.icon || Zap; return <Icon size={64} />; })()}
                </div>
                <h2 className="text-3xl font-black tracking-widest text-white mb-2">{POWER_DICT[revealedPower.power]?.name || revealedPower.power}</h2>
                <p className="text-teal-300 tracking-widest text-sm text-center max-w-xs">{POWER_DICT[revealedPower.power]?.desc}</p>
             </div>
          </div>
      )}
      {/* Power Result Popup */}
      {powerResult && (
          <div className="fixed bottom-10 right-10 z-[150] pointer-events-none bg-navy-900/90 border-l-4 border-teal-500 shadow-[0_0_30px_rgba(0,255,200,0.3)] p-6 rounded-r-xl transform animate-[slideInRight_0.3s_ease-out]">
              <div className="text-xs text-teal-400 font-bold tracking-widest mb-1 flex items-center gap-2">
                 <Zap size={14} /> TACTICAL INTEL
              </div>
              <div className="text-white font-mono whitespace-pre-wrap">{powerResult.message}</div>
          </div>
      )}
      <header className="flex justify-between items-center mb-8 shrink-0 relative z-20">
        <div className="flex gap-4 items-center">
          <div>
            <h1 className={`text-2xl font-bold tracking-widest ${isMyTurn || isTargetingMe ? 'text-red-500' : 'text-neon-blue'}`}>ARMADA</h1>
            <p className="text-white/50 text-sm tracking-widest">ROUND {round}</p>
          </div>
          <button 
             onClick={() => { socket.emit('room:leave'); navigate('/'); }}
             className="ml-4 px-3 py-1 border border-red-500/50 text-red-400 text-xs font-bold rounded hover:bg-red-500 hover:text-white transition-colors"
          >
             LEAVE MATCH
          </button>
        </div>
        <div className={`px-6 py-2 rounded font-bold tracking-widest border flex items-center gap-4 ${
            isMyTurn ? (timeLeft <= 10 ? 'bg-red-600 text-white border-red-500 shadow-[0_0_30px_rgba(255,0,0,0.8)] animate-pulse' : 'bg-red-950/80 text-white border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)]') 
            : isTargetingMe ? 'bg-red-950/80 text-red-500 border-red-500 animate-[pulse_2s_ease-in-out_infinite]'
            : 'bg-navy-900 text-white/80 border-white/20'
        }`}>
          <span className={`text-xl ${timeLeft <= 10 ? (isMyTurn ? 'text-white' : 'text-red-500 animate-pulse') : 'text-white/70'}`}>
            00:{timeLeft.toString().padStart(2, '0')}
          </span>
          {isMyTurn && <Crosshair size={20} />}
          {isTargetingMe && <ShieldAlert size={20} />}
          {isMyTurn ? (timeLeft <= 10 ? '⚠ WARNING: TURN EXPIRING' : '🎯 YOUR TURN: SELECT TARGET') 
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
           <div className="glass-panel border-4 p-4 rounded-xl mb-6 shadow-xl border-neon-blue/30 w-full flex flex-col items-center">
             {me && renderGrid(me, true)}
             {me?.eliminated && (
                <div className="mt-4 text-neon-red font-bold tracking-widest text-xl text-center py-4 bg-red-900/40 rounded border border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)] w-full uppercase">
                   ☠ SPECTATOR MODE<br/>
                   <span className="text-sm font-normal mt-2 block text-white">YOUR FLEET HAS BEEN DESTROYED</span>
                </div>
             )}
             {me && renderMiniFleet(me)}
             {renderInventory()}
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
                    className={`relative p-4 rounded-xl flex flex-col items-center transition-all duration-300 ease-in-out border-4 ${opp.eliminated ? 'opacity-50 grayscale bg-black/50 border-white/5' : isTargeted ? 'bg-red-900/90 shadow-[0_0_50px_rgba(255,0,0,0.8)] border-red-500 scale-105 z-10 animate-[pulse_1s_ease-in-out_infinite]' : 'glass-panel opacity-80 hover:opacity-100 cursor-pointer border-white/10 hover:border-neon-blue/30'}`}
                 >
                    {isTargeted && (
                        <div className={`absolute -top-4 font-bold tracking-widest px-4 py-1 rounded text-sm flex items-center gap-2 z-20 ${isMyTurn ? 'bg-red-600 text-white shadow-lg' : 'bg-red-950 text-red-500 border border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.8)] animate-pulse'}`}>
                           {isMyTurn ? (
                              <><Crosshair size={16} /> ATTACKING: {opp.nickname}</>
                           ) : (
                              <><ShieldAlert size={16} /> TARGETED BY: {targetingPlayer?.nickname || 'UNKNOWN'}</>
                           )}
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
                    <div className={`transition-all duration-300 flex flex-col items-center w-full ${!isMyTurn && !opp.eliminated ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
                       {renderGrid(opp, false)}
                       {renderMiniFleet(opp)}
                    </div>
                    {opp.eliminated && <div className="mt-2 text-neon-red font-bold">ELIMINATED</div>}
                 </div>
                 )
             })}
           </div>
        </div>
        
        <MemeOverlay />
      </div>
    </div>
  );
}
