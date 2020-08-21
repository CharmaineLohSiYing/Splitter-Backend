const {
    findUserByEmail,
    findUserById,
    findUserByEmailOrMobileNumber,
    createUser,
  } = require("../data/user.db");
  const bcrypt = require("bcrypt");
  const crypto = require("crypto");
  const moment = require("moment");
  const User = require("../models/user.model");

  const getUserByIdService = async (userId) => {
      const user = await findUserById(userId);
      const { firstName, lastName, mobileNumber, email } = user;
      const userObj = {
        firstName,
        lastName,
        mobileNumber,
        email,
      };

      return {user: userObj}
  }

  const updateUserNameService = async (userId, firstName, lastName) => {
    await User.findByIdAndUpdate({_id: userId}, {firstName, lastName})
    return;
  }


  const updateUserEmailService = async (userId, email) => {
    const userWithSameEmail = await User.findOne({ email });
      if (userWithSameEmail && userWithSameEmail._id.toString() !== userId) {
        throw new Error("Email already registered");
      }
  
      await User.findByIdAndUpdate({_id: userId}, {email})
      return; 
  }

  const updateUserMobileNumberService = async (userId, mobileNumber) => {
    await User.findByIdAndUpdate({_id: userId}, {mobileNumber})
    return;
  }

  
  module.exports = {
    getUserByIdService,
    updateUserEmailService,
    updateUserMobileNumberService,
    updateUserNameService
  };
  