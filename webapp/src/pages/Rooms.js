import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import './Room.css';
import Chat from '../components/Chat';
import Controls from '../components/Controls';
import Footer from '../components/Footer';

const socket = io('https://192.168.19.38:5000', {
  withCredentials: true,
  secure: true,
  transports: ['websocket', 'polling'],
});

function Rooms() {
  const { roomId } = useParams();
  const [peers, setPeers] = useState([]);
  const [displayMode, setDisplayMode] = useState('sidebar'); // Modes: sidebar, grid
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const userVideo = useRef();
  const videoStream = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        videoStream.current = stream;

        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }

        socket.emit('join-room', { roomId, userId: socket.id });

        socket.on('user-joined', ({ userId }) => {
          const peer = createPeer(userId, socket.id, stream);
          peersRef.current.push({ peerID: userId, peer });
          setPeers((prevPeers) => [...prevPeers, peer]);
        });

        socket.on('receive-signal', (data) => {
          const peer = addPeer(data.signal, data.callerId, stream);
          peersRef.current.push({ peerID: data.callerId, peer });
          setPeers((prevPeers) => [...prevPeers, peer]);
        });

        socket.on('receive-return-signal', (data) => {
          const item = peersRef.current.find((peer) => peer.peerID === data.id);
          if (item) {
            item.peer.signal(data.signal);
          }
        });

        socket.on('update-online-users', (count) => {
          setOnlineUsers(count);
        });

        socket.on('user-left', (userId) => {
          setPeers((prevPeers) =>
            prevPeers.filter((peer) => peer.peerID !== userId)
          );
          peersRef.current = peersRef.current.filter(
            (peer) => peer.peerID !== userId
          );
        });

        return () => {
          socket.emit('leave-room', { roomId });
          videoStream.current?.getTracks().forEach((track) => track.stop());
          socket.off('user-joined');
          socket.off('receive-signal');
          socket.off('receive-return-signal');
          socket.off('update-online-users');
          socket.off('user-left');
        };
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    getMedia();
  }, [roomId]);

  const createPeer = (userToSignal, callerId, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });
    peer.on('signal', (signal) => {
      socket.emit('send-signal', { userToSignal, callerId, signal });
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerId, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });
    peer.on('signal', (signal) => {
      socket.emit('return-signal', { signal, callerId });
    });
    peer.signal(incomingSignal);
    return peer;
  };

  const toggleMic = () => {
    if (videoStream.current) {
      const audioTrack = videoStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (videoStream.current) {
      const videoTrack = videoStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleViewMode = (mode) => {
    setDisplayMode(mode);
  };

  return (
    <div className="room-container">
      <div className={`video-section ${displayMode}`}>
        <div className="main-video">
          <video
            ref={userVideo}
            autoPlay
            playsInline
            muted
            className="user-video"
          />
        </div>
        <div className="sidebar">
          {peers.map((peer, index) => (
            <ParticipantVideo key={index} peer={peer} />
          ))}
        </div>
      </div>
      <Controls
        isMicOn={isMicOn}
        isCameraOn={isVideoOn}
        toggleMic={toggleMic}
        toggleCamera={toggleVideo}
        toggleViewMode={toggleViewMode}
      />
      <Chat socket={socket} roomId={roomId} />
      <Footer onlineUsers={onlineUsers} />
    </div>
  );
}

const ParticipantVideo = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', (stream) => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return <video ref={ref} autoPlay playsInline className="peer-video" />;
};

export default Rooms;
