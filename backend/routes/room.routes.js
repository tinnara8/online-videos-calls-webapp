import express from 'express';
import { createRoom, getAllRooms } from '../controllers/rooms.js';

const router = express.Router();

// Route to create a room
router.post('/create', createRoom);

// Route to get all rooms
router.get('/all', getAllRooms);

export default router;
