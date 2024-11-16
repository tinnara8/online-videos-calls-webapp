import express from 'express';
import https from 'https';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import roomRoutes from './routes/room.routes.js';
import connectDatabase from './config/database.js';

dotenv.config();

// SSL Configuration
const options = {
  key: fs.readFileSync('../localhost+4-key.pem'),
  cert: fs.readFileSync('../localhost+4.pem'),
  // key: fs.readFileSync('../localhost+3-key.pem'),
  // cert: fs.readFileSync('../localhost+3.pem'),
};

const app = express();
const server = https.createServer(options, app);
const io = new Server(server, {
  cors: {
    // origin: '*',
    origin: 'https://192.168.19.38:3000', // Use your HTTPS frontend origin
    methods: ['GET', 'POST'],
    credentials: true,
  },
});


// app.use(cors());
// app.use(cors({
//   origin: 'https://192.168.19.38:3000',
//   methods: ['GET', 'POST', 'OPTIONS'],
//   credentials: true,
// }));


app.use(cors({
  origin: 'https://192.168.19.38:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://192.168.19.38:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json());

// Database Connection
connectDatabase();


// Routes
app.get('/', (req, res) => {
  res.send('Welcome to MDES Meet Backend!');
});
app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);

// WebSocket Events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', ({ roomId }) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
    socket.to(roomId).emit('user-joined', { userId: socket.id });
  });

  socket.on('send-signal', (payload) => {
    io.to(payload.userToSignal).emit('receive-signal', payload);
  });

  socket.on('return-signal', (payload) => {
    io.to(payload.callerId).emit('receive-return-signal', payload);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
