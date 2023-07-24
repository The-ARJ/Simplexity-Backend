const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
          // console.log("Error hashing password:", err);
          return next(err);
        }

        // console.log("Hashed password:", hash);

        const newUser = new User({
          email: req.body.email,
          // phoneNumber: req.body.phoneNumber,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          // image: "/user_images/" + req.file.filename,
          password: hash,
          role: req.body.role || "user",
        });

        newUser
          .save()
          .then((user) => {
            // console.log("User saved in database:", user);

            const data = {
              id: user._id,
              email: user.email,
              // phoneNumber: user.phoneNumber,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              image: user.image,
            };

            // console.log("Returning response");
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

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          return next(err);
        }
        if (!isMatch) {
          return res.status(401).json({ error: "Incorrect Password" });
        }

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
      });
    })
    .catch((err) => {
      return res.status(500).json({ error: "Server Error" });
    });
});





module.exports = router;
