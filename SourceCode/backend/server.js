const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donors');
const requestRoutes = require('./routes/requests');
const campRoutes = require('./routes/camps');
const bookingRoutes = require('./routes/bookings');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');
const { expireOverdueRequests } = require('./services/matching');
const { refreshCampStatuses } = require('./services/camps');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/camps', campRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);

// Base Route
app.get('/', (req, res) => {
    res.json({ message: 'Bloodbound API Server is running successfully!' });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

// Auto-expiry job: runs every minute
setInterval(() => {
    expireOverdueRequests().catch((e) => console.error('Expiry job error:', e.message));
}, 60 * 1000);

setInterval(() => {
    refreshCampStatuses().catch((e) => console.error('Camp status job error:', e.message));
}, 60 * 1000);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
