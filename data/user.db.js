const User = require("../models/user.model");

const findUserByEmail = async (email) => {
  try {
    return await User.findOne({ email });
  } catch (e) {
    console.log(e);
  }
};

const findUserById = async (userId) => {
  try {
    return await User.findById(userId);
  } catch (e) {
    console.log(e);
  }
};

const findUserByEmailOrMobileNumber = async (email, mobileNumber) => {
  try {
    return await User.findOne({
      $or: [{ email: email }, { mobileNumber: mobileNumber }],
    });
  } catch (e) {
    console.log(e);
  }
};

const createUser = async (userToCreate) => {
  try {
    return await userToCreate.save();
  } catch (e) {
    throw new Error("Unable to create user");
  }
};


const createUnregisteredUser = (mobileNumber) => {
  return new Promise((resolve, reject) => {
    let newUser = new User({
      mobileNumberTemp: mobileNumber,
      isRegistered: false,
    });

    newUser = newUser
      .save()
      .then((userCreated) => {
        console.log("UNREGISTERED USER CREATED!");
        resolve(userCreated);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

module.exports = {
  createUnregisteredUser,
  findUserByEmail,
  findUserById,
  findUserByEmailOrMobileNumber,
  createUser,
};
