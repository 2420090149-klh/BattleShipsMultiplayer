import { create } from 'zustand';

// Assuming we duplicate some types here for the client
export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  color: string;
  ready: boolean;
  connected: boolean;
  shots: any[];
  remainingShips: number;
  eliminated: boolean;
  isHost: boolean;
  fleet?: any[]; // Only populated for the current user during game
}

export interface Room {
  roomId: string;
  hostId: string;
  maxPlayers: number;
  gameState: 'LOBBY' | 'DEPLOYMENT' | 'PLAYING' | 'FINISHED';
  players: Player[];
}

interface GameStore {
  socket: any | null;
  setSocket: (socket: any) => void;
  
  room: Room | null;
  setRoom: (room: Room) => void;

  currentPlayerId: string | null;
  setCurrentPlayerId: (id: string) => void;

  myFleet: any[];
  setMyFleet: (fleet: any[]) => void;

  currentTurnId: string | null;
  setCurrentTurnId: (id: string) => void;

  round: number;
  setRound: (round: number) => void;

  winnerId: string | null;
  setWinnerId: (id: string | null) => void;

  resetStore: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  socket: null,
  setSocket: (socket) => set({ socket }),
  
  room: null,
  setRoom: (room) => set({ room }),

  currentPlayerId: null,
  setCurrentPlayerId: (id) => set({ currentPlayerId: id }),

  myFleet: [],
  setMyFleet: (fleet) => set({ myFleet: fleet }),

  currentTurnId: null,
  setCurrentTurnId: (id) => set({ currentTurnId: id }),

  round: 1,
  setRound: (round) => set({ round }),

  winnerId: null,
  setWinnerId: (id) => set({ winnerId: id }),

  resetStore: () => set({ 
    room: null, 
    myFleet: [], 
    currentTurnId: null, 
    round: 1, 
    winnerId: null 
  }),
}));
