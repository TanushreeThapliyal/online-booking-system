const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Restaurant Booking System');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const { Pool } = require('pg');

// Create a connection pool to the PostgreSQL database
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Tanushree',
    port: 5432, 
  });


// User Registration
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      // Check if the user already exists
      const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userExists.rowCount > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert the user into the database
      const result = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
        [name, email, hashedPassword]
      );
  
      const userId = result.rows[0].id;
  
      res.json({ id: userId, message: 'Registration successful' });
    } catch (error) {
      console.error('Error executing registration:', error);
      res.status(500).json({ error: 'An error occurred' });
    }
  });

// User Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Retrieve the user from the database
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  
      if (result.rowCount === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      const user = result.rows[0];
  
      // Compare the password
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, 'your_secret_key', { expiresIn: '1h' });
  
      // Store session data in the sessions table
    const sessionData = {
        user_id: user.id,
        token: token,
        created_at: new Date().toISOString()
      };
  
      await pool.query('INSERT INTO sessions (user_id, token, created_at) VALUES ($1, $2, $3)', [sessionData.user_id, sessionData.token, sessionData.created_at]);
  
      res.json({ token: token, message: 'Login successful' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
    }
  });

app.get('/profile', authenticateToken, async (req, res) => {
    const userId = req.userId;
  
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const user = result.rows[0];
  
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
    }
  });
  app.post('/rooms', async (req, res) => {
    const { room_number, capacity, amenities } = req.body;
  
    try {
      // Check if a room with the same room number already exists
      const existingRoom = await pool.query('SELECT * FROM rooms WHERE room_number = $1', [room_number]);
  
      if (existingRoom.rowCount > 0) {
        return res.status(400).json({ error: 'Room number already exists' });
      }
  
      // Insert the room into the database
      const result = await pool.query(
        'INSERT INTO rooms (room_number, capacity, amenities) VALUES ($1, $2, $3) RETURNING id',
        [room_number, capacity, amenities]
      );
  
      const roomId = result.rows[0].id;
  
      res.json({ id: roomId, message: 'Room added successfully' });
    } catch (error) {
      console.error('Error adding room:', error);
      res.status(500).json({ error: 'An error occurred' });
    }
  });
  

// Delete a room
app.delete('/rooms/:id', authenticateToken,async (req, res) => {
  const roomId = req.params.id;

  try {
    // Check if the room exists
    const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);

    if (roomResult.rowCount === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Delete the room from the database
    await pool.query('DELETE FROM rooms WHERE id = $1', [roomId]);

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

  
  function authenticateToken(req, res, next) {
    const token = req.headers.authorization;
  
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    jwt.verify(token, 'your_secret_key', (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
  
      req.userId = decoded.userId;
      next();
    });
  }

  // Update room availability
app.put('/rooms/:id/availability', async (req, res) => {
  const roomId = req.params.id;
  const { date, available } = req.body;

  try {
    // Check if the room exists
    const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);

    if (roomResult.rowCount === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Update room availability in the room_availability table
    await pool.query(
      'INSERT INTO room_availability (room_id, date, available) VALUES ($1, $2, $3) ' +
      'ON CONFLICT (room_id, date) DO UPDATE SET available = $3',
      [roomId, date, available]
    );

    res.json({ message: 'Room availability updated successfully' });
  } catch (error) {
    console.error('Error updating room availability:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


app.post('/rooms/:id/bookings', authenticateToken, async (req, res) => {
  const roomId = req.params.id;
  const { date } = req.body;
  const userId = req.userId;

  try {
    // Check if the room exists
    const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);

    if (roomResult.rowCount === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if the room is available on the specified date
    const availabilityResult = await pool.query(
      'SELECT * FROM room_availability WHERE room_id = $1 AND date = $2 AND available = true',
      [roomId, date]
    );

    if (availabilityResult.rowCount === 0) {
      return res.status(400).json({ error: 'Room is not available on the specified date' });
    }

    // Insert the booking into the bookings table
    const bookingResult = await pool.query(
      'INSERT INTO bookings (user_id, room_id, date) VALUES ($1, $2, $3) RETURNING id',
      [userId, roomId, date]
    );

    const bookingId = bookingResult.rows[0].id;

    // Update the room availability to mark it as booked
    await pool.query(
      'UPDATE room_availability SET available = false WHERE room_id = $1 AND date = $2',
      [roomId, date]
    );

    res.json({ id: bookingId, message: 'Booking successful' });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


  