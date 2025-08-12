const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST ,
    database: process.env.DB_NAME ,
    password: process.env.DB_PASSWORD ,
    port: process.env.DB_PORT ,
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err);
    } else {
        console.log('Connected to PostgreSQL database');
        release();
    }
});

// Helper function for consistent responses
const sendResponse = (res, statusCode, success, message, data = null) => {
    res.status(statusCode).json({
        success,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

// Routes

// GET all users
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, age, gender, created_at FROM users ORDER BY created_at DESC'
        );

        sendResponse(res, 200, true, 'Users retrieved successfully', result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        sendResponse(res, 500, false, 'Failed to retrieve users');
    }
});

// GET single user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id, username, age, gender, created_at FROM users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return sendResponse(res, 404, false, 'User not found');
        }

        sendResponse(res, 200, true, 'User retrieved successfully', result.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        sendResponse(res, 500, false, 'Failed to retrieve user');
    }
});

// POST create user (SECURE METHOD)
app.post('/api/users', async (req, res) => {
    try {
        const { username, password, age, gender } = req.body;

        // Validation
        if (!username || !password || !age || !gender) {
            return sendResponse(res, 400, false, 'All fields are required');
        }

        if (age < 1 || age > 120) {
            return sendResponse(res, 400, false, 'Age must be between 1 and 120');
        }

        if (!['male', 'female', 'other'].includes(gender.toLowerCase())) {
            return sendResponse(res, 400, false, 'Gender must be male, female, or other');
        }

        const result = await pool.query(
            'INSERT INTO users (username, password, age, gender) VALUES ($1, $2, $3, $4) RETURNING id, username, age, gender, created_at',
            [username, password, parseInt(age), gender.toLowerCase()]
        );

        sendResponse(res, 201, true, 'User created successfully', result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
            return sendResponse(res, 409, false, 'Username already exists');
        }
        console.error('Error creating user:', error);
        sendResponse(res, 500, false, 'Failed to create user');
    }
});

// GET create user (INSECURE METHOD - FOR EDUCATIONAL PURPOSES)
app.get('/api/users-insecure/create', async (req, res) => {
    try {
        const { username, password, age, gender } = req.query;

        console.log('⚠️  SECURITY WARNING: Sensitive data exposed in URL!');
        console.log('URL Parameters:', req.query);

        // Validation
        if (!username || !password || !age || !gender) {
            return sendResponse(res, 400, false, 'All fields are required in query parameters');
        }

        if (age < 1 || age > 120) {
            return sendResponse(res, 400, false, 'Age must be between 1 and 120');
        }

        if (!['male', 'female', 'other'].includes(gender.toLowerCase())) {
            return sendResponse(res, 400, false, 'Gender must be male, female, or other');
        }

        const result = await pool.query(
            'INSERT INTO users (username, password, age, gender) VALUES ($1, $2, $3, $4) RETURNING id, username, age, gender, created_at',
            [username, password, parseInt(age), gender.toLowerCase()]
        );

        sendResponse(res, 201, true, 'User created successfully (INSECURE METHOD)', result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return sendResponse(res, 409, false, 'Username already exists');
        }
        console.error('Error creating user:', error);
        sendResponse(res, 500, false, 'Failed to create user');
    }
});

// PUT update user
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, age, gender } = req.body;

        if (!username || !age || !gender) {
            return sendResponse(res, 400, false, 'Username, age, and gender are required');
        }

        const result = await pool.query(
            'UPDATE users SET username = $1, age = $2, gender = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, username, age, gender, updated_at',
            [username, parseInt(age), gender.toLowerCase(), id]
        );

        if (result.rows.length === 0) {
            return sendResponse(res, 404, false, 'User not found');
        }

        sendResponse(res, 200, true, 'User updated successfully', result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return sendResponse(res, 409, false, 'Username already exists');
        }
        console.error('Error updating user:', error);
        sendResponse(res, 500, false, 'Failed to update user');
    }
});

// DELETE user
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, username',
            [id]
        );

        if (result.rows.length === 0) {
            return sendResponse(res, 404, false, 'User not found');
        }

        sendResponse(res, 200, true, 'User deleted successfully', result.rows[0]);
    } catch (error) {
        console.error('Error deleting user:', error);
        sendResponse(res, 500, false, 'Failed to delete user');
    }
});

// Health check
app.get('/api/health', (req, res) => {
    sendResponse(res, 200, true, 'Server is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});