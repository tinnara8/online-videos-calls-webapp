import React from 'react';
import './Controls.css';
import { Camera, Mic, Grid, Sidebar, LogOut } from 'lucide-react';

const Controls = ({ isMicOn, isCameraOn, toggleMic, toggleCamera, toggleViewMode }) => {
  return (
    <div className="controls">
      <button onClick={toggleCamera} title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}>
        <Camera className={isCameraOn ? 'icon-active' : 'icon-inactive'} />
      </button>
      <button onClick={toggleMic} title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}>
        <Mic className={isMicOn ? 'icon-active' : 'icon-inactive'} />
      </button>
      <button onClick={() => toggleViewMode('sidebar')} title="Sidebar View">
        <Sidebar />
      </button>
      <button onClick={() => toggleViewMode('grid')} title="Grid View">
        <Grid />
      </button>
      <button onClick={() => (window.location.href = '/')} title="Leave Room">
        <LogOut />
      </button>
    </div>
  );
};

export default Controls;
