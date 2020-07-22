const router = require("express").Router();
let UserEvent = require("../models/userevent.model");
let Loan = require("../models/loan.model");
let SharedOrder = require("../models/sharedorder.model");
let User = require("../models/user.model");

// get userevent - populate user, loans and orders
router.route("/:id").get(async (req, res) => {
  const userEventId = req.params.id;
  UserEvent.findById(userEventId)
    .populate("user")
    .populate({ path: 'loans', model: Loan })
    .populate({ path: 'orders', model: Order })
    .then((populatedUserEvent) => res.status(200).json({userEvent: populatedUserEvent})).catch(err => res.status(400).json(err))
   
});

module.exports = router;
