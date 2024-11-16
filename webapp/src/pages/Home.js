import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Footer from '../components/Footer';

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const [socketId, setSocketId] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const videoStream = useRef(null); // Video Stream
  const userVideo = useRef(null); // User's video element
  const navigate = useNavigate();

  useEffect(() => {
    // Generate unique socket ID
    const id = Math.random().toString(36).substring(2, 15);
    setSocketId(id);

    // Request user media
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoStream.current = stream; // Store the stream
        if (userVideo.current) {
          userVideo.current.srcObject = stream; // Assign stream to video element
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera. Please check permissions.');
      }
    };

    initializeCamera();

    return () => {
      // Cleanup video stream on component unmount
      if (videoStream.current) {
        videoStream.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const copyRoomLink = () => {
    const roomLink = `${window.location.origin}/room/${socketId}`;
    navigator.clipboard.writeText(roomLink);
    alert('Room link copied to clipboard!');
  };

  const createRoom = () => {
    navigate(`/room/${socketId}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <div className="home-container">
      {/* Background video */}
      <video ref={userVideo} autoPlay muted playsInline className="background-video" />
      <div className="join-container">
        <h1 className="title">Welcome to MDES Meet</h1>
        <div className="room-info">
          <p>Your Room ID:</p>
          <strong onClick={copyRoomLink} style={{ cursor: 'pointer' }}>
            {socketId}
          </strong>
          <button className="btn qr-btn" onClick={() => setShowQRCode(!showQRCode)}>
            {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
          </button>
          {showQRCode && (
            <div className="qr-code">
              <QRCodeCanvas value={`${window.location.origin}/room/${socketId}`} />
            </div>
          )}
        </div>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="input-field"
        />
        <button className="btn join-btn" onClick={joinRoom}>
          Join Room
        </button>
        <button className="btn create-btn" onClick={createRoom}>
          Create Room
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
