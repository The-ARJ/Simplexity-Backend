const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const LoginAttempt = require("../models/LoginAttemptSchema");

const router = express.Router();
const upload = require("../middleware/upload");
const {
  verifyUser,
  verifyManager,
  verifyAdmin,
  verifySuperAdmin,
} = require("../middleware/auth");
const userController = require("../controllers/user-controller");
router
  .route("/")
  .get(verifyUser, userController.getAllUsers)
  .put((req, res) => res.status(501).json({ msg: "Not implemented" }))
  .delete(verifySuperAdmin, userController.deleteAllUsers);
router.route("/forgot-password").post(userController.forgotPassword);
router.route("/verify-code").post(userController.verifyCode);
router.route("/reset-password").post(userController.resetPassword);
router
  .route("/:user_id")
  .get(userController.getUserById)
  .post((req, res) => res.status(501).json({ msg: "Not implemented" }))
  .put(verifyUser, upload.single("userImage"), userController.updateUserById)
  .delete(userController.deleteUserById);

router.route("/current/user").get(verifyUser, userController.getCurrentUser);

router.post("/current/user/logout", verifyUser, userController.logoutUser);


const adminEmail = "joshiaayush871@gmail.com"; // Define the admin email address

router.post("/", upload.single("userImage"), (req, res, next) => {
  console.log("Received POST request");
  console.log("req.body:", req.body);
  console.log("req.file:", req.file);

  User.findOne({ email: req.body.email })
    .then((user) => {
      console.log("User found:", user);

      if (user != null) {
        console.log("Email already exists");
        return res.status(400).json({ error: "Email already exists" });
      }

      const { firstName, lastName, password } = req.body;
      if (
        firstName &&
        lastName &&
        (password.toLowerCase().includes(firstName.toLowerCase()) ||
          password.toLowerCase().includes(lastName.toLowerCase()))
      ) {
        console.log("Password cannot contain your name");
        return res.status(400).json({ error: "Password cannot contain your name" });
      }

      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return next(err);
        }

        const role = req.body.email === adminEmail ? "admin" : "user"; // Check if the email matches the admin email

        const newUser = new User({
          email: req.body.email,
          firstName,
          lastName,
          password: hash,
          role: role, // Set the role based on the email match
        });

        newUser
          .save()
          .then((user) => {
            const data = {
              id: user._id,
              email: user.email,
              firstName,
              lastName,
              role: user.role,
              image: user.image,
            };

            return res
              .status(201)
              .json({ status: "User registration success.", data });
          })
          .catch((err) => {
            console.log("Error saving user in database:", err);
            return res
              .status(400)
              .json({ error: "Error saving user in database" });
          });
      });
    })
    .catch((err) => {
      console.log("Server error:", err);
      return res.status(500).json({ error: "Server Error" });
    });
});


router.post("/login/user", (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Incorrect Email Address" });
      }

      // Check if the account is locked due to too many failed login attempts
      LoginAttempt.find({ email, isSuccess: false })
        .sort({ timestamp: -1 }) // Sort by timestamp in descending order to get the latest failed attempt first
        .limit(5) // Adjust the limit based on your requirements
        .then((failedAttempts) => {
          const failedAttemptsCount = failedAttempts.length;
          const allowedAttempts = 5; // Define the maximum number of allowed failed attempts
          const lockoutDurationInMinutes = 1; // Define the lockout duration in minutes

          if (failedAttemptsCount >= allowedAttempts) {
            const lastFailedAttempt = failedAttempts[0]; // Get the latest failed attempt
            const now = new Date();
            const lockoutTime = new Date(lastFailedAttempt.timestamp);
            lockoutTime.setMinutes(lockoutTime.getMinutes() + lockoutDurationInMinutes);
            const remainingLockoutTimeInMs = lockoutTime - now;

            if (now < lockoutTime) {
              // Account is still locked. Return an error with remaining lockout time.
              return res.status(401).json({
                error: "Too many failed login attempts. Please try again after some time.",
                remainingLockoutTime: remainingLockoutTimeInMs,
              });
            } else {
              // If lockout time has passed, delete the previous failed login attempts
              LoginAttempt.deleteMany({ email, isSuccess: false }).catch((err) => {
                console.log("Error deleting login attempts:", err);
              });
            }
          }

          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
              return next(err);
            }

            if (!isMatch) {
              // Log the failed login attempt
              const loginAttempt = new LoginAttempt({
                email,
                isSuccess: false,
              });
              loginAttempt.save();

              // Calculate the remaining login attempts and add it to the response
              const remainingAttempts = allowedAttempts - failedAttemptsCount;

              return res.status(401).json({
                error: "Incorrect Password",
                remainingAttempts,
              });
            }

            // Reset the failed login attempts upon successful login
            LoginAttempt.deleteMany({ email, isSuccess: false })
              .then(() => {
                // Set user online status to true upon successful login
                user.isOnline = true;
                user.save();

                const data = {
                  id: user._id,
                  email: user.email,
                  role: user.role,
                };
                const token = jwt.sign(data, process.env.SECRET, { expiresIn: "1y" });
                return res.json({ status: "Login Success", token });
              })
              .catch((err) => {
                return res.status(500).json({ error: "Server Error" });
              });
          });
        })
        .catch((err) => {
          return res.status(500).json({ error: "Server Error" });
        });
    })
    .catch((err) => {
      return res.status(500).json({ error: "Server Error" });
    });
});




module.exports = router;
