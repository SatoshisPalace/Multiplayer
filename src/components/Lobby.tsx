import React, { useState } from 'react';

interface LobbyProps {
  onStartGame: (roomCode: string, isHost: boolean) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onStartGame }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = () => {
    if (!playerName) {
      setError('Please enter your name');
      return;
    }
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(newRoomCode);
    setIsHost(true);
    onStartGame(newRoomCode, true);
  };

  const handleJoinRoom = () => {
    if (!playerName) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode) {
      setError('Please enter a room code');
      return;
    }
    setError('');
    onStartGame(roomCode.toUpperCase(), false);
  };

  return (
    <div className="lobby">
      <h2>Game Lobby</h2>
      {error && <div className="error">{error}</div>}
      <div>
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
      </div>
      {!isHost ? (
        <div>
          <button onClick={handleCreateRoom}>Create Room</button>
          <div>
            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button onClick={handleJoinRoom}>Join Room</button>
          </div>
        </div>
      ) : (
        <div>
          <h3>Room Code: {roomCode}</h3>
          <p>Share this code with your friend to join the game!</p>
        </div>
      )}
    </div>
  );
};

export default Lobby;
