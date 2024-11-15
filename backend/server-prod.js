import express from 'express';
import https from 'https'; // ใช้ https แทน http
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';

const app = express();

// โหลดใบรับรอง SSL (ใบรับรองต้องอยู่ในโฟลเดอร์ที่กำหนด)
const options = {
  key: fs.readFileSync('/path/to/your/ssl/private-key.pem'), // ใส่ path ของไฟล์ private key
  cert: fs.readFileSync('/path/to/your/ssl/certificate.pem'), // ใส่ path ของไฟล์ใบรับรอง SSL
};

// สร้าง HTTPS server
const server = https.createServer(options, app);

// ตั้งค่า CORS สำหรับ Socket.io
const io = new Server(server, {
  cors: {
    origin: 'https://yourdomain.com', // เปลี่ยนเป็นโดเมนจริงของคุณ เช่น 'https://example.com'
    methods: ['GET', 'POST'],
    credentials: true, // หากต้องการให้ทำงานกับการยืนยันตัวตน
  },
});

app.use(cors({ origin: 'https://yourdomain.com' })); // กำหนด CORS สำหรับ Express เช่นกัน
app.use(express.json());

const rooms = {}; // เพื่อเก็บข้อมูลห้องและสมาชิกในแต่ละห้อง

app.get('/', (req, res) => {
  res.send('Welcome to the Online Video Calls Server!');
});

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  const updateOnlineUsers = () => {
    io.emit('update-online-users', io.engine.clientsCount); // ส่งจำนวนผู้ใช้งานให้ทุก client
  };

  updateOnlineUsers();

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      io.to(roomId).emit('room-users', rooms[roomId]);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
    console.log('user disconnected:', socket.id);
    updateOnlineUsers(); // อัปเดตจำนวนผู้ใช้ออนไลน์เมื่อมีการ disconnect
  });

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(socket.id);
    io.to(roomId).emit('room-users', rooms[roomId]); // แจ้งสมาชิกในห้อง
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      io.to(roomId).emit('room-users', rooms[roomId]); // แจ้งสมาชิกในห้อง
      if (rooms[roomId].length === 0) {
        delete rooms[roomId]; // ลบห้องถ้าไม่มีผู้ใช้อยู่
      }
    }
    console.log(`User ${socket.id} left room: ${roomId}`);
  });

  socket.on('send-message', (roomId, message) => {
    io.to(roomId).emit('receive-message', { message, sender: socket.id });
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on https://yourdomain.com:${PORT}`);
});





// หากใช้ prod conf ใน webapp ให้แก้ app.js เป็น
// import { io } from 'socket.io-client';

// const socket = io('https://yourdomain.com', {
//   secure: true,
//   reconnect: true,
//   rejectUnauthorized: false, // ใช้หากใบรับรองเป็น self-signed
// });
