import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import './Lobby.css';

const Lobby: React.FC = () => {
  const {
    lobbyId,
    isHost,
    players,
    playerName,
    setPlayerName,
    createLobby,
    joinLobby,
    startGame,
    socket
  } = useGame();

  const [joinLobbyId, setJoinLobbyId] = useState('');

  const handleCreateLobby = () => {
    if (!playerName) {
      alert('Please enter your name');
      return;
    }
    createLobby();
  };

  const handleJoinLobby = () => {
    if (!playerName) {
      alert('Please enter your name');
      return;
    }
    if (!joinLobbyId) {
      alert('Please enter a lobby ID');
      return;
    }
    joinLobby(joinLobbyId);
  };

  return (
    <div className="lobby-container">
      <h2>Game Lobby</h2>
      
      {!lobbyId ? (
        <div className="lobby-join">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button onClick={handleCreateLobby}>Create Lobby</button>
          <div className="join-section">
            <input
              type="text"
              placeholder="Enter Lobby ID"
              value={joinLobbyId}
              onChange={(e) => setJoinLobbyId(e.target.value)}
            />
            <button onClick={handleJoinLobby}>Join Lobby</button>
          </div>
        </div>
      ) : (
        <div className="lobby-info">
          <h3>Lobby ID: {lobbyId}</h3>
          <div className="players-list">
            <h4>Players:</h4>
            <ul>
              {players.map(player => (
                <li key={player.id}>
                  {player.name} {isHost && socket && player.id === socket.id ? '(Host)' : ''}
                </li>
              ))}
            </ul>
          </div>
          {isHost && socket && players.length >= 1 && (
            <button onClick={startGame}>Start Game</button>
          )}
        </div>
      )}
    </div>
  );
};

export default Lobby;
