const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Check cookie first, fallback to Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, role }
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'TokenExpired', message: 'Access token expired' });
        }
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
    }
};

module.exports = { authMiddleware, adminMiddleware };
