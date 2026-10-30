const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bloodbound_super_secret_key_2026';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
        return res.status(401).json({ error: 'Access denied. Malformed token.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Contains user_id, email, role
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
};

// Middleware to restrict access to specific roles (4 roles: donor, hospital_staff, camp_organizer, admin)
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Access forbidden. Role '${req.user ? req.user.role : 'unknown'}' is not authorized for this resource.` 
            });
        }
        next();
    };
};

module.exports = { verifyToken, authorizeRoles };