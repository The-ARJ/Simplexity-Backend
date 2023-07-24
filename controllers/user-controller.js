const User = require("../models/User");
const sendVerificationCodeToMail = require('../middleware/email');
const generateVerificationCode = require('./verificationcode.js');
const bcrypt = require("bcryptjs");
const getAllUsers = (req, res, next) => {
  User.find()
    .then((user) => {
      res.status(200).json({
        success: true,
        message: "All users retrieved successfully",
        data: user,
      });
    })
    .catch((error) => {
      res.status(500).json({ message: "Error retrieving users", error });
    });
};
const getCurrentUser = (req, res) => {
  const userId = req.user.id;

  User.findById(userId)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Include the isOnline status in the response
      res.status(200).json({
        success: true,
        message: "Current user retrieved successfully",
        data: {
          ...user.toJSON(),
          isOnline: user.isOnline,
        },
      });
    })
    .catch((error) => {
      res.status(500).json({ message: "Error retrieving current user", error });
    });
};



const deleteAllUsers = (req, res, next) => {
  User.deleteMany()
    .then((status) => {
      res
        .status(200)
        .json({ message: "All Users deleted successfully", status });
    })
    .catch((error) => {
      res.status(500).json({ message: "Error deleting all users", error });
    });
};

const getUserById = (req, res, next) => {
  User.findById(req.params.user_id)
    // .populate("category")
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User retrieved successfully", user });
    })
    .catch((error) => {
      res.status(500).json({ message: "Error retrieving user", error });
    });
};

const updateUserById = (req, res, next) => {
  console.log(req.params);
  User.findById(req.params.user_id)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (req.body.email && user.email !== req.body.email) {
        User.findOne({ email: req.body.email })
          .then((existingUser) => {
            if (existingUser) {
              return res
                .status(400)
                .json({ error: "A user with that email already exists" });
            } else {
              updateUser(user, req, res);
            }
          })
          .catch((err) => {
            return res.status(400).json({ error: "Error updating user" });
          });
      } else {
        updateUser(user, req, res);
      }
    })
    .catch((err) => {
      return res.status(400).json({ error: "Error updating user", details: err.message });
    });

};


function updateUser(user, req, res) {
  user.email = req.body.email || user.email;
  user.firstName = req.body.firstName || user.firstName;
  user.lastName = req.body.lastName || user.lastName;
  // user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
  user.profession = req.body.profession || user.profession;
  user.role = req.body.role || user.role;
  if (req.file) {
    user.image = "/user_images/" + req.file.filename;
  }

  user
    .save()
    .then((updatedUser) => {
      const data = {
        _id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        profession: updatedUser.profession,
        role: updatedUser.role,
        image: updatedUser.image,
      };
      return res.json({
        success: true,
        message: "User updated successfully",
        data,
      });
    })
    .catch((err) => {
      return res.status(400).json({ error: "Error updating user" });
    });
}

const updatePassword = (req, res, next) => {
  User.findById(req.params.user_id)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) return next(err);
        user.password = hash;

        user
          .save()
          .then((updatedUser) => {
            return res.json({
              success: true,
              message: "Password updated successfully",
            });
          })
          .catch((err) => {
            return res.status(400).json({ error: "Error updating password" });
          });
      });
    })
    .catch((err) => {
      return res.status(500).json({ error: "Server Error" });
    });
};

const deleteUserById = (req, res, next) => {
  User.findByIdAndDelete(req.params.user_id)
    .then((user) => {
      if (user) {
        res.json({ message: "User item deleted successfully" });
      } else {
        res.status(404).json({ message: "User item not found" });
      }
    })
    .catch((error) => {
      res.status(500).json({ message: "Error deleting user item", error });
    });
};









const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  console.log(email)
  try {
    // Generate a verification code
    const verificationCode = generateVerificationCode();

    // Save the verification code in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json('User not found');
    }
    user.verificationCode = verificationCode;
    await user.save();

    // Send the verification code to the user's mail
    sendVerificationCodeToMail(email, verificationCode);

    // console.log("Generated verification code:", verificationCode);
    return res.status(200).json({ message: 'Verification code sent successfully', verificationCode });
  } catch (error) {
    console.log(error)
    next(error);
  }
};



const verifyCode = (req, res, next) => {
  const { email, verificationCode } = req.body;
  console.log(verificationCode)
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(404).json('User not found');

      }
      console.log("user  found", user)

      if (user.verificationCode !== verificationCode) {
        console.log(user.verificationCode)
        return res.status(400).json('Invalid verification code');
      }

      res.status(200).json({ message: 'Code is correct', verificationCode: user.verificationCode });
    })
    .catch((error) => {
      console.log(error)
      res.status(500).json('Failed to verify code');
    });
};


const saltRounds = 10;  // You can adjust this number based on your security requirements

const resetPassword = (req, res, next) => {
  const { email, verificationCode, newPassword } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(404).json('User not found');
      }

      if (user.verificationCode !== verificationCode) {
        return res.status(400).json('Invalid verification code');
      }

      // Hash the new password
      return bcrypt.hash(newPassword, saltRounds)
        .then((hashedPassword) => {
          user.password = hashedPassword;
          user.verificationCode = null;
          return user.save();
        })
        .then((updatedUser) => {
          // Delete the verificationCode from the user document
          return User.updateOne({ _id: updatedUser._id }, { $unset: { verificationCode: 1 } });
        })
        .then(() => {
          res.status(200).json({ message: 'Password reset successfully' });
        })
        .catch((error) => {
          res.status(500).json('Failed to reset password');
        });
    })
    .catch((error) => {
      res.status(500).json({ message: 'An error occurred', error: error });
    });
};
const logoutUser = async (req, res, next) => {
  const userId = req.user.id;
  console.log(userId)
  try {
    const user = await User.findByIdAndUpdate(userId, { isOnline: false });
    console.log(user)

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.log(err)

    res.status(500).json({ message: "Error logging out user", error });
  }
};



module.exports = {
  getAllUsers,
  deleteAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  getCurrentUser,
  updatePassword,
  forgotPassword,
  verifyCode,
  resetPassword,
  logoutUser
};
