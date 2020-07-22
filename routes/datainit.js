const router = require("express").Router();
let User = require("../models/user.model");
let Loan = require("../models/loan.model");
const SharedOrder = require("../models/sharedorder.model");
const UserEvent = require("../models/userevent.model");
const Event = require("../models/event.model");

router.route("/all").delete((req, res) =>
  Loan.deleteMany({})
    .then(() => SharedOrder.deleteMany({}))
    .then(() => UserEvent.deleteMany({}))
    .then(() => Event.deleteMany({}))
    .then(() => User.deleteMany({}))
    .then(() => res.status(200).end())
    .catch(err => {console.log(err); return res.status(500).end()})
);


module.exports = router;
