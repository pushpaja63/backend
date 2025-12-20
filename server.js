require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// parse JSON
app.use(express.json());

// allow all origins while developing (you can restrict later)
app.use(cors());

// simple request logger
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function authenticate(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/* Register */
app.post('/api/auth/register', async (req, res) => {
  console.log('Register request body:', req.body);
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const [exists] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );

    if (exists.length) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username,email,password) VALUES (?,?,?)',
      [username, email, password]
    );

    const user = { id: result.insertId, username, email };
    const token = createToken(user);

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);                 // 👈 important
    // send error message back so you can see it in frontend (dev only)
    return res.status(500).json({ message: err.message || 'Server error' });
  }
});

/* Login */
app.post('/api/auth/login', async (req, res) => {
  console.log('Login request body:', req.body);
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const userRow = rows[0];
    const match = await bcrypt.compare(password, userRow.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const user = {
      id: userRow.id,
      username: userRow.username,
      email: userRow.email
    };

    const token = createToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

/* Protected profile */
app.get('/api/profile', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

/* health */
app.get('/ping', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));


const pool = require("./db");

(async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ users table ensured");
  } catch (err) {
    console.error("❌ Table creation error:", err.message);
  }
})();
app.get("/ping", (req, res) => {
  res.json({ status: "ok" });
});
