import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

const Lobby: React.FC = () => {
  const [joinInput, setJoinInput] = useState('');
  const {
    playerName,
    setPlayerName,
    createGame,
    joinGame,
    connectionData,
    gameStarted,
    players,
    localId
  } = useGame();

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      alert('Please enter your name first!');
      return;
    }
    createGame();
  };

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      alert('Please enter your name first!');
      return;
    }
    if (!joinInput.trim()) {
      alert('Please enter connection data to join a game!');
      return;
    }
    joinGame(joinInput);
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1>Game Lobby</h1>

      {/* Player Name Input */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Enter Your Name</h3>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Your name"
          style={{
            padding: '8px',
            fontSize: '16px',
            width: '200px',
            marginRight: '10px'
          }}
        />
      </div>

      {/* Create Game Section */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Create New Game</h3>
        <button
          onClick={handleCreateGame}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Create Game
        </button>
      </div>

      {/* Join Game Section */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Join Existing Game</h3>
        <textarea
          value={joinInput}
          onChange={(e) => setJoinInput(e.target.value)}
          placeholder="Paste connection data here"
          style={{
            width: '100%',
            height: '100px',
            marginBottom: '10px',
            padding: '8px'
          }}
        />
        <button
          onClick={handleJoinGame}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Join Game
        </button>
      </div>

      {/* Connection Data Display */}
      {connectionData && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Your Connection Data</h3>
          <p style={{ marginBottom: '10px' }}>Share this with other players:</p>
          <textarea
            value={connectionData}
            readOnly
            style={{
              width: '100%',
              height: '100px',
              marginBottom: '10px',
              padding: '8px'
            }}
          />
        </div>
      )}

      {/* Connected Players */}
      {players.size > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Connected Players:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Array.from(players.entries()).map(([id, name]) => (
              <li key={id} style={{ margin: '5px 0' }}>
                {name} {id === localId ? '(You)' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Lobby;
