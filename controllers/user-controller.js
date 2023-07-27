const User = require("../models/User");
const LoginAttempt = require("../models/LoginAttemptSchema");
const sendVerificationCodeToMail = require('../middleware/email');
const generateVerificationCode = require('./verificationcode.js');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminEmail = "joshiaayush871@gmail.com"; // Define the admin email address

function isPasswordValid(password) {
  const validations = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialCharacter: /[!@#$%^&*]/.test(password),
  };

  // Check if all validations are met
  for (const key in validations) {
    if (!validations[key]) {
      return false;
    }
  }
  return true;
}

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
const registerUser = (req, res, next) => {
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

      if (!isPasswordValid(password)) {
        console.log("Password does not meet the criteria");
        return res.status(400).json({ error: "Password does not meet the criteria" });
      }

      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return next(err);
        }

        const newUser = new User({
          email: req.body.email,
          firstName,
          lastName,
          password: hash,
          lastPasswordChange: Date.now(),
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

            return res.status(201).json({ status: "User registration success.", data });
          })
          .catch((err) => {
            console.log("Error saving user in the database:", err);
            return res.status(400).json({ error: "Error saving user in the database" });
          });
      });
    })
    .catch((err) => {
      console.log("Server error:", err);
      return res.status(500).json({ error: "Server Error" });
    });
};

const loginUser = (req, res, next) => {
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
                // If the login is successful and the user is verified, assign the "admin" role (if applicable)
                if (user.isVerified && user.email === adminEmail) {
                  user.role = "admin";
                }
                user.save();

                // Return the response with the token and user data
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
};



const getCurrentUser = (req, res) => {
  const userId = req.user.id;

  User.findById(userId)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const responseData = {
        success: true,
        message: "Current user retrieved successfully",
        data: {
          ...user.toJSON(),
          isOnline: user.isOnline,
        },
      };

      // Check if password has expired, and if so, add a message to the response data
      if (req.passwordExpired) {
        responseData.passwordExpired = true;
        responseData.message = "Your password has expired. Please update it.";

        console.log("Password has expired for user with ID:", userId); // Console log
      } else {
        console.log("Password has not expired for user with ID:", userId); // Console log
      }

      // Return the response data
      res.status(200).json(responseData);
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
  const { user_id } = req.params;
  const { oldPassword, password } = req.body;

  console.log("User ID:", user_id);
  console.log("Old Password:", oldPassword);
  console.log("New Password:", password);

  User.findById(user_id)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log("Found user:", user);

      // Check if the user is verified
      if (!user.isVerified) {
        return res.status(401).json({ error: "User is not verified. Please verify your account first." });
      }

      bcrypt.compare(oldPassword, user.password, (err, isMatch) => {
        if (err) {
          return next(err);
        }

        console.log("Password match:", isMatch);

        if (!isMatch) {
          return res.status(400).json({ error: "Incorrect old password" });
        }

        if (!isPasswordValid(password)) {
          console.log("Password does not meet the criteria");
          return res.status(400).json({ error: "New password does not meet the criteria" });
        }

        bcrypt.hash(password, 10, (err, hash) => {
          if (err) {
            return next(err);
          }

          console.log("New password hash:", hash);

          user.password = hash;
          user.lastPasswordChange = new Date();

          console.log("Updated password:", user.password);
          console.log("Updated lastPasswordChange:", user.lastPasswordChange);

          user.save()
            .then((updatedUser) => {
              console.log("Updated user:", updatedUser);
              return res.json({
                success: true,
                message: "Password updated successfully",
              });
            })
            .catch((err) => {
              console.log("Error saving user:", err);
              return res.status(400).json({ error: "Error updating password" });
            });
        });
      });
    })
    .catch((err) => {
      console.log("Error finding user:", err);
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
  console.log(email, verificationCode);

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(404).json('User not found');
      }

      console.log("user found", user);

      if (user.verificationCode !== verificationCode) {
        console.log(user.verificationCode, verificationCode);
        return res.status(400).json('Invalid verification code');
      }

      // If the verification code is correct, update user.isVerified to true
      user.isVerified = true;
      user.save() // Save the updated user object
        .then(() => {
          res.status(200).json({ message: 'Code is correct', verificationCode: user.verificationCode });
        })
        .catch((error) => {
          console.log(error);
          res.status(500).json('Failed to verify code');
        });
    })
    .catch((error) => {
      console.log(error);
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
      return bcrypt
        .hash(newPassword, saltRounds)
        .then((hashedPassword) => {
          user.password = hashedPassword;
          user.verificationCode = null;
          user.lastPasswordChange = new Date();
          return user.save();
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
  registerUser,
  loginUser,
  logoutUser
};
