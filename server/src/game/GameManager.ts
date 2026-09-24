import { Socket, Server } from 'socket.io';
import { RoomManager } from './RoomManager';
import { PowerManager } from './PowerManager';
import { MemeManager } from './MemeManager';
import { ShipPlacement, AttackResult, Player } from '../types';

export class GameManager {
  private turnTimers: Map<string, NodeJS.Timeout> = new Map();
  private memeManager: MemeManager = new MemeManager();

  constructor(private io: Server, private roomManager: RoomManager, private powerManager: PowerManager) {}

  public clearTurnTimer(roomId: string) {
      if (this.turnTimers.has(roomId)) {
          clearTimeout(this.turnTimers.get(roomId)!);
          this.turnTimers.delete(roomId);
      }
  }

  private startTurnTimer(room: any) {
      this.clearTurnTimer(room.roomId);
      
      const timer = setTimeout(() => {
          // Time's up! Kick the current player
          const currentPlayer = room.players[room.currentTurnIndex];
          if (currentPlayer && !currentPlayer.eliminated) {
              const socketId = currentPlayer.socketId;
              const socket = this.io.sockets.sockets.get(socketId);
              if (socket) {
                  // Simulate them leaving the match due to AFK
                  socket.emit('game:error', { message: 'YOU WERE KICKED FOR INACTIVITY' });
                  socket.emit('game:kicked');
                  this.handleLeave({ id: socketId } as any); // mock socket just for id
              } else {
                  this.handleLeave({ id: socketId } as any);
              }
          }
      }, 40000); // 40 seconds

      this.turnTimers.set(room.roomId, timer);
  }

  deployFleet(socket: Socket, data: { fleet: ShipPlacement[] }) {
    console.log(`[deployFleet] Received from ${socket.id}`);
    const room = this.roomManager.getRoomForSocket(socket.id);
    if (!room || room.gameState !== 'DEPLOYMENT') {
        console.log(`[deployFleet] Failed: Room not found or not in DEPLOYMENT state (state: ${room?.gameState})`);
        return;
    }

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) {
        console.log(`[deployFleet] Failed: Player not found`);
        return;
    }

    // Validate fleet (Basic validation for now)
    player.fleet = data.fleet;
    player.remainingShips = data.fleet.length;
    player.ready = true; // Use ready flag to indicate deployment finished
    console.log(`[deployFleet] Player ${player.nickname} deployed. Fleet size: ${data.fleet.length}`);

    // Check if all players deployed
    const allDeployed = room.players.every(p => p.ready);
    console.log(`[deployFleet] allDeployed: ${allDeployed}. Ready status: ${room.players.map(p => `${p.nickname}:${p.ready}`).join(', ')}`);
    if (allDeployed) {
      room.gameState = 'PLAYING';
      this.powerManager.generatePowerCells(room);
      // reset ready state for next phase if needed
      room.players.forEach(p => p.ready = false);
      room.turnStartTime = Date.now();
      
      console.log(`[deployFleet] All deployed! Starting battle in room ${room.roomId}`);
      this.startTurnTimer(room);
      this.io.to(room.roomId).emit('game:startBattle', {
        gameState: room.gameState,
        currentTurnId: room.players[room.currentTurnIndex].id,
        round: room.round,
        room: this.roomManager.sanitizeRoom(room)
      });
    } else {
        // notify others that a player is ready
        this.io.to(room.roomId).emit('game:playerReady', { playerId: player.id });
    }
  }

  handleSetTarget(socket: Socket, data: { targetId: string | null }) {
    const room = this.roomManager.getRoomForSocket(socket.id);
    if (!room || room.gameState !== 'PLAYING') return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    // Only allow setting target if it's the player's turn
    if (room.players[room.currentTurnIndex].id !== player.id) return;

    room.currentTargetId = data.targetId;
    this.io.to(room.roomId).emit('room:update', this.roomManager.sanitizeRoom(room));
  }

  public advanceTurn(room: any): number {
      room.turnMisses = []; // Reset misses for the next player
      let nextTurnIndex = room.currentTurnIndex;
      for(let i=1; i <= room.players.length; i++) {
          const checkIndex = (room.currentTurnIndex + i) % room.players.length;
          if (!room.players[checkIndex].eliminated) {
              nextTurnIndex = checkIndex;
              if (checkIndex <= room.currentTurnIndex) {
                  room.round += 1;
              }
              break;
          }
      }
      room.currentTurnIndex = nextTurnIndex;
      room.currentTargetId = null;
      room.turnStartTime = Date.now();
      
      this.powerManager.cleanExpiredEffects(room);
      this.startTurnTimer(room);
      return nextTurnIndex;
  }

  handleLeave(socket: Socket) {
      const room = this.roomManager.getRoomForSocket(socket.id);
      if (!room || room.gameState !== 'PLAYING') return;
      
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex === -1) return;
      const player = room.players[playerIndex];
      
      if (!player.eliminated) {
          player.eliminated = true;
          player.remainingShips = 0;
          
          let nextTurnId = room.players[room.currentTurnIndex].id;
          // If it was their turn, advance
          if (room.currentTurnIndex === playerIndex) {
              const nextTurnIndex = this.advanceTurn(room);
              nextTurnId = room.players[nextTurnIndex].id;
          }
          
          this.io.to(room.roomId).emit('game:attackResult', {
              x: -1, y: -1, result: 'miss', targetId: player.id, attackerId: player.id, sunkShip: undefined, eliminatedTarget: true, nextTurnId, room: this.roomManager.sanitizeRoom(room)
          });
          
          // Check win condition
          const alivePlayers = room.players.filter(p => !p.eliminated);
          if (alivePlayers.length <= 1) {
              this.clearTurnTimer(room.roomId);
              room.gameState = 'FINISHED';
              this.io.to(room.roomId).emit('game:over', {
                  winner: alivePlayers[0]?.id || null,
                  room: this.roomManager.sanitizeRoom(room)
              });
          }
      }
  }

  handleAttack(socket: Socket, data: { targetId: string; x: number; y: number }) {
    const room = this.roomManager.getRoomForSocket(socket.id);
    if (!room || room.gameState !== 'PLAYING') return;

    const currentPlayer = room.players[room.currentTurnIndex];
    if (currentPlayer.socketId !== socket.id) {
      return socket.emit('game:error', { message: 'AWAITING COMMAND (Not your turn)' });
    }

    const targetPlayer = room.players.find(p => p.id === data.targetId);
    if (!targetPlayer || targetPlayer.eliminated) {
        return socket.emit('game:error', { message: 'INVALID TARGET' });
    }

    if (room.turnMisses.includes(targetPlayer.id)) {
        return socket.emit('game:error', { message: 'YOU ALREADY MISSED THIS TARGET THIS ROUND' });
    }

    // Check for duplicate attack
    const alreadyAttacked = currentPlayer.shots.some(
        s => s.x === data.x && s.y === data.y && (s as any).targetId === data.targetId
    );
    if (alreadyAttacked) {
        return socket.emit('game:error', { message: 'COORDINATES ALREADY STRUCK' });
    }

    let hit = false;
    let blocked = false;
    let sunkShip: string | undefined = undefined;

    // Evaluate attack
    for (const ship of targetPlayer.fleet) {
      if (ship.sunk) continue;
      
      const cellIndex = ship.cells.findIndex(c => c.x === data.x && c.y === data.y);
      if (cellIndex !== -1) {
        const shieldIndex = room.activeEffects.findIndex(e => e.type === 'SHIELD' && e.targetId === targetPlayer.id);
        if (shieldIndex !== -1) {
            room.activeEffects.splice(shieldIndex, 1);
            blocked = true;
            break; // Blocked, no damage
        }

        hit = true;
        ship.hits.push({ x: data.x, y: data.y });
        
        if (ship.hits.length === ship.cells.length) {
          ship.sunk = true;
          sunkShip = ship.type;
          targetPlayer.remainingShips -= 1;
        }
        break;
      }
    }

    const shotResult = blocked ? 'blocked' : hit ? 'hit' : 'miss';
    
    currentPlayer.shots.push({
        x: data.x,
        y: data.y,
        result: shotResult,
        ...( { targetId: data.targetId } as any )
    });

    if (targetPlayer.remainingShips === 0) {
        targetPlayer.eliminated = true;
        if (!room.turnMisses.includes(targetPlayer.id)) {
             room.turnMisses.push(targetPlayer.id);
        }
    }

    if (shotResult === 'miss' || shotResult === 'blocked') {
        room.turnMisses.push(targetPlayer.id);
    }

    // Check if turn should advance
    const aliveOpponents = room.players.filter(p => p.id !== currentPlayer.id && !p.eliminated);
    const canStillAttack = aliveOpponents.some(opp => !room.turnMisses.includes(opp.id));

    let nextTurnIndex = room.currentTurnIndex;
    
    if (!canStillAttack) {
        if (currentPlayer.bonusAttacks > 0) {
            currentPlayer.bonusAttacks -= 1;
            room.turnMisses = []; // Reset misses to grant another full attack turn
        } else {
            nextTurnIndex = this.advanceTurn(room);
        }
    }

    const alivePlayers = room.players.filter(p => !p.eliminated);
    
    const result: AttackResult = {
        x: data.x,
        y: data.y,
        result: shotResult,
        targetId: targetPlayer.id,
        attackerId: currentPlayer.id,
        sunkShip,
        eliminatedTarget: targetPlayer.eliminated,
        nextTurnId: room.players[nextTurnIndex].id,
        room: this.roomManager.sanitizeRoom(room)
    };

    this.io.to(room.roomId).emit('game:attackResult', result);

    // Evaluate Meme Reaction
    let memeCategory: 'hit' | 'miss' | 'ship-destroyed' | 'eliminated' | 'victory' | null = null;
    if (alivePlayers.length <= 1) {
        memeCategory = 'victory';
    } else if (targetPlayer.eliminated) {
        memeCategory = 'eliminated';
    } else if (sunkShip) {
        memeCategory = 'ship-destroyed';
    } else if (shotResult === 'hit') {
        memeCategory = 'hit';
    } else if (shotResult === 'miss') {
        memeCategory = 'miss';
    }

    if (memeCategory) {
        const reactionId = this.memeManager.evaluateEvent(memeCategory);
        if (reactionId) {
            this.io.to(room.roomId).emit('game:memeReaction', {
                reactionId,
                category: memeCategory,
                triggeredBy: currentPlayer.nickname,
                targetPlayer: targetPlayer.nickname,
                timestamp: Date.now()
            });
        }
    }

    if (alivePlayers.length <= 1) {
        this.clearTurnTimer(room.roomId);
        room.gameState = 'FINISHED';
        this.io.to(room.roomId).emit('game:over', {
            winner: alivePlayers[0]?.id || null,
            room: this.roomManager.sanitizeRoom(room)
        });
    }
  }
}
