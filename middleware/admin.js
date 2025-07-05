const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.userType === 'admin') {
        return next(); // User is an admin, proceed to the next middleware or route handler
    }
    // If not an admin, respond with a 403 Forbidden status
    res.status(403).json({ error: 'Access denied. Admins only.' });
   
};

module.exports = adminMiddleware;
