const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);

// Base Route
app.get('/', (req, res) => {
    res.json({ message: 'Bloodbound API Server is running successfully!' });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
