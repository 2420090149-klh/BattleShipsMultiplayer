import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';
import { RotateCcw, Shuffle, Trash2, Shield } from 'lucide-react';

import { ShipGraphic } from '../components/ShipGraphic';

const GRID_SIZE = 10;
const SHIP_TYPES = [
  { id: 'carrier', name: 'CARRIER', shape: [{x:0,y:0}, {x:1,y:0}, {x:2,y:0}, {x:3,y:0}, {x:4,y:0}] },
  { id: 'battleship', name: 'BATTLESHIP', shape: [{x:0,y:0}, {x:1,y:0}, {x:2,y:0}, {x:3,y:0}] },
  { id: 'cruiser', name: 'CRUISER', shape: [{x:0,y:0}, {x:1,y:0}, {x:2,y:0}] },
  { id: 'submarine', name: 'SUBMARINE', shape: [{x:0,y:0}, {x:1,y:0}, {x:2,y:0}] },
  { id: 'destroyer', name: 'DESTROYER', shape: [{x:0,y:0}, {x:1,y:0}] },
];

const rotateShape = (shape: {x:number, y:number}[], isVertical: boolean) => {
  if (!isVertical) return shape;
  // Rotate 90 degrees: (x, y) -> (-y, x)
  const rotated = shape.map(c => ({ x: -c.y, y: c.x }));
  // Normalize so minX and minY are 0
  const minX = Math.min(...rotated.map(c => c.x));
  const minY = Math.min(...rotated.map(c => c.y));
  return rotated.map(c => ({ x: c.x - minX, y: c.y - minY }));
};

export default function DeploymentPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { room, setMyFleet } = useGameStore();
  const [, setDeployed] = useState(false);
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
    const rotated = rotateShape(shipDef.shape, vertical);
    for (const cell of rotated) {
      const cx = x + cell.x;
      const cy = y + cell.y;
      if (cx < 0 || cx >= GRID_SIZE || cy < 0 || cy >= GRID_SIZE) return false;
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
      const rotated = rotateShape(currentShipDef.shape, isVertical);
      const cells: {x: number, y: number}[] = rotated.map(c => ({ x: x + c.x, y: y + c.y }));
      
      setPlacedShips([...placedShips, {
        type: currentShipDef.id,
        cells,
        hits: [],
        sunk: false
      }]);
    }
  };

  const generateRandomFleet = () => {
    let newFleet: any[] = [];
    
    // Helper to check collision with ALREADY PLACED random ships
    const isOccupiedRandom = (x: number, y: number, currentFleet: any[]) => {
      return currentFleet.some(ship => ship.cells.some((c: any) => c.x === x && c.y === y));
    };

    SHIP_TYPES.forEach(shipDef => {
      let placed = false;
      while (!placed) {
        const vertical = Math.random() > 0.5;
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);

        const rotated = rotateShape(shipDef.shape, vertical);
        
        let canPlace = true;
        for (const cell of rotated) {
            const cx = x + cell.x;
            const cy = y + cell.y;
            if (cx < 0 || cx >= GRID_SIZE || cy < 0 || cy >= GRID_SIZE || isOccupiedRandom(cx, cy, newFleet)) {
                canPlace = false;
                break;
            }
        }

        if (canPlace) {
          const cells: {x: number, y: number}[] = rotated.map(c => ({ x: x + c.x, y: y + c.y }));
          newFleet.push({
            type: shipDef.id,
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

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isOccupied = isCellOccupied(x, y);
        
        let isHovered = false;
        let isInvalid = false;
        
        if (hoverPos && currentShipDef && !waitingForOthers) {
          const rotated = rotateShape(currentShipDef.shape, isVertical);
          for (const cell of rotated) {
              if (hoverPos.x + cell.x === x && hoverPos.y + cell.y === y) {
                  isHovered = true;
                  if (!canPlaceShip(hoverPos.x, hoverPos.y, currentShipDef, isVertical)) {
                      isInvalid = true;
                  }
              }
          }
        }

        cells.push(
          <div
            key={`${x}-${y}`}
            style={{ gridColumn: x + 1, gridRow: y + 1 }}
            onMouseEnter={() => setHoverPos({ x, y })}
            onClick={() => handleCellClick(x, y)}
            className={`w-8 h-8 md:w-10 md:h-10 border border-white/10 transition-colors
              ${isOccupied ? '' : ''}
              ${isHovered ? (isInvalid ? 'bg-neon-red/50 cursor-not-allowed' : 'bg-neon-blue/50 cursor-pointer') : 'hover:bg-white/5'}
            `}
          ></div>
        );
      }
    }

    return (
      <div className="relative inline-grid grid-cols-10 gap-0 border-2 border-white/20 bg-navy-900/50 p-2 rounded-xl overflow-hidden" onMouseLeave={() => setHoverPos(null)}>
        {cells}

        {/* Render graphical ships on top */}
        {!waitingForOthers && placedShips.map((ship, idx) => {
            const minX = Math.min(...ship.cells.map((c:any) => c.x));
            const maxX = Math.max(...ship.cells.map((c:any) => c.x));
            const minY = Math.min(...ship.cells.map((c:any) => c.y));
            const maxY = Math.max(...ship.cells.map((c:any) => c.y));
            const isVerticalPlaced = (maxY - minY) > (maxX - minX);

            return (
                <ShipGraphic key={idx} type={ship.type} isVertical={isVerticalPlaced} cells={ship.cells} />
            );
        })}

        {/* Hide ships when waiting for others */}
        {waitingForOthers && (
            <div className="absolute inset-0 bg-navy-950 z-50 flex flex-col items-center justify-center">
                <Shield size={48} className="text-neon-blue mb-4 animate-pulse" />
                <h3 className="text-xl font-bold tracking-widest text-white mb-2 text-center">WAITING FOR OTHER COMMANDERS...</h3>
                <p className="text-[10px] text-white/50 tracking-[0.2em] text-center max-w-[80%] mt-2">
                    YOUR FLEET IS SECURED AND HIDDEN
                </p>
            </div>
        )}
      </div>
    );
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
            {renderGrid()}
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
                                            <span className="text-xs text-white/50">{ship.shape.length} CELLS</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {Array.from({length: ship.shape.length}).map((_, i) => (
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
