const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();
const upload = require("../middleware/upload");
const {
  verifyUser,
  verifyAdmin,
  verifySuperAdmin,
} = require("../middleware/auth");
const userController = require("../controllers/user-controller");
const authController = require("../controllers/auth-controller");
const checkLastPasswordChange = require("../middleware/passwordChangePrompt");

router.post("/", upload.single("userImage"), userController.registerUser)
router.post("/login/user",  authController.loginUser);
router.route("/current/user").get(verifyUser, checkLastPasswordChange, userController.getCurrentUser);
router.post("/current/user/logout", verifyUser, userController.logoutUser);

router
  .route("/")
  .get(verifyUser, userController.getAllUsers)
  .put((req, res) => res.status(501).json({ msg: "Not implemented" }))
  .delete(verifySuperAdmin, userController.deleteAllUsers);
router.route("/forgot-password").post(userController.forgotPassword);
router.route("/verify-code").post(userController.verifyCode);
router.route("/reset-password").post(userController.resetPassword);
router.route("/update-password/:user_id").put(userController.updatePassword);
router
  .route("/:user_id")
  .get(userController.getUserById)
  .post((req, res) => res.status(501).json({ msg: "Not implemented" }))
  .put(verifyUser, upload.single("userImage"), userController.updateUserById)
  .delete(userController.deleteUserById);


module.exports = router;
