import React, { useState, useEffect } from 'react';
import { Wifi } from 'lucide-react';
import './Footer.css';

const Footer = ({ onlineUsers }) => {
  const [internetSpeed, setInternetSpeed] = useState(0);

  useEffect(() => {
    const calculateSpeed = () => {
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
      img.src = `https://upload.wikimedia.org/wikipedia/commons/3/3f/Placeholder_view_vector.svg?time=${startTime}`;
    };

    const interval = setInterval(calculateSpeed, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="footer">
      <div className="footer-left">
        Online Users: {onlineUsers}
      </div>
      <div className="footer-right">
        <Wifi /> Speed: {internetSpeed} Kbps
      </div>
    </footer>
  );
};

export default Footer;
