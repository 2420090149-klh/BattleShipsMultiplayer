export type PowerType = 
  | 'SONAR' 
  | 'DOUBLE_STRIKE' 
  | 'RADAR' 
  | 'SHIELD' 
  | 'DEPTH_CHARGE' 
  | 'PRECISION_SHOT' 
  | 'GHOST_FLEET' 
  | 'RELOCATION' 
  | 'INTEL' 
  | 'EMP';

export interface PowerCell {
  x: number;
  y: number;
  power: PowerType;
  collected: boolean;
}

export interface ActiveEffect {
  id: string; // Unique ID for the effect
  type: PowerType;
  targetId: string;
  sourceId: string;
  expiresAtRound: number;
  expiresAtTurnIndex: number;
}

export interface Player {
  id: string;
  sessionId: string;
  socketId: string;
  nickname: string;
  avatar: string;
  color: string;
  ready: boolean;
  connected: boolean;
  fleet: ShipPlacement[]; // Secret
  shots: Shot[]; // Public
  remainingShips: number;
  eliminated: boolean;
  isHost: boolean;
  powerCells: PowerCell[];
  inventory: PowerType[];
  bonusAttacks: number;
}

export interface Room {
  roomId: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  gameState: 'LOBBY' | 'DEPLOYMENT' | 'PLAYING' | 'FINISHED';
  currentTurnIndex: number;
  turnMisses: string[]; // targetIds that the current player has missed this turn
  turnStartTime?: number;
  currentTargetId?: string | null;
  round: number;
  createdAt: number;
  activeEffects: ActiveEffect[];
}

export interface ShipPlacement {
  id: string;
  type: 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';
  length: number;
  cells: Coordinate[];
  hits: Coordinate[];
  sunk: boolean;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface Shot {
  x: number;
  y: number;
  result: 'hit' | 'miss';
  targetId?: string;
}

export interface AttackResult {
  x: number;
  y: number;
  result: 'hit' | 'miss' | 'blocked';
  targetId: string;
  attackerId: string;
  sunkShip?: string;
  eliminatedTarget?: boolean;
  nextTurnId: string;
  room?: any;
}
