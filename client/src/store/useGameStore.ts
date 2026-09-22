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
  publicFleet?: { type: string, sunk: boolean, size: number, hitIndices: number[] }[];
  fleet?: any[]; // Only populated for the current user during game
}

export interface Room {
  roomId: string;
  hostId: string;
  maxPlayers: number;
  gameState: 'LOBBY' | 'DEPLOYMENT' | 'PLAYING' | 'FINISHED';
  players: Player[];
  currentTurnIndex: number;
  turnMisses: string[];
  currentTargetId?: string | null;
  round: number;
}

export interface ChatMessage {
  sender: string;
  senderId: string;
  text: string;
  timestamp: number;
}

interface GameStore {
  socket: any | null;
  setSocket: (socket: any) => void;
  
  sessionId: string;
  setSessionId: (id: string) => void;

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

  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;

  resetStore: () => void;
}

export const useGameStore = create<GameStore>((set) => {
  // Get or create session ID
  let initialSessionId = localStorage.getItem('armada_session_id');
  if (!initialSessionId) {
      initialSessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('armada_session_id', initialSessionId);
  }

  return {
    socket: null,
    setSocket: (socket) => set({ socket }),
    
    sessionId: initialSessionId,
    setSessionId: (id) => {
        localStorage.setItem('armada_session_id', id);
        set({ sessionId: id });
    },

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

  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),

  resetStore: () => set({ 
    room: null, 
    myFleet: [], 
    currentTurnId: null, 
    round: 1, 
    winnerId: null,
    messages: []
  })
  };
});
