import pool from '../config/database.js';

const Room = {
  create: async (roomId, hostId) => {
    const query = 'INSERT INTO rooms (room_id, host_id) VALUES (?, ?)';
    return pool.query(query, [roomId, hostId]);
  },

  findOne: async (roomId) => {
    const query = 'SELECT * FROM rooms WHERE room_id = ? LIMIT 1';
    const [rows] = await pool.query(query, [roomId]);
    return rows[0]; // Return the first room if it exists
  },

  findAll: async () => {
    const query = 'SELECT * FROM rooms';
    const [rows] = await pool.query(query);
    return rows;
  },
};

export default Room;
