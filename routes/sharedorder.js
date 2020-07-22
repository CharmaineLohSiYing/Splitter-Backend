const router = require("express").Router();
let User = require("../models/user.model");
let Log = require("../models/log.model");
let Loan = require("../models/loan.model");
let SharedOrder = require("../models/sharedorder.model");
const { create } = require("../models/user.model");

const createSharedOrder = (users, amount) => {
  return new Promise(function (resolve, reject) {
    let newOrder = new SharedOrder({
      users,
      amount,
    });

    newOrder = newOrder
      .save()
      .then((orderCreated) => {
        console.log("shared order created!");
        resolve(orderCreated);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

module.exports.createSharedOrder = createSharedOrder
module.exports.router = router;
