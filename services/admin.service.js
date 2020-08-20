const {
    findUserByEmail,
    findUserById,
    findUserByEmailOrMobileNumber,
    createUser,
    findUserAndUpdate,
  } = require("../data/user.db");
  const User = require("../models/user.model");
  
  
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
  