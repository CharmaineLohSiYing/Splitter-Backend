const router = require("express").Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
let User = require("../models/user.model");
const { create } = require("../models/user.model");

// get all users
router.route("/").get(async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// ban user
router.route("/:id").delete((req, res) => {
  const adminId = req.body.adminId;

  const id = req.params.id;
  User.findByIdAndUpdate(id, { isBanned: true, updatedBy: adminId })
    .then(() => res.json("User banned."))
    .catch((err) => res.status(400).json("Error: " + err));
});

// update user
router.route("/:id").put((req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const contactNumber = req.body.contactNumber;

  const id = req.params.id;

  User.findByIdAndUpdate(id, { name, email, contactNumber })
    .then(() => res.json("User updated."))
    .catch((err) => res.status(400).json("Error: " + err));
});

const getUserByMobileNumber = async (mobileNumber) => {
  return await User.findOne({
    $or: [
      { mobileNumber },
      { $and: [{ mobileNumberTemp: mobileNumber }, { isRegistered: false }] },
    ],
  });
};

router.route("/:userId").get(async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    const { firstName, lastName, mobileNumber, email } = user;
    const userObj = {
      firstName,
      lastName,
      mobileNumber,
      email,
    };
    return res.status(200).json({ user: userObj });
  } catch (err) {
    return res.status(404).json("User not found");
  }
});

router.route("/name/:userId").put(async (req, res) => {
  const userId = req.params.userId;
  
  const {firstName, lastName} = req.body
  console.log('firstname', firstName)

  try {
    await User.findByIdAndUpdate({_id: userId}, {firstName, lastName})
    return res.status(200).json('Success');
  } catch (err) {
    console.log('err', err)
    return res.status(404).json("User not found");
  }
});

router.route("/email/:userId").put(async (req, res) => {
  const userId = req.params.userId;
  const {email} = req.body

  try {
    const userWithSameEmail = await User.findOne({ email });
    if (userWithSameEmail && userWithSameEmail._id.toString() !== userId) {
      return res.status(400).json("Email already registered");
    }

    await User.findByIdAndUpdate({_id: userId}, {email})
    return res.status(200).json('Success');
  } catch (err) {
    console.log('err', err)
    return res.status(404).json("User not found");
  }
});
router.route("/mobileNumber/:userId").put(async (req, res) => {
  const userId = req.params.userId;
  
  const {mobileNumber} = req.body

  try {
    await User.findByIdAndUpdate({_id: userId}, {mobileNumber})
    return res.status(200).json('Success');
  } catch (err) {
    console.log('err', err)
    return res.status(404).json("User not found");
  }
});

const createUnregisteredUser = (mobileNumber) => {
  return new Promise(function (resolve, reject) {
    let newUser = new User({
      mobileNumberTemp: mobileNumber,
      isRegistered: false,
    });

    newUser = newUser
      .save()
      .then((userCreated) => {
        console.log('USER CREATED!')
        resolve(userCreated);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

module.exports.createUnregisteredUser = createUnregisteredUser;
module.exports.getUserByMobileNumber = getUserByMobileNumber;
module.exports.router = router;
