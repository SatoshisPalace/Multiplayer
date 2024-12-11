import React from 'react';
import { GameProvider } from './context/GameContext';
import Game from './components/Game';
import './App.css';

function App() {
  return (
    <GameProvider>
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        <Game />
      </div>
    </GameProvider>
  );
}

export default App;
