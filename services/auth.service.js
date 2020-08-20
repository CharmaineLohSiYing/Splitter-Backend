const {
  findUserByEmail,
  findUserById,
  findUserByEmailOrMobileNumber,
  createUser,
  findUserAndUpdate,
} = require("../data/user.db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const moment = require("moment");
const User = require("../models/user.model");

const checkPassword = (correctPassword, inputPassword) => {
  return new Promise((resolve, reject) =>
    bcrypt.compare(correctPassword, inputPassword, (err, response) => {
      if (err) {
        reject(err);
      } else if (response) {
        resolve(response);
      } else {
        reject();
      }
    })
  );
};

const generatePasswordHash = (password) => {
  return new Promise((resolve, reject) =>
    bcrypt.hash(password, 12, (err, response) => {
      if (err) {
        reject(err);
      } else if (response) {
        resolve(response);
      } else {
        reject();
      }
    })
  );
};

const generateAccessToken = () => {
  return crypto.randomBytes(64).toString("base64");
}

const generateAndSetAccessToken = (userId) => {
  return new Promise(async (resolve, reject) => {
    const accessToken = generateAccessToken();
    try {
      const user = await findUserById(userId);
      if (!user) {
        reject("USER_NOT_FOUND");
      }
      user.accessToken = accessToken;
      const accessTokenExpiration = moment(new Date()).add(1, "y").toDate();
      user.accessTokenExpiration = accessTokenExpiration;

      user
        .save()
        .then(() => {
          resolve({ accessToken, accessTokenExpiration });
        })
        .catch((err) => {
          reject(err);
        });
    } catch (err) {
      reject(err);
    }
  });
};

const generateOTP = () => {
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

const setOTPService = async (userId) => {
  try {
    const otp = generateOTP();
    console.log(otp);
    var otpExpiration = moment(new Date()).add(3, "m").toDate();
    await findUserAndUpdate(userId, { otp, otpExpiration });
  } catch (err) {
    console.log("Unable to set OTP for user", userId);
  }
};

const loginService = async (email, password) => {
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error("EMAIL_NOT_FOUND: " + email);
    }

    try {
      await checkPassword(user.password, password);
    } catch (err) {
      throw new Error("INVALID_PASSWORD");
    }

    if (!user.mobileNumber) {
      return { accessToken: "NOT_VERIFIED", userId: user._id };
    }

    const {
      accessToken,
      accessTokenExpiration,
    } = await generateAndSetAccessToken(user._id);
    return {
      accessToken,
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      email: user.email,
      accessTokenExpiration,
    };
  } catch (err) {
    throw err;
  }
};

const signupService = async (
  email,
  password,
  firstName,
  lastName,
  mobileNumber
) => {
  try {
    const existingUser = await findUserByEmailOrMobileNumber(
      email,
      mobileNumber
    );
    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error("User with this email already exists");
      }
      throw new Error("User with this mobile number already exists");
    }

    const hashedPassword = await generatePasswordHash(password);

    let newUser = new User({
      firstName,
      lastName,
      password: hashedPassword,
      email,
      mobileNumberTemp: mobileNumber,
    });

    return createUser(newUser);
  } catch (err) {
    throw err;
  }
};

const verifyOTP = async (otp, userId) => {
  return new Promise(async (resolve, reject) => {
    const user = await findUserById(userId);
    if (!user) {
      return reject("User cannot be found");
    }
    if (user.otp) {
      if (user.otpExpiration < new Date()) {
        return reject("OTP has expired");
      }
      if (user.otp !== otp) {
        return reject("Invalid OTP");
      }
      return resolve(user);
    } else {
      return reject("Invalid OTP");
    }
  });
};

const verifyOTPService = async (otp, userId) => {
  try {
    const user = await verifyOTP(otp, userId);
    const {
      accessToken,
      accessTokenExpiration,
    } = await generateAndSetAccessToken(userId);

    await findUserAndUpdate(userId, {
      mobileNumber: user.mobileNumberTemp,
      mobileNumberTemp: null,
      otp: null,
      otpExpiration: null,
    });

    return {
      accessToken,
      accessTokenExpiration,
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      email: user.email,
    };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  loginService,
  signupService,
  setOTPService,
  verifyOTPService,
};
