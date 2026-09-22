import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { RoomManager } from './game/RoomManager';
import { GameManager } from './game/GameManager';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const roomManager = new RoomManager();
const gameManager = new GameManager(io, roomManager);

io.on('connection', (socket) => {
  const sessionId = socket.handshake.auth.sessionId;
  console.log(`User connected: ${socket.id} (Session: ${sessionId})`);

  if (sessionId) {
      roomManager.attemptReconnect(socket, sessionId);
  }

  // Room Events
  socket.on('room:create', (data) => {
    roomManager.createRoom(socket, data);
  });

  socket.on('room:join', (data) => {
    roomManager.joinRoom(socket, data);
  });

  socket.on('room:leave', () => {
    gameManager.handleLeave(socket);
    roomManager.leaveRoom(socket, io);
  });

  socket.on('room:ready', (data) => {
    roomManager.setPlayerReady(socket, data, io);
  });

  socket.on('room:start', () => {
    roomManager.startMatch(socket, io);
  });

  socket.on('room:rematch', () => {
    roomManager.handleRematch(socket, io);
  });

  socket.on('room:chat', (data) => {
    const room = roomManager.getRoomForSocket(socket.id);
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;
    io.to(room.roomId).emit('room:chat', {
        sender: player.nickname,
        senderId: player.id,
        text: data.text,
        timestamp: Date.now()
    });
  });

  // Game Events
  socket.on('game:deploy', (data) => {
    gameManager.deployFleet(socket, data);
  });

  socket.on('game:attack', (data) => {
    gameManager.handleAttack(socket, data);
  });

  socket.on('game:setTarget', (data) => {
    gameManager.handleSetTarget(socket, data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    gameManager.handleLeave(socket);
    roomManager.handleDisconnect(socket, io);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
