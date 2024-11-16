// src/components/Video.js
import React, { useRef, useEffect } from 'react';

const Video = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', (stream) => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return <video ref={ref} autoPlay playsInline className="peer-video" />;
};

export default Video;
