const { DELETE, GET } = require("../constants/constants");
let User = require("../models/user.model");
let Loan = require("../models/loan.model");
const SharedOrder = require("../models/sharedorder.model");
const UserBill = require("../models/userbill.model");
const Bill = require("../models/bill.model");

const clearDatabase = async (req, res, next) => {
  if (req.method === DELETE) {
    Loan.deleteMany({})
      .then(() => SharedOrder.deleteMany({}))
      .then(() => UserBill.deleteMany({}))
      .then(() => Bill.deleteMany({}))
      .then(() => User.deleteMany({}))
      .then(() => res.status(200).end())
      .catch((err) => {
        console.log(err);
        return res.status(500).end();
      });
  } else {
    res.sendStatus(405);
  }
};
const getAllUsers = async (req, res, next) => {
  if (req.method === GET) {
    const users = await User.find();
    res.status(200).json(users);
  } else {
    res.sendStatus(405);
  }
};

module.exports = {
  clearDatabase,
  getAllUsers,
};
