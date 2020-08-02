const router = require("express").Router();
const moment = require("moment");
let User = require("../models/user.model");
let Loan = require("../models/loan.model");
let Transaction = require("../models/transaction.model");

// calculate debt
router.route("/groupByFriends/:userId").get((req, res) => {
  const userId = req.params.userId;

  // loans where user is the payer
  Loan.find({ $and: [{isCancelled: false}, {$or: [{ payer: userId }, { payee: userId }] }]})
    .then(async (loanDoc) => {
      if (!loanDoc) {
        return res.status(404).json("LOANS NOT FOUND");
      }
      let netDebt = 0;
      const transactions = await Transaction.find({$or: [{ to: userId }, { from: userId }] })

      // group loans by the other party's mobile number
      var debts = {};
      var friendUserId;

      // match user id (key) with mobile number
      var mobileNumberDirectory = {};

      for (loan of loanDoc) {
        let friendIsPayer = true

        if (loan.payee.toString() === userId){
          friendUserId = loan.payer
        } else {
          friendIsPayer = false
          friendUserId = loan.payee
        }

        if (!(friendUserId in mobileNumberDirectory)) {
          var userDoc = await User.findById(friendUserId);

          var mobileNumber;
          userDoc.isRegistered
            ? (mobileNumber = userDoc.mobileNumber)
            : (mobileNumber = userDoc.mobileNumberTemp);

          mobileNumberDirectory[friendUserId] = mobileNumber;
          debts[mobileNumber] = {userId: friendUserId, debt: 0};
        } 

        if (friendIsPayer){
          netDebt = netDebt - loan.amount;
          debts[mobileNumberDirectory[friendUserId]].debt = debts[mobileNumberDirectory[friendUserId]].debt - loan.amount
        } else {
          netDebt = netDebt + loan.amount;
          debts[mobileNumberDirectory[friendUserId]].debt = debts[mobileNumberDirectory[friendUserId]].debt + loan.amount
        }
      }

      for (transaction of transactions) {
        let friendIsPayer = true

        if (transaction.to.toString() !== userId){
          friendIsPayer = false
          friendUserId = transaction.to
        } else {
          friendUserId = transaction.from
        }

        if (!(friendUserId in mobileNumberDirectory)) {
          var userDoc = await User.findById(friendUserId);

          var mobileNumber;
          userDoc.isRegistered
            ? (mobileNumber = userDoc.mobileNumber)
            : (mobileNumber = userDoc.mobileNumberTemp);

          mobileNumberDirectory[friendUserId] = mobileNumber;
          debts[mobileNumber] = {userId: friendUserId, debt: 0};
        } 

        if (friendIsPayer){
          netDebt = netDebt + transaction.amount;
          debts[mobileNumberDirectory[friendUserId]].debt = debts[mobileNumberDirectory[friendUserId]].debt + transaction.amount
        } else {
          netDebt = netDebt - transaction.amount;
          debts[mobileNumberDirectory[friendUserId]].debt = debts[mobileNumberDirectory[friendUserId]].debt - transaction.amount
        }
      }

      return res.status(200).json({loans: debts, netDebt});
    })
    .catch((err) => {
      {
        return res.status(400).json("Error: " + err);
      }
    });
});

// get arr of loans between user and friend
router.route("/friend/:userId/:friendUserId").get((req, res) => {
  const userId = req.params.userId;
  const friendUserId = req.params.friendUserId;

  Loan.find({ $and: [{isCancelled: false}, {$or: [{$and: [{ payer: userId }, { payee: friendUserId }]}, {$and: [{ payee: userId }, { payer: friendUserId }]}] }]})
    .then(async (loanDoc) => {
      if (!loanDoc) {
        return res.status(404).json("LOANS NOT FOUND");
      }

      const transactions = await Transaction.find({$or: [{ to: userId }, { from: userId }] })
      const newArr = loanDoc.concat(transactions)

      newArr.sort( compareByDate );

      // calculate debt
      let debt = 0

      for (loan of loanDoc) {
        if (loan.payee.toString() === userId){
          debt -= loan.amount
        } else {
          debt += loan.amount
        }
      }

      for (transaction of transactions) {
        if (transaction.to.toString() === userId){
          debt += transaction.amount
        } else {
          debt -= transaction.amount
        }
      }

      return res.status(200).json({loans: newArr, debt});
    })
    .catch((err) => {
      {
        return res.status(400).json("Error: " + err);
      }
    });
});

function compareByDate( a, b ) {
  if ( a.date < b.date ){
    return 1;
  }
  if ( a.date > b.date ){
    return -1;
  }
  return 0;
}

// new loan
router.route("/:userId/:friendUserId").post((req, res) => {
  const userId = req.params.userId;
  const friendUserId = req.params.friendUserId;
  const amount = req.body.amount;
  const payerId = req.body.borrower
  var payeeId; 
  if (payerId  === userId){
    // payer is current user
    payeeId = friendUserId
  } else {
    payeeId = userId
  }
  const loan = new Loan({
    amount,
    payer: payerId,
    payee: payeeId,
    date: new Date()
  });

  loan
    .save()
    .then(() => res.status(200).end())
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});


module.exports.router = router;
