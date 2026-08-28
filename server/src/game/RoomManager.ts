import { Socket } from 'socket.io';
import { Room, Player } from '../types';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, string> = new Map();

  createRoom(socket: Socket, data: { nickname: string; avatar: string; color: string; maxPlayers: number }) {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const host: Player = {
      id: socket.id,
      socketId: socket.id,
      nickname: data.nickname,
      avatar: data.avatar,
      color: data.color,
      ready: false,
      connected: true,
      fleet: [],
      shots: [],
      remainingShips: 0,
      eliminated: false,
      isHost: true
    };

    const room: Room = {
      roomId,
      hostId: socket.id,
      players: [host],
      maxPlayers: data.maxPlayers || 6,
      gameState: 'LOBBY',
      currentTurnIndex: 0,
      turnMisses: [],
      round: 1,
      createdAt: Date.now()
    };

    this.rooms.set(roomId, room);
    this.socketToRoom.set(socket.id, roomId);
    socket.join(roomId);

    socket.emit('room:joined', this.sanitizeRoom(room));
  }

  joinRoom(socket: Socket, data: { roomId: string; nickname: string; avatar: string; color: string }) {
    const room = this.rooms.get(data.roomId);
    
    if (!room) {
      return socket.emit('room:error', { message: 'SIGNAL LOST: Room not found' });
    }
    
    if (room.players.length >= room.maxPlayers) {
      return socket.emit('room:error', { message: 'THE ARMADA IS AT CAPACITY' });
    }

    if (room.gameState !== 'LOBBY') {
      return socket.emit('room:error', { message: 'MATCH ALREADY IN PROGRESS' });
    }

    const player: Player = {
      id: socket.id,
      socketId: socket.id,
      nickname: data.nickname,
      avatar: data.avatar,
      color: data.color,
      ready: false,
      connected: true,
      fleet: [],
      shots: [],
      remainingShips: 0,
      eliminated: false,
      isHost: false
    };

    room.players.push(player);
    this.socketToRoom.set(socket.id, room.roomId);
    socket.join(room.roomId);

    socket.emit('room:joined', this.sanitizeRoom(room));
    socket.to(room.roomId).emit('room:update', this.sanitizeRoom(room));
  }

  leaveRoom(socket: Socket) {
    this.removePlayer(socket.id, socket);
  }

  setPlayerReady(socket: Socket, ready: boolean) {
    const room = this.getRoomForSocket(socket.id);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = ready;
      socket.to(room.roomId).emit('room:update', this.sanitizeRoom(room));
      // send to sender as well to confirm
      socket.emit('room:update', this.sanitizeRoom(room));
    }
  }

  startMatch(socket: Socket, io: any) {
    const room = this.getRoomForSocket(socket.id);
    if (!room || room.hostId !== socket.id) return;

    if (room.players.length < 2) {
      return socket.emit('room:error', { message: 'Need at least 2 commanders to start.' });
    }

    const allReady = room.players.every(p => p.ready);
    if (!allReady) {
      return socket.emit('room:error', { message: 'Not all commanders are ready.' });
    }

    room.gameState = 'DEPLOYMENT';
    room.players.forEach(p => p.ready = false);
    io.to(room.roomId).emit('room:update', this.sanitizeRoom(room));
  }

  handleDisconnect(socket: Socket, io: any) {
    const room = this.getRoomForSocket(socket.id);
    if (!room) return;

    if (room.gameState === 'LOBBY' || room.gameState === 'DEPLOYMENT') {
      this.removePlayer(socket.id, socket);
      io.to(room.roomId).emit('room:update', this.sanitizeRoom(room));
    } else {
      // In game - mark as disconnected but don't remove
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.connected = false;
        io.to(room.roomId).emit('game:playerDisconnected', { playerId: player.id });
      }
    }
  }

  private removePlayer(socketId: string, socket: Socket) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socketId);
    this.socketToRoom.delete(socketId);
    socket.leave(roomId);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
    } else if (room.hostId === socketId) {
      // reassign host
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    }
  }

  getRoomForSocket(socketId: string): Room | undefined {
    const roomId = this.socketToRoom.get(socketId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  getRoom(roomId: string): Room | undefined {
      return this.rooms.get(roomId);
  }

  sanitizeRoom(room: Room) {
    // Return room without secret fleet info
    return {
      roomId: room.roomId,
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      gameState: room.gameState,
      currentTurnIndex: room.currentTurnIndex,
      turnMisses: room.turnMisses,
      players: room.players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        color: p.color,
        ready: p.ready,
        connected: p.connected,
        shots: p.shots,
        remainingShips: p.remainingShips,
        eliminated: p.eliminated,
        isHost: p.isHost
      }))
    };
  }
}
