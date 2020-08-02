const router = require("express").Router();
let User = require("../models/user.model");
let Log = require("../models/log.model");
let Loan = require("../models/loan.model");
let Bill = require("../models/bill.model");
const { create } = require("../models/user.model");

const createLog = (updatedAt, updatedBy, details, bill) => {
  return new Promise((resolve, reject) => {
    let newLog = new Log({
      updatedAt,
      updatedBy,
      details,
      bill,
    });
    newLog
      .save()
      .then((createdLog) => {
        resolve(createdLog);
      })
      .catch((err) => reject(err));
  });
};

module.exports.createLog = createLog;
module.exports.router = router;
