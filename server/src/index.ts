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
  console.log(`User connected: ${socket.id}`);

  // Room Events
  socket.on('room:create', (data) => {
    roomManager.createRoom(socket, data);
  });

  socket.on('room:join', (data) => {
    roomManager.joinRoom(socket, data);
  });

  socket.on('room:leave', () => {
    roomManager.leaveRoom(socket);
  });

  socket.on('room:ready', (data) => {
    roomManager.setPlayerReady(socket, data);
  });

  socket.on('room:start', () => {
    roomManager.startMatch(socket, io);
  });

  // Game Events
  socket.on('game:deploy', (data) => {
    gameManager.deployFleet(socket, data);
  });

  socket.on('game:attack', (data) => {
    gameManager.handleAttack(socket, data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    roomManager.handleDisconnect(socket, io);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
