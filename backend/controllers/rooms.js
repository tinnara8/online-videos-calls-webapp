import Room from '../models/Room.js';

export const createRoom = async (req, res) => {
  const { roomId, hostId } = req.body;

  try {
    const existingRoom = await Room.findOne(roomId);
    if (existingRoom) {
      return res.status(400).json({ message: 'Room already exists.' });
    }

    await Room.create(roomId, hostId);

    res.status(201).json({ message: 'Room created successfully.' });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Error creating room.' });
  }
};

export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll();
    res.status(200).json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Error fetching rooms.' });
  }
};
