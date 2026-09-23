import { Server, Socket } from 'socket.io';
import { RoomManager } from './RoomManager';
import { Room, Player, PowerType, PowerCell, Coordinate } from '../types';

export class PowerManager {
  constructor(private io: Server, private roomManager: RoomManager) {}

  public generatePowerCells(room: Room) {
    const POWER_TYPES: PowerType[] = [
      'SONAR', 'DOUBLE_STRIKE', 'RADAR', 'SHIELD', 
      'DEPTH_CHARGE', 'PRECISION_SHOT', 'GHOST_FLEET', 
      'RELOCATION', 'INTEL', 'EMP'
    ];

    room.players.forEach(player => {
      // Find empty cells
      const emptyCells: Coordinate[] = [];
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          const isOccupied = player.fleet.some(ship => ship.cells.some(c => c.x === x && c.y === y));
          if (!isOccupied) {
            emptyCells.push({ x, y });
          }
        }
      }

      // Shuffle and pick 3
      this.shuffleArray(emptyCells);
      const selectedCells = emptyCells.slice(0, 3);
      
      player.powerCells = selectedCells.map(cell => {
        const randomPower = POWER_TYPES[Math.floor(Math.random() * POWER_TYPES.length)];
        return {
          x: cell.x,
          y: cell.y,
          power: randomPower,
          collected: false
        };
      });
      player.inventory = [];
    });
  }

  public handleCollectPower(socket: Socket, data: { x: number, y: number }) {
    const room = this.roomManager.getRoomForSocket(socket.id);
    if (!room || room.gameState !== 'PLAYING') return;
    
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.eliminated) return;

    const cell = player.powerCells.find(pc => pc.x === data.x && pc.y === data.y);
    if (cell && !cell.collected) {
      cell.collected = true;
      player.inventory.push(cell.power);
      
      // Notify player they got a power
      socket.emit('game:powerCollected', { x: data.x, y: data.y, power: cell.power });
      // Update room for everyone (will sync that cell is collected, removing shimmer)
      this.io.to(room.roomId).emit('room:update', this.roomManager.sanitizeRoom(room));
    }
  }

  public handleUsePower(socket: Socket, data: { type: PowerType, targetId?: string, x?: number, y?: number, newCells?: Coordinate[] }, advanceTurnCb: (room: Room) => void, clearTimerCb: (roomId: string) => void) {
    const room = this.roomManager.getRoomForSocket(socket.id);
    if (!room || room.gameState !== 'PLAYING') return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.eliminated) return;

    if (room.players[room.currentTurnIndex].id !== player.id) {
        return socket.emit('game:error', { message: 'NOT YOUR TURN' });
    }

    const hasEMP = room.activeEffects.some(e => e.type === 'EMP' && e.targetId === player.id);
    if (hasEMP) {
        return socket.emit('game:error', { message: 'POWERS DISABLED BY EMP STRIKE' });
    }

    const powerIndex = player.inventory.indexOf(data.type);
    if (powerIndex === -1) {
        return socket.emit('game:error', { message: 'POWER NOT FOUND IN INVENTORY' });
    }

    player.inventory.splice(powerIndex, 1);
    
    let endTurn = false;

    switch (data.type) {
      case 'DOUBLE_STRIKE':
        player.bonusAttacks = (player.bonusAttacks || 0) + 1;
        socket.emit('game:powerResult', { type: 'DOUBLE_STRIKE', message: 'DOUBLE STRIKE ACTIVATED' });
        break;

      case 'SHIELD':
      case 'GHOST_FLEET':
      case 'EMP':
        this.applyActiveEffect(room, player, data.type, data.targetId);
        if (data.type === 'EMP') endTurn = true;
        socket.emit('game:powerResult', { type: data.type, message: `${data.type.replace('_', ' ')} ACTIVATED` });
        break;

      case 'RELOCATION':
        if (!data.newCells || data.newCells.length === 0) return socket.emit('game:error', { message: 'INVALID RELOCATION' });
        this.handleRelocation(room, player, data.newCells);
        socket.emit('game:powerResult', { type: 'RELOCATION', message: 'EMERGENCY RELOCATION COMPLETE' });
        endTurn = true;
        break;

      case 'SONAR':
        if (!data.targetId || data.x === undefined || data.y === undefined) return;
        this.handleSonar(room, socket, data.targetId, data.x, data.y);
        endTurn = true;
        break;

      case 'RADAR':
        if (!data.targetId || data.x === undefined || data.y === undefined) return;
        this.handleRadar(room, socket, data.targetId, data.x, data.y);
        endTurn = true;
        break;

      case 'INTEL':
        if (!data.targetId) return;
        this.handleIntel(room, socket, data.targetId);
        endTurn = true;
        break;
        
      case 'PRECISION_SHOT':
      case 'DEPTH_CHARGE':
        // These alter attacks and should be routed specifically if needed,
        // but for now we just acknowledge usage or process via custom attack path.
        break;
    }

    this.io.to(room.roomId).emit('room:update', this.roomManager.sanitizeRoom(room));

    if (endTurn) {
        if (player.bonusAttacks > 0) {
            player.bonusAttacks -= 1;
        } else {
            advanceTurnCb(room);
            const alivePlayers = room.players.filter(p => !p.eliminated);
            if (alivePlayers.length <= 1) {
                clearTimerCb(room.roomId);
                room.gameState = 'FINISHED';
                this.io.to(room.roomId).emit('game:over', {
                    winner: alivePlayers[0]?.id || null,
                    room: this.roomManager.sanitizeRoom(room)
                });
            }
        }
    }
  }

  private applyActiveEffect(room: Room, player: Player, type: PowerType, targetId?: string) {
      if (type === 'SHIELD' || type === 'GHOST_FLEET') {
          room.activeEffects.push({
              id: Math.random().toString(36).substring(2, 9),
              type,
              targetId: player.id,
              sourceId: player.id,
              expiresAtRound: room.round + 1,
              expiresAtTurnIndex: room.currentTurnIndex
          });
      } else if (type === 'EMP' && targetId) {
          room.activeEffects.push({
              id: Math.random().toString(36).substring(2, 9),
              type,
              targetId: targetId,
              sourceId: player.id,
              expiresAtRound: room.round + 1,
              expiresAtTurnIndex: room.currentTurnIndex
          });
      }
  }

  private handleRelocation(room: Room, player: Player, newCells: Coordinate[]) {
      const length = newCells.length;
      const ship = player.fleet.find(s => s.cells.length === length && !s.sunk);
      if (!ship) return;
      
      const newHits: Coordinate[] = [];
      ship.hits.forEach(oldHit => {
          const idx = ship.cells.findIndex(c => c.x === oldHit.x && c.y === oldHit.y);
          if (idx !== -1 && newCells[idx]) {
              newHits.push(newCells[idx]);
          }
      });
      ship.cells = newCells;
      ship.hits = newHits;
  }

  private handleSonar(room: Room, socket: Socket, targetId: string, x: number, y: number) {
      const target = room.players.find(p => p.id === targetId);
      if (!target) return;
      
      const hasGhostFleet = room.activeEffects.some(e => e.type === 'GHOST_FLEET' && e.targetId === targetId);
      if (hasGhostFleet) {
          socket.emit('game:powerResult', { type: 'SONAR', message: 'SONAR BLOCKED: TARGET IS A GHOST FLEET' });
          return;
      }
      
      const hasShip = target.fleet.some(ship => ship.cells.some(c => c.x === x && c.y === y));
      socket.emit('game:powerResult', { type: 'SONAR', message: hasShip ? 'SHIP DETECTED' : 'EMPTY WATER', x, y, hasShip });
  }

  private handleRadar(room: Room, socket: Socket, targetId: string, x: number, y: number) {
      const target = room.players.find(p => p.id === targetId);
      if (!target) return;

      const hasGhostFleet = room.activeEffects.some(e => e.type === 'GHOST_FLEET' && e.targetId === targetId);
      if (hasGhostFleet) {
          socket.emit('game:powerResult', { type: 'RADAR', message: 'RADAR BLOCKED: TARGET IS A GHOST FLEET' });
          return;
      }

      const revealed: Coordinate[] = [];
      for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
              const cx = x + dx;
              const cy = y + dy;
              const isOccupied = target.fleet.some(ship => ship.cells.some(c => c.x === cx && c.y === cy));
              if (isOccupied) revealed.push({ x: cx, y: cy });
          }
      }
      socket.emit('game:powerResult', { type: 'RADAR', message: 'RADAR SWEEP COMPLETE', revealed, x, y });
  }

  private handleIntel(room: Room, socket: Socket, targetId: string) {
      const target = room.players.find(p => p.id === targetId);
      if (!target) return;

      const hasGhostFleet = room.activeEffects.some(e => e.type === 'GHOST_FLEET' && e.targetId === targetId);
      if (hasGhostFleet) {
          socket.emit('game:powerResult', { type: 'INTEL', message: 'INTEL BLOCKED: TARGET IS A GHOST FLEET' });
          return;
      }
      
      const hitShips = target.fleet.filter(s => s.hits.length > 0 && !s.sunk);
      if (hitShips.length === 0) {
          socket.emit('game:powerResult', { type: 'INTEL', message: 'NO DAMAGED SHIPS FOUND' });
          return;
      }
      
      const ship = hitShips[Math.floor(Math.random() * hitShips.length)];
      socket.emit('game:powerResult', { 
          type: 'INTEL', 
          message: `TARGET SHIP: ${ship.type.toUpperCase()}\nSIZE: ${ship.length} CELLS\nDAMAGE: ${ship.hits.length} / ${ship.length}` 
      });
  }

  public cleanExpiredEffects(room: Room) {
      room.activeEffects = room.activeEffects.filter(e => {
          if (e.type === 'SHIELD') return true; // Expires on hit
          if (room.round > e.expiresAtRound) return false;
          if (room.round === e.expiresAtRound && room.currentTurnIndex >= e.expiresAtTurnIndex) return false;
          return true;
      });
  }

  private shuffleArray(array: any[]) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  }
}
