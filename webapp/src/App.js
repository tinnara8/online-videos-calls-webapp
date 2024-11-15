import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import './App.css';

const socket = io('http://192.168.21.38:5000'); // เปลี่ยนเป็น IP ของคุณสำหรับการทดสอบบนเครื่องอื่น

function App() {
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [peers, setPeers] = useState([]);
  const [socketId, setSocketId] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [internetSpeed, setInternetSpeed] = useState(0);
  const userVideo = useRef();
  const peersRef = useRef([]);
  const videoStream = useRef();

  useEffect(() => {
    socket.on('connect', () => {
      setSocketId(socket.id);
    });

    socket.on('update-online-users', (count) => {
      setOnlineUsers(count);
    });

    async function getMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          videoStream.current = stream;
          if (userVideo.current) {
            userVideo.current.srcObject = stream;
          }
          console.log("Camera and microphone access granted");
        } else {
          console.error("Media devices are not supported in this browser.");
          alert("เบราว์เซอร์ของคุณไม่รองรับการใช้งานกล้องและไมโครโฟน กรุณาใช้เบราว์เซอร์ Chrome, Firefox หรือ Edge รุ่นใหม่");
        }
      } catch (err) {
        if (err.name === "NotAllowedError") {
          alert("กรุณาอนุญาตการเข้าถึงกล้องและไมโครโฟน");
          console.error("Permission denied for camera and microphone");
        } else if (err.name === "NotFoundError") {
          alert("ไม่พบกล้องหรือไมโครโฟน กรุณาตรวจสอบอุปกรณ์");
          console.error("No camera or microphone found");
        } else if (err.name === "NotReadableError") {
          alert("ไม่สามารถเข้าถึงกล้องหรือไมโครโฟนได้ อาจมีแอปพลิเคชันอื่นกำลังใช้งานอยู่");
          console.error("Camera or microphone is already in use");
        } else {
          alert("เกิดข้อผิดพลาดในการเข้าถึงกล้องและไมโครโฟน");
          console.error("Error accessing media devices", err);
        }
      }
    }


    getMedia();

    const calculateInternetSpeed = () => {
      const startTime = new Date().getTime();
      const img = new Image();
      img.onload = () => {
        const endTime = new Date().getTime();
        const duration = (endTime - startTime) / 1000;
        const bitsLoaded = 500000 * 8;
        const speedBps = bitsLoaded / duration;
        const speedKbps = speedBps / 1024;
        setInternetSpeed(Math.round(speedKbps));
      };
      img.src = "https://upload.wikimedia.org/wikipedia/commons/3/3f/Placeholder_view_vector.svg?time=" + startTime;
    };

    const speedInterval = setInterval(calculateInternetSpeed, 2000);

    socket.on('user-joined', (userId) => {
      const peer = createPeer(userId, socket.id, videoStream.current);
      peersRef.current.push({ peerID: userId, peer });
      setPeers((prevPeers) => [...prevPeers, peer]);
    });

    socket.on('receive-signal', (data) => {
      const peer = addPeer(data.signal, data.callerId, videoStream.current);
      peersRef.current.push({ peerID: data.callerId, peer });
      setPeers((prevPeers) => [...prevPeers, peer]);
    });

    socket.on('receive-return-signal', (data) => {
      const item = peersRef.current.find((p) => p.peerID === data.id);
      if (item) {
        item.peer.signal(data.signal);
      }
    });

    socket.on('receive-message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      clearInterval(speedInterval);
      if (videoStream.current) {
        videoStream.current.getTracks().forEach((track) => track.stop());
      }
      socket.off('user-joined');
      socket.off('receive-signal');
      socket.off('receive-return-signal');
      socket.off('receive-message');
    };
  }, []);

  const createPeer = (userToSignal, callerId, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on('signal', (signal) => {
      socket.emit('send-signal', { userToSignal, callerId, signal });
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerId, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on('signal', (signal) => {
      socket.emit('return-signal', { signal, callerId });
    });
    peer.signal(incomingSignal);
    return peer;
  };

  const joinRoom = () => {
    if (roomId !== '') {
      socket.emit('join-room', roomId);
      setJoined(true);
    }
  };

  const joinOwnRoom = () => {
    socket.emit('join-room', socketId);
    setRoomId(socketId);
    setJoined(true);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?roomId=${socketId}`);
    alert("Room link copied to clipboard!");
  };

  const sendMessage = () => {
    if (message.trim() !== '') {
      socket.emit('send-message', roomId, message);
      setMessages((prevMessages) => [...prevMessages, { message, sender: 'You' }]);
      setMessage('');
    }
  };

  return (
    <div className="app-container">
      <h1 className="title">MDES Meet - Online Video Calls</h1>
      <video ref={userVideo} autoPlay playsInline muted className="background-video" />
      {!joined ? (
        <div className="join-container">
          <div className="room-info">
            <p>Room ID ของคุณ: <strong onClick={copyLink} style={{ cursor: 'pointer' }}>{socketId}</strong></p>
            <button className="btn qr-btn" onClick={() => setShowQRCode(!showQRCode)}>
              {showQRCode ? "ซ่อน QR Code" : "แชร์ QR Code"}
            </button>
            {showQRCode && (
              <div className="qr-code">
                <QRCodeCanvas value={`${window.location.origin}/?roomId=${socketId}`} />
              </div>
            )}
          </div>
          <input
            type="text"
            className="input-field"
            placeholder="ใส่รหัสห้องเพื่อเข้าร่วมห้องอื่น"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button className="btn join-btn" onClick={joinRoom}>เข้าร่วมห้อง</button>
          <button className="btn own-room-btn" onClick={joinOwnRoom}>เข้าห้องของตัวเอง</button>
        </div>
      ) : (
        <div className="video-container">
          <h3>Connected to Room: {roomId}</h3>
          <div className="videos">
            <video ref={userVideo} autoPlay playsInline muted className="user-video" />
            {peers.map((peer, index) => (
              <Video key={index} peer={peer} />
            ))}
          </div>
          <div className="chat-container">
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index}>
                  <strong>{msg.sender}: </strong>{msg.message}
                </div>
              ))}
            </div>
            <input
              type="text"
              className="chat-input"
              placeholder="พิมพ์ข้อความ..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button className="btn send-btn" onClick={sendMessage}>ส่ง</button>
          </div>
        </div>
      )}
      <footer className="footer">
        <div className="footer-left">ผู้ใช้ออนไลน์ทั้งหมด: {onlineUsers} คน</div>
        <div className="footer-right">ความเร็วอินเทอร์เน็ต: {internetSpeed} Kbps</div>
      </footer>
    </div>
  );
}

const Video = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', (stream) => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return <video ref={ref} autoPlay playsInline className="peer-video" />;
};

export default App;
