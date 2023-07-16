const jwt = require('jsonwebtoken')

const verifyUser = (req, res, next) => {
    let authHeader = req.headers.authorization
    if (!authHeader) {
        res.status(401)
        return next(new Error('No authentication information provided'))
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) return next(err)
        req.user = decoded
        console.log(req.user)
        next()
    })
}


const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403);
        return next(new Error('Not admin'));
    }
};

const verifySuperAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next();
    } else {
        res.status(403);
        return next(new Error('Not super admin'));
    }
};

module.exports = { verifyUser, verifyAdmin, verifySuperAdmin }
