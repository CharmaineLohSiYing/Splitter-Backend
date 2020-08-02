const router = require("express").Router();
let User = require("../models/user.model");
let Loan = require("../models/loan.model");
const SharedOrder = require("../models/sharedorder.model");
const UserBill = require("../models/userbill.model");
const Bill = require("../models/bill.model");

router.route("/all").delete((req, res) =>
  Loan.deleteMany({})
    .then(() => SharedOrder.deleteMany({}))
    .then(() => UserBill.deleteMany({}))
    .then(() => Bill.deleteMany({}))
    .then(() => User.deleteMany({}))
    .then(() => res.status(200).end())
    .catch(err => {console.log(err); return res.status(500).end()})
);


module.exports = router;
