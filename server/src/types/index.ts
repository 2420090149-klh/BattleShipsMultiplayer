export interface Player {
  id: string;
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
}

export interface Room {
  roomId: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  gameState: 'LOBBY' | 'DEPLOYMENT' | 'PLAYING' | 'FINISHED';
  currentTurnIndex: number;
  turnMisses: string[]; // targetIds that the current player has missed this turn
  round: number;
  createdAt: number;
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
}

export interface AttackResult {
  x: number;
  y: number;
  result: 'hit' | 'miss';
  targetId: string;
  attackerId: string;
  sunkShip?: string;
  eliminatedTarget?: boolean;
  nextTurnId: string;
  room?: any;
}
