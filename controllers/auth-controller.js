
const User = require("../models/User");
const LoginAttempt = require("../models/LoginAttemptSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminEmail = "joshiaayush871@gmail.com";

const loginUser = (req, res, next) => {
    const { email, password } = req.body;

    User.findOne({ email })
        .then(user => {
            if (!user) {
                return res.status(401).json({ error: 'Incorrect Email or Password' });
            }

            LoginAttempt.find({ email, isSuccess: false })
                .sort({ timestamp: -1 })
                .limit(5)
                .then(failedAttempts => {
                    const failedAttemptsCount = failedAttempts.length;
                    const allowedAttempts = 5;
                    const lockoutDurationInMinutes = 1;

                    if (failedAttemptsCount >= allowedAttempts) {
                        const lastFailedAttempt = failedAttempts[0];
                        const now = new Date();
                        const lockoutTime = new Date(lastFailedAttempt.timestamp);
                        lockoutTime.setMinutes(lockoutTime.getMinutes() + lockoutDurationInMinutes);
                        const remainingLockoutTimeInMs = lockoutTime - now;

                        if (now < lockoutTime) {
                            return res.status(401).json({
                                error: 'Too many failed login attempts. Please try again after some time.',
                                remainingLockoutTime: remainingLockoutTimeInMs,
                            });
                        } else {
                            LoginAttempt.deleteMany({ email, isSuccess: false }).catch(err => {
                                console.log('Error deleting login attempts:', err);
                            });
                        }
                    }
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) {
                            return next(err);
                        }

                        if (!isMatch) {
                            const remainingAttempts = allowedAttempts - failedAttemptsCount;
                            return res.status(401).json({
                                error: 'Incorrect Password',
                                remainingAttempts,
                            });
                        }
                        // Successful login logic
                        LoginAttempt.deleteMany({ email, isSuccess: false })
                            .then(() => {
                                user.isOnline = true;
                                if (user.isVerified && user.email === adminEmail) {
                                    user.role = 'admin';
                                }
                                user.save();

                                const data = {
                                    id: user._id,
                                    email: user.email,
                                    role: user.role,
                                };

                                const token = jwt.sign(data, process.env.SECRET, { expiresIn: '30d' });

                                return res.json({
                                    status: 'Login Success',
                                    token,
                                    id: user._id,
                                    email: user.email,
                                    firstName: user.firstName,
                                    lastName: user.lastName,
                                    image: user.image,
                                    role: user.role,
                                    isOnline: user.isOnline,
                                    lastPasswordChange: user.lastPasswordChange,
                                    isVerified: user.isVerified,
                                });
                            })
                            .catch(err => {
                                return res.status(500).json({ error: 'Server Error' });
                            });
                    });
                })
                .catch(err => {
                    return res.status(500).json({ error: 'Server Error' });
                });
        })
        .catch(err => {
            return res.status(500).json({ error: 'Server Error' });
        });
};


module.exports = {
    loginUser,
};
