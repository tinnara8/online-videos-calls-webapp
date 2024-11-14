// webapp/src/App.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);

  const joinRoom = () => {
    if (roomId !== '') {
      socket.emit('join-room', roomId);
      setJoined(true);
    }
  };

  return (
    <div>
      <h2>Simple Video Call</h2>
      {!joined ? (
        <>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </>
      ) : (
        <h3>Connected to Room: {roomId}</h3>
      )}
    </div>
  );
}

export default App;
