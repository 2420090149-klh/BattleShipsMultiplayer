import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Shuffle, Trash2 } from 'lucide-react';

const GRID_SIZE = 10;
const SHIP_TYPES = [
  { id: 'carrier', name: 'Carrier', length: 5 },
  { id: 'battleship', name: 'Battleship', length: 4 },
  { id: 'cruiser', name: 'Cruiser', length: 3 },
  { id: 'submarine', name: 'Submarine', length: 3 },
  { id: 'destroyer', name: 'Destroyer', length: 2 },
];

export default function DeploymentPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { room, setMyFleet } = useGameStore();
  const [deployed, setDeployed] = useState(false);
  const [waitingForOthers, setWaitingForOthers] = useState(false);

  // Local state for placement
  const [placedShips, setPlacedShips] = useState<any[]>([]);
  const [selectedShipId, setSelectedShipId] = useState<string | null>('carrier');
  const [isVertical, setIsVertical] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (room?.gameState === 'PLAYING') {
        navigate(`/game/${roomId}`);
    }
  }, [room?.gameState, navigate, roomId]);

  const unplacedShips = SHIP_TYPES.filter(s => !placedShips.some(ps => ps.type === s.id));
  const currentShipDef = unplacedShips.find(s => s.id === selectedShipId) || unplacedShips[0];

  useEffect(() => {
      if (currentShipDef && selectedShipId !== currentShipDef.id) {
          setSelectedShipId(currentShipDef.id);
      }
  }, [unplacedShips, selectedShipId, currentShipDef]);

  const canPlaceShip = (x: number, y: number, shipDef: typeof SHIP_TYPES[0], vertical: boolean) => {
    if (vertical && y + shipDef.length > GRID_SIZE) return false;
    if (!vertical && x + shipDef.length > GRID_SIZE) return false;

    for (let i = 0; i < shipDef.length; i++) {
      const cx = vertical ? x : x + i;
      const cy = vertical ? y + i : y;
      if (isCellOccupied(cx, cy)) return false;
    }
    return true;
  };

  const isCellOccupied = (x: number, y: number) => {
    return placedShips.some(ship => ship.cells.some((c: any) => c.x === x && c.y === y));
  };

  const handleCellClick = (x: number, y: number) => {
    if (!currentShipDef) return;

    if (canPlaceShip(x, y, currentShipDef, isVertical)) {
      const cells = [];
      for (let i = 0; i < currentShipDef.length; i++) {
        cells.push({ x: isVertical ? x : x + i, y: isVertical ? y + i : y });
      }
      
      setPlacedShips(prev => [...prev, {
        id: Math.random().toString(),
        type: currentShipDef.id,
        length: currentShipDef.length,
        cells,
        hits: [],
        sunk: false
      }]);
    }
  };

  const generateRandomFleet = () => {
    const newFleet: any[] = [];
    const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

    SHIP_TYPES.forEach(shipDef => {
      let placed = false;
      while (!placed) {
        const vertical = Math.random() > 0.5;
        const x = Math.floor(Math.random() * (vertical ? GRID_SIZE : GRID_SIZE - shipDef.length));
        const y = Math.floor(Math.random() * (vertical ? GRID_SIZE - shipDef.length : GRID_SIZE));
        
        let canPlace = true;
        for (let i = 0; i < shipDef.length; i++) {
          const cx = vertical ? x : x + i;
          const cy = vertical ? y + i : y;
          if (grid[cy][cx]) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          const cells = [];
          for (let i = 0; i < shipDef.length; i++) {
            const cx = vertical ? x : x + i;
            const cy = vertical ? y + i : y;
            grid[cy][cx] = true;
            cells.push({ x: cx, y: cy });
          }
          newFleet.push({
            id: Math.random().toString(),
            type: shipDef.id,
            length: shipDef.length,
            cells,
            hits: [],
            sunk: false
          });
          placed = true;
        }
      }
    });
    setPlacedShips(newFleet);
  };

  const clearFleet = () => {
      setPlacedShips([]);
  };

  const handleDeploy = () => {
    setMyFleet(placedShips);
    socket.emit('game:deploy', { fleet: placedShips });
    setDeployed(true);
    setWaitingForOthers(true);
  };

  // Helper to determine if a cell is part of the current hover preview
  const getHoverState = (x: number, y: number) => {
    if (!currentShipDef || !hoverPos || waitingForOthers) return null;
    
    // Check if within bounds of the hovering ship
    let isHovering = false;
    if (isVertical) {
        if (x === hoverPos.x && y >= hoverPos.y && y < hoverPos.y + currentShipDef.length) {
            isHovering = true;
        }
    } else {
        if (y === hoverPos.y && x >= hoverPos.x && x < hoverPos.x + currentShipDef.length) {
            isHovering = true;
        }
    }

    if (isHovering) {
        return canPlaceShip(hoverPos.x, hoverPos.y, currentShipDef, isVertical) ? 'valid' : 'invalid';
    }
    return null;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <header className="mb-8 w-full max-w-5xl flex justify-between items-end">
         <div>
            <h1 className="text-3xl font-bold tracking-widest text-neon-blue">DEPLOY FLEET</h1>
            <p className="text-white/50 tracking-widest">POSITION YOUR SHIPS FOR COMBAT</p>
         </div>
      </header>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 relative z-10">
          
        {/* Left: The Grid */}
        <div className="glass-panel p-6 rounded-xl flex-shrink-0">
            <div className="grid grid-cols-10 gap-1 bg-navy-800 p-2 rounded border border-white/10"
                 onMouseLeave={() => setHoverPos(null)}>
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                
                const occupiedShip = placedShips.find(ship => ship.cells.some((c: any) => c.x === x && c.y === y));
                const hoverState = getHoverState(x, y);

                let cellClasses = 'w-8 h-8 md:w-12 md:h-12 border transition-colors duration-100 ';
                
                if (occupiedShip) {
                    cellClasses += 'bg-white border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.4)]';
                } else if (hoverState === 'valid') {
                    cellClasses += 'bg-neon-blue/50 border-neon-blue';
                } else if (hoverState === 'invalid') {
                    cellClasses += 'bg-neon-red/50 border-neon-red';
                } else {
                    cellClasses += 'bg-transparent border-white/10 hover:border-white/30';
                }

                return (
                <div 
                    key={i} 
                    onMouseEnter={() => setHoverPos({ x, y })}
                    onClick={() => handleCellClick(x, y)}
                    className={cellClasses}
                ></div>
                );
            })}
            </div>
        </div>

        {/* Right: Controls & Ships */}
        <div className="flex-1 flex flex-col gap-6">
            {!waitingForOthers ? (
                <>
                    <div className="glass-panel p-6 rounded-xl flex-1">
                        <h2 className="text-xl tracking-widest mb-6 border-b border-white/10 pb-2">ARMORY</h2>
                        
                        <div className="space-y-4 mb-8">
                            {SHIP_TYPES.map(ship => {
                                const isPlaced = placedShips.some(ps => ps.type === ship.id);
                                const isSelected = currentShipDef?.id === ship.id;

                                return (
                                    <div 
                                        key={ship.id}
                                        onClick={() => !isPlaced && setSelectedShipId(ship.id)}
                                        className={`p-3 rounded border flex items-center justify-between transition-all ${isPlaced ? 'opacity-30 border-white/10' : isSelected ? 'border-neon-blue bg-neon-blue/10 cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.2)]' : 'border-white/20 cursor-pointer hover:border-white/50'}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold tracking-wider uppercase">{ship.name}</span>
                                            <span className="text-xs text-white/50">{ship.length} CELLS</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {Array.from({length: ship.length}).map((_, i) => (
                                                <div key={i} className={`w-4 h-4 rounded-sm ${isPlaced ? 'bg-white/50' : isSelected ? 'bg-neon-blue' : 'bg-white/80'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="flex gap-4 mb-4">
                            <button 
                                onClick={() => setIsVertical(!isVertical)}
                                className="flex-1 border border-white/20 p-3 rounded flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                            >
                                <RotateCcw size={18} />
                                {isVertical ? 'VERTICAL' : 'HORIZONTAL'}
                            </button>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
                        <div className="flex gap-4">
                            <button 
                                onClick={clearFleet}
                                className="border border-white/20 p-3 rounded hover:bg-neon-red/20 hover:text-neon-red hover:border-neon-red transition-colors flex items-center justify-center"
                                title="Clear Board"
                            >
                                <Trash2 size={20} />
                            </button>
                            <button 
                                onClick={generateRandomFleet}
                                className="flex-1 border border-neon-blue text-neon-blue p-3 rounded flex items-center justify-center gap-2 hover:bg-neon-blue/10 transition-colors"
                            >
                                <Shuffle size={18} />
                                QUICK DEPLOY (RANDOM)
                            </button>
                        </div>

                        <button 
                            onClick={handleDeploy}
                            disabled={placedShips.length < 5}
                            className="w-full bg-neon-blue text-navy-900 font-bold tracking-widest p-4 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                        >
                            CONFIRM DEPLOYMENT
                        </button>
                    </div>
                </>
            ) : (
                <div className="glass-panel p-8 rounded-xl flex-1 flex flex-col items-center justify-center text-center">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full mb-6"
                    />
                    <h2 className="text-2xl font-bold tracking-widest text-neon-blue mb-2">FLEET SECURED</h2>
                    <p className="text-white/50 tracking-widest">AWAITING OTHER COMMANDERS</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
