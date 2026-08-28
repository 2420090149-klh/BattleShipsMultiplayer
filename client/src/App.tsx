import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { socket } from './socket';
import { useGameStore } from './store/useGameStore';
import LandingPage from './pages/LandingPage';
import LobbyPage from './pages/LobbyPage';
import DeploymentPage from './pages/DeploymentPage';
import GamePage from './pages/GamePage';
import ResultsPage from './pages/ResultsPage';

function App() {
  const { setSocket, setRoom, setCurrentTurnId, setRound, setWinnerId } = useGameStore();

  useEffect(() => {
    socket.connect();
    setSocket(socket);

    // Global Socket Listeners
    socket.on('room:joined', (room) => {
      setRoom(room);
    });

    socket.on('room:update', (room) => {
      setRoom(room);
    });

    socket.on('room:error', (error) => {
      // In a real app, use a toast system instead of alert
      alert(error.message);
    });

    socket.on('game:startBattle', (data) => {
      setRoom(data.room);
      setCurrentTurnId(data.currentTurnId);
      setRound(data.round);
    });

    socket.on('game:attackResult', (data) => {
      if (data.room) setRoom(data.room);
      setCurrentTurnId(data.nextTurnId);
      
      // We can also play sounds here!
      import('./utils/audio').then(({ audio }) => {
          if (data.result === 'hit') {
             audio.play(data.sunkShip ? 'explosion' : 'explosion'); // Could use a different sound for just hit vs sunk
          } else {
             audio.play('splash');
          }
      });
    });

    socket.on('game:over', (data) => {
      setRoom(data.room);
      setWinnerId(data.winner);
    });

    return () => {
      socket.disconnect();
      socket.off('room:joined');
      socket.off('room:update');
      socket.off('room:error');
      socket.off('game:startBattle');
      socket.off('game:attackResult');
      socket.off('game:over');
    };
  }, [setSocket, setRoom, setCurrentTurnId, setRound, setWinnerId]);

  return (
    <Router>
      <div className="min-h-screen bg-navy-900 text-white overflow-hidden font-sans">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/room/:roomId" element={<LobbyPage />} />
          <Route path="/deploy/:roomId" element={<DeploymentPage />} />
          <Route path="/game/:roomId" element={<GamePage />} />
          <Route path="/results/:roomId" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
