import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import Game from './Game';

const Lobby: React.FC = () => {
  const { 
    playerName, 
    setPlayerName, 
    createGame, 
    joinGame,
    connectionData,
    isGameStarted,
    players 
  } = useGame();

  const [joinConnectionData, setJoinConnectionData] = useState('');
  const [showGame, setShowGame] = useState(false);

  if (showGame) {
    return <Game />;
  }

  if (isGameStarted) {
    setShowGame(true);
    return <Game />;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>P2P Game Setup</h2>
      
      {/* Step 1: Enter Name */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Step 1: Enter Your Name</h3>
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          style={{ padding: '8px', width: '200px' }}
        />
      </div>

      {/* Step 2: Create or Join */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Step 2: Create or Join Game</h3>
        <button 
          onClick={createGame}
          disabled={!playerName}
          style={{ 
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: !playerName ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: playerName ? 'pointer' : 'not-allowed'
          }}
        >
          Create New Game
        </button>
      </div>

      {/* Connection Data (shown after creating) */}
      {connectionData && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Step 3: Share this code with your friend</h3>
          <textarea 
            readOnly 
            value={connectionData}
            style={{ 
              width: '100%', 
              height: '100px',
              padding: '8px',
              marginBottom: '10px',
              backgroundColor: '#f5f5f5'
            }}
          />
          <button
            onClick={() => navigator.clipboard.writeText(connectionData)}
            style={{
              padding: '5px 10px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Copy to Clipboard
          </button>
        </div>
      )}

      {/* Join Game Section */}
      <div>
        <h3>Or Join a Game</h3>
        <p>Paste the connection code from your friend:</p>
        <textarea
          placeholder="Paste connection code here"
          value={joinConnectionData}
          onChange={(e) => setJoinConnectionData(e.target.value)}
          style={{ 
            width: '100%', 
            height: '100px',
            padding: '8px',
            marginBottom: '10px'
          }}
        />
        <button 
          onClick={() => joinGame(joinConnectionData)}
          disabled={!playerName || !joinConnectionData}
          style={{ 
            padding: '10px 20px',
            backgroundColor: (!playerName || !joinConnectionData) ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (playerName && joinConnectionData) ? 'pointer' : 'not-allowed'
          }}
        >
          Join Game
        </button>
      </div>

      {/* Connected Players */}
      {players.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Connected Players:</h3>
          <ul>
            {players.map(player => (
              <li key={player.id}>{player.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Lobby;
