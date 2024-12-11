import React from 'react';
import { GameProvider } from './context/GameContext';
import Game from './components/Game';
import './App.css';

function App() {
  return (
    <div className="App">
      <GameProvider>
        <Game />
      </GameProvider>
    </div>
  );
}

export default App;
