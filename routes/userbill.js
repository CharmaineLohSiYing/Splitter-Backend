const router = require("express").Router();
let UserBill = require("../models/userbill.model");
let Loan = require("../models/loan.model");
let SharedOrder = require("../models/sharedorder.model");
let User = require("../models/user.model");

// get userbill - populate user, loans and orders
router.route("/:id").get(async (req, res) => {
  const userBillId = req.params.id;
  UserBill.findById(userBillId)
    .populate("user")
    .populate({ path: 'loans', model: Loan })
    .populate({ path: 'orders', model: Order })
    .then((populatedUserBill) => res.status(200).json({userBill: populatedUserBill})).catch(err => res.status(400).json(err))
   
});

module.exports = router;
