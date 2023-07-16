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

router
  .route("/:user_id")
  .get(userController.getUserById)
  .post((req, res) => res.status(501).json({ msg: "Not implemented" }))
  .put(verifyUser, upload.single("userImage"), userController.updateUserById)
  .delete(userController.deleteUserById);

router.route("/current/user").get(verifyUser, userController.getCurrentUser);


router.post("/", upload.single("userImage"), (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (user != null) {
        return res.status(400).json({ error: "Email already exists" });
      }

      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) return next(err);

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
            const data = {
              id: user._id,
              email: user.email,
              // phoneNumber: user.phoneNumber,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              image: user.image,
            };
            return res
              .status(201)
              .json({ status: "User registration success.", data });
          })
          .catch((err) => {
            console.log(err);
            return res
              .status(400)
              .json({ error: "Error saving user in database" });
          });
      });
    })
    .catch((err) => {
      return res.status(500).json({ error: "Server Error" });
    });
});
router.post("/login/user", (req, res, next) => {
  const { email, password } = req.body;

  console.log("Login request received for email:", email);

  // Find user by email
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        console.log("User not found for email:", email);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.log("Error comparing passwords:", err);
          return next(err);
        }
        if (!isMatch) {
          console.log("Invalid password for email:", email);
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const data = {
          id: user._id,
          email: user.email,
          role: user.role,
        };
        const token = jwt.sign(data, process.env.SECRET, { expiresIn: "1y" });
        console.log("Login successful for email:", email);
        return res.json({ status: "Login Success", token });
      });
    })
    .catch((err) => {
      console.log("Error during login:", err);
      return res.status(500).json({ error: "Server Error" });
    });
});



module.exports = router;
