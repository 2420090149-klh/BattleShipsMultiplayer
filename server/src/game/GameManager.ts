import { Socket, Server } from 'socket.io';
import { RoomManager } from './RoomManager';
import { ShipPlacement, AttackResult, Player } from '../types';

export class GameManager {
  constructor(private io: Server, private roomManager: RoomManager) {}

  deployFleet(socket: Socket, data: { fleet: ShipPlacement[] }) {
    console.log(`[deployFleet] Received from ${socket.id}`);
    const room = this.roomManager.getRoomForSocket(socket.id);
    if (!room || room.gameState !== 'DEPLOYMENT') {
        console.log(`[deployFleet] Failed: Room not found or not in DEPLOYMENT state (state: ${room?.gameState})`);
        return;
    }

    const player = room.players.find(p => p.id === socket.id);
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
      // reset ready state for next phase if needed
      room.players.forEach(p => p.ready = false);
      
      console.log(`[deployFleet] All deployed! Starting battle in room ${room.roomId}`);
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

  handleAttack(socket: Socket, data: { targetId: string; x: number; y: number }) {
    const room = this.roomManager.getRoomForSocket(socket.id);
    if (!room || room.gameState !== 'PLAYING') return;

    const currentPlayer = room.players[room.currentTurnIndex];
    if (currentPlayer.id !== socket.id) {
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
    let sunkShip: string | undefined = undefined;

    // Evaluate attack
    for (const ship of targetPlayer.fleet) {
      if (ship.sunk) continue;
      
      const cellIndex = ship.cells.findIndex(c => c.x === data.x && c.y === data.y);
      if (cellIndex !== -1) {
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

    const shotResult = hit ? 'hit' : 'miss';
    
    currentPlayer.shots.push({
        x: data.x,
        y: data.y,
        result: shotResult,
        ...( { targetId: data.targetId } as any )
    });

    if (targetPlayer.remainingShips === 0) {
        targetPlayer.eliminated = true;
        // If they are eliminated, we don't need to track misses against them anymore
        if (!room.turnMisses.includes(targetPlayer.id)) {
             room.turnMisses.push(targetPlayer.id);
        }
    }

    if (shotResult === 'miss') {
        room.turnMisses.push(targetPlayer.id);
    }

    // Check if turn should advance
    const aliveOpponents = room.players.filter(p => p.id !== currentPlayer.id && !p.eliminated);
    const canStillAttack = aliveOpponents.some(opp => !room.turnMisses.includes(opp.id));

    let nextTurnIndex = room.currentTurnIndex;
    
    if (!canStillAttack) {
        // Advance turn
        room.turnMisses = []; // Reset misses for the next player
        for(let i=1; i <= room.players.length; i++) {
            const checkIndex = (room.currentTurnIndex + i) % room.players.length;
            if (!room.players[checkIndex].eliminated) {
                nextTurnIndex = checkIndex;
                if (checkIndex < room.currentTurnIndex) {
                    room.round += 1;
                }
                break;
            }
        }
        room.currentTurnIndex = nextTurnIndex;
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

    if (alivePlayers.length <= 1) {
        room.gameState = 'FINISHED';
        this.io.to(room.roomId).emit('game:over', {
            winner: alivePlayers[0]?.id || null,
            room: this.roomManager.sanitizeRoom(room)
        });
    }
  }
}
