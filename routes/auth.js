const router = require("express").Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const moment = require("moment");
let User = require("../models/user.model");

router.route("/login").post((req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email: email })
    .then((userDoc) => {
      if (!userDoc) {
        return res.status(404).json("EMAIL_NOT_FOUND");
      }

      bcrypt
        .compare(password, userDoc.password)
        .then((doMatch) => {
          if (!doMatch) {
            return res.status(401).json("INVALID_PASSWORD");
          }

          if (!userDoc.mobileNumber) {
            return res
              .status(200)
              .json({ accessToken: "NOT_VERIFIED", userId: userDoc._id });
          }

          const accessToken = generateAccessToken();
          return res.status(200).json({
            accessToken,
            userId: userDoc._id,
            name: userDoc.firstName,
            mobileNumber: userDoc.mobileNumber,
          });
        })
        .catch((err) => {
          {
            return res.status(400).json("Error: " + err);
          }
        });
    })
    .catch((err) => {
      {
        return res.status(400).json("Error: " + err);
      }
    });
});

router.route("/requestpasswordreset").post((req, res) => {
  const email = req.body.email;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.status(400).json("Error: " + err);
    }
    const token = buffer.toString("hex");
    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          res.status(404).json("No account with this email found");
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        // send email here with the token
        //   return transporter.sendMail({
        //       to: email,
        //       from: 'splitter@admin.com',
        //       subject:'Reset Password',
        //       html:`
        //       <p>You requested a password reset</p>
        //       <p>Click this <a href="http://localhost:5000/users/resetpassword/${token}">link</a> to set a new password: </p>
        //       `
        //   })
        return res.json(token);
      })
      .catch((err) => {
        {
          return res.status(400).json("Error: " + err);
        }
      });
  });
});

router.route("/resetpassword/:token").get((req, res) => {
  const token = req.params.token;
  User.findOne({
    resetPasswordToken: token,
    resetPasswordExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        return res.status(400).json("Token has expired");
      }
      return res
        .status(200)
        .json({ userId: user._id, resetPasswordToken: token });
    })
    .catch((err) => {
      return res.status(400).json("Error: " + err);
    });
});

router.route("/enternewpassword").post((req, res) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.resetPasswordToken;
  let user;
  User.findOne({
    _id: userId,
    resetPasswordToken: passwordToken,
    resetPasswordExpiration: { $gt: Date.now() },
  })
    .then((userDoc) => {
      if (!userDoc) {
        return res.status(400).json("Token has expired");
      }
      user = userDoc;
      bcrypt
        .hash(newPassword, 12)
        .then((hashedPassword) => {
          user.password = hashedPassword;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpiration = undefined;
          return user.save();
        })
        .then((result) => {
          res.status(200).json("Password change success!");
        })
        .catch((err) => {
          return res.status(400).json("Error: " + err);
        });
    })
    .catch((err) => {
      return res.status(400).json("Error: " + err);
    });
});

// change password
router.route("/changePassword").put(async (req, res) => {

  let { oldPassword, newPassword, userId } = req.body;

  User.findById(userId).then((userDoc) => {
    if (!userDoc) {
      return res.status(400).json("User cannot be found");
    }

    bcrypt
      .compare(oldPassword, userDoc.password)
      .then((doMatch) => {
        if (!doMatch) {
          console.log('domatch', doMatch)
          return res.status(400).json("Existing password is incorrect");
        }

        bcrypt
          .hash(newPassword, 12)
          .then((hashedPassword) => {
            userDoc.password = hashedPassword;
            return userDoc.save();
          })
          .then((result) => {
            res.status(200).json("Password change success!");
          })
          .catch((err) => {
            return res.status(400).json("Error: " + err);
          });
      })
      .catch((err) => {
        return res.status(400).json("Error: " + err);
      });
  });
});

router.route("/signup").post((req, res) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const mobileNumber = req.body.mobileNumber;
  const password = req.body.password;

  User.findOne({ $or: [{ email: email }, { mobileNumber: mobileNumber }] })
    .then((userDoc) => {
      if (userDoc) {
        if (userDoc.email === email) {
          return res.status(400).json("User with this email already exists");
        } else {
          return res
            .status(400)
            .json("User with this mobile number already exists");
        }
      }

      // return bcrypt.hash(password, 12).then(hashedPassword => {
      bcrypt.hash(password, 12).then((hashedPassword) => {
        var newUser = new User({
          firstName,
          lastName,
          password: hashedPassword,
          email,
          mobileNumberTemp: mobileNumber,
        });

        const otp = generateOTP();
        // add async logic to send otp
        newUser = newUser
          .save()
          .then((userCreated) => {
            res.json({ userId: userCreated._id });
            return new Promise((resolve, reject) => {
              resolve(userCreated);
            });
          })
          .then((newUser) => {
            var otpExpiration = moment(new Date()).add(3, "m").toDate();
            newUser.otpExpiration = otpExpiration;
            newUser.otp = otp;
            newUser
              .save()
              .then(({ otp, otpExpiration }) => console.log(otp, otpExpiration))
              .catch((err) => {
                return res.status(400).json("Error: " + err);
              });
          })
          .catch((err) => {
            return res.status(400).json("Error: " + err);
          });
      });
    })
    .catch((err) => {
      return res.status(400).json("Error: " + err);
    });
});

const verifyOtp = async (otp, userId) => {
  const user = await User.findOne({ _id: userId });
  if (!user) {
    throw new Error("User cannot be found");
  }

  if (user.otp) {
    if (user.otpExpiration < new Date()) {
      throw new Error("OTP has expired");
    }
    if (user.otp !== otp) {
      throw new Error("Invalid OTP");
    }

    return user;
  }
};

const generateOTPLogic = (userId, type, data) => {
  return new Promise((resolve, reject) => {
    User.findOne({ _id: userId })
      .then((user) => {
        if (!user) {
          reject("User not found");
        }

        const otp = generateOTP();
        // add async logic to send otp to email / mobile num
        var otpExpiration = moment(new Date()).add(3, "m").toDate();
        user.otpExpiration = otpExpiration;

        if (type === "email") {
          user.emailTemp = data;
        } else if (type === "mobileNumber") {
          user.mobileNumberTemp = data;
        }
        user.otp = otp;
        user
          .save()
          .then(({ otp, otpExpiration }) => {
            console.log(otp, otpExpiration);
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
      })
      .catch((err) => {
        reject(err);
      });
  });
};


router.route("/requestOTP").post(async (req, res) => {
  const userId = req.body.userId;
  const mobileNumber = req.body.mobileNumber;

  const userWithSameMobileNum = await User.findOne({ mobileNumber });
  if (userWithSameMobileNum) {
    return res.status(400).json("Mobile number already registered");
  }

  try {
    await generateOTPLogic(userId, "mobileNumber", mobileNumber);
    return res.status(200).end();
  } catch (err) {
    return res.status(400).json({ err });
  }
});

router.route("/verifyotp").post(async (req, res) => {
  const otp = req.body.otp;
  const userId = req.body.userId;
  try {
    const user = await verifyOtp(otp, userId);
 
      user.mobileNumber = user.mobileNumberTemp;
      user.mobileNumberTemp = null;
      user.otp = null;
      user.otpExpiration = null;

      const accessToken = generateAccessToken();
      user
        .save()
        .then((savedUser) => {
          res.status(200).json({
            name: savedUser.firstName + " " + savedUser.lastName,
            mobileNumber: savedUser.mobileNumber,
            accessToken,
          });
        })
        .catch((err) => {
          return res.status(400).json("Error: " + err);
        });
    
  } catch (err) {
    return res.status(400).json("Error: " + err);
  }
});

function generateAccessToken() {
  return crypto.randomBytes(64).toString("base64");
}

const generateAndSetAccessToken = async (userId) => {
  const accessToken = crypto.randomBytes(64).toString("base64");
  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json("No user found");
    }

    user.accessToken = accessToken;
    var accessTokenExpiration = moment(new Date()).add(1, "y").toDate();
    user.accessTokenExpiration = accessTokenExpiration;

    user
      .save()
      .then(() => {
        res.status(200).json("OTP Verification Success");
      })
      .catch((err) => {
        return res.status(400).json("Error: " + err);
      });
  } catch (err) {
    return res.status(400).json("Error: " + err);
  }
};

function generateOTP() {
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

module.exports = router;
