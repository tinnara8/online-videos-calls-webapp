import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // เปลี่ยนตาม IP ของเครื่องคุณที่รัน frontend
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
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

//   socket.on('disconnect', () => {
//     for (const roomId in rooms) {
//       rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
//       io.to(roomId).emit('room-users', rooms[roomId]);
//       if (rooms[roomId].length === 0) {
//         delete rooms[roomId];
//       }
//     }
//     console.log('user disconnected:', socket.id);
//     updateOnlineUsers();
//   });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
