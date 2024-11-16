import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// import db from '../server.js'; // เชื่อมต่อ MySQL
import multer from 'multer';
import path from 'path';

import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();


export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: { id: user._id, username, email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering user.' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Invalid password.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, user: { id: user._id, username: user.username, email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in.' });
  }
};

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile_pics');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Profile Picture Upload Route
router.post('/upload-profile-pic', upload.single('profilePic'), async (req, res) => {
  const { userId } = req.body;
  const profilePicPath = `/uploads/profile_pics/${req.file.filename}`;
  
  try {
    await db.query('UPDATE users SET profile_pic = ? WHERE id = ?', [profilePicPath, userId]);
    res.status(200).json({ message: 'Profile picture updated', profilePic: profilePicPath });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile picture' });
  }
});

export default router;
