// const User = require("../models/User");
// const checkLastPasswordChange = (req, res, next) => {
//     const userId = req.user.id;

//     User.findById(userId)
//         .then((user) => {
//             if (!user) {
//                 return res.status(404).json({ message: "User not found" });
//             }

//             const currentTime = new Date();
//             const diffInMinutes = (currentTime - user.lastPasswordChange) / 1000 / 60;
//             if (diffInMinutes > 1) {
//                 console.log("Please update your password");
//                 req.passwordExpired = true;
//             }
//             next();
//         })
//         .catch((error) => {
//             res.status(500).json({ message: "Error checking last password change", error });
//         });
// };


// module.exports = checkLastPasswordChange;

const User = require("../models/User");

const checkLastPasswordChange = (req, res, next) => {
    const userId = req.user.id;

    User.findById(userId)
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const currentTime = new Date();
            const diffInDays = (currentTime - user.lastPasswordChange) / (1000 * 60 * 60 * 24);
            const passwordExpirationDays = 90;

            if (diffInDays > passwordExpirationDays) {
                console.log("Please update your password");
                req.passwordExpired = true;
            }

            next();
        })
        .catch((error) => {
            res.status(500).json({ message: "Error checking last password change", error });
        });
};

module.exports = checkLastPasswordChange;
