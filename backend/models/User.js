import pool from '../config/database.js';

export const createUser = async (username, email, hashedPassword) => {
  const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  return pool.query(query, [username, email, hashedPassword]);
};

export const findUserByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = ?';
  const [rows] = await pool.query(query, [email]);
  return rows[0];
};
