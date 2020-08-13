const router = require("express").Router();
const moment = require("moment");
let User = require("../models/user.model");
let Loan = require("../models/loan.model");
let Transaction = require("../models/transaction.model");
const userMethods = require("./user");

// calculate debt
router.route("/groupByFriends1/:userId").get((req, res) => {
  const userId = req.params.userId;

  // loans where user is the payer
  Loan.find({
    $and: [
      { isCancelled: false },
      { $or: [{ payer: userId }, { payee: userId }] },
    ],
  })
    .then(async (loanDoc) => {
      if (!loanDoc) {
        return res.status(404).json("LOANS NOT FOUND");
      }
      let netDebt = 0;
      const transactions = await Transaction.find({
        $or: [{ to: userId }, { from: userId }],
      });

      // group loans by the other party's mobile number
      var debts = {};
      var friendUserId;

      // match user id (key) with mobile number
      var mobileNumberDirectory = {};

      for (loan of loanDoc) {
        let friendIsPayer = true;

        if (loan.payee.toString() === userId) {
          friendUserId = loan.payer;
        } else {
          friendIsPayer = false;
          friendUserId = loan.payee;
        }

        if (!(friendUserId in mobileNumberDirectory)) {
          var userDoc = await User.findById(friendUserId);

          var mobileNumber;
          userDoc.isRegistered
            ? (mobileNumber = userDoc.mobileNumber)
            : (mobileNumber = userDoc.mobileNumberTemp);

          mobileNumberDirectory[friendUserId] = mobileNumber;
          debts[mobileNumber] = { userId: friendUserId, debt: 0 };
        }

        if (friendIsPayer) {
          netDebt = netDebt - loan.amount;
          debts[mobileNumberDirectory[friendUserId]].debt =
            debts[mobileNumberDirectory[friendUserId]].debt - loan.amount;
        } else {
          netDebt = netDebt + loan.amount;
          debts[mobileNumberDirectory[friendUserId]].debt =
            debts[mobileNumberDirectory[friendUserId]].debt + loan.amount;
        }
      }

      for (transaction of transactions) {
        let friendIsPayer = true;

        if (transaction.to.toString() !== userId) {
          friendIsPayer = false;
          friendUserId = transaction.to;
        } else {
          friendUserId = transaction.from;
        }

        if (!(friendUserId in mobileNumberDirectory)) {
          var userDoc = await User.findById(friendUserId);

          var mobileNumber;
          userDoc.isRegistered
            ? (mobileNumber = userDoc.mobileNumber)
            : (mobileNumber = userDoc.mobileNumberTemp);

          mobileNumberDirectory[friendUserId] = mobileNumber;
          debts[mobileNumber] = { userId: friendUserId, debt: 0 };
        }

        if (friendIsPayer) {
          netDebt = netDebt + transaction.amount;
          debts[mobileNumberDirectory[friendUserId]].debt =
            debts[mobileNumberDirectory[friendUserId]].debt +
            transaction.amount;
        } else {
          netDebt = netDebt - transaction.amount;
          debts[mobileNumberDirectory[friendUserId]].debt =
            debts[mobileNumberDirectory[friendUserId]].debt -
            transaction.amount;
        }
      }

      return res.status(200).json({ loans: debts, netDebt });
    })
    .catch((err) => {
      {
        return res.status(400).json("Error: " + err);
      }
    });
});

router.route("/groupByFriends/:userId").get((req, res) => {
  const userId = req.params.userId;

  // loans where user is the payer
  Loan.find({
    $and: [
      { isCancelled: false },
      { $or: [{ payer: userId }, { payee: userId }] },
    ],
  })
    .then(async (loanDoc) => {
      if (!loanDoc) {
        return res.status(404).json("LOANS NOT FOUND");
      }

      let borrowed = 0;
      let loaned = 0;
      const borrowedFrom = {};
      const loanedTo = {};

      const transactions = await Transaction.find({
        $or: [{ to: userId }, { from: userId }],
      });

      // group loans by the other party's mobile number
      var debts = {};
      var friendUserId;

      // match user id (key) with mobile number
      var mobileNumberDirectory = {};

      for (loan of loanDoc) {
        let friendIsPayer = true;

        if (loan.payee.toString() === userId) {
          friendUserId = loan.payer;
        } else {
          friendIsPayer = false;
          friendUserId = loan.payee;
        }

        if (!(friendUserId in mobileNumberDirectory)) {
          var userDoc = await User.findById(friendUserId);

          var mobileNumber;
          userDoc.isRegistered
            ? (mobileNumber = userDoc.mobileNumber)
            : (mobileNumber = userDoc.mobileNumberTemp);

          mobileNumberDirectory[friendUserId] = mobileNumber;
          debts[mobileNumber] = { userId: friendUserId, debt: 0 };
        }

        if (friendIsPayer) {
          debts[mobileNumberDirectory[friendUserId]].debt =
            debts[mobileNumberDirectory[friendUserId]].debt - loan.amount;
        } else {
          debts[mobileNumberDirectory[friendUserId]].debt =
            debts[mobileNumberDirectory[friendUserId]].debt + loan.amount;
        }
      }

      for (transaction of transactions) {
        let friendIsPayer = true;

        if (transaction.to.toString() !== userId) {
          friendIsPayer = false;
          friendUserId = transaction.to;
        } else {
          friendUserId = transaction.from;
        }

        if (!(friendUserId in mobileNumberDirectory)) {
          var userDoc = await User.findById(friendUserId);

          var mobileNumber;
          userDoc.isRegistered
            ? (mobileNumber = userDoc.mobileNumber)
            : (mobileNumber = userDoc.mobileNumberTemp);

          mobileNumberDirectory[friendUserId] = mobileNumber;
          debts[mobileNumber] = { userId: friendUserId, debt: 0 };
        }

        if (friendIsPayer) {
          debts[mobileNumberDirectory[friendUserId]].debt =
            debts[mobileNumberDirectory[friendUserId]].debt +
            transaction.amount;
        } else {
          debts[mobileNumberDirectory[friendUserId]].debt =
            debts[mobileNumberDirectory[friendUserId]].debt -
            transaction.amount;
        }
      }

      // split into two groups - borrowedFrom and loanedTo
      for (const key of Object.keys(debts)) {
        const amount = debts[key].debt;
        if (amount < 0) {
          loaned += amount;
          loanedTo[key] = debts[key];
        } else if (amount > 0) {
          borrowed += amount;
          borrowedFrom[key] = debts[key];
        }
      }

      const loans = {
        loanedTo,
        borrowedFrom,
        borrowed,
        loaned,
      };

      return res.status(200).json({ loans });
    })
    .catch((err) => {
      {
        return res.status(400).json("Error: " + err);
      }
    });
});

const getFriendLoans = (userId, friendUserId) => {
  return new Promise((resolve, reject) => {
    Loan.find({
      $and: [
        { isCancelled: false },
        {
          $or: [
            { $and: [{ payer: userId }, { payee: friendUserId }] },
            { $and: [{ payee: userId }, { payer: friendUserId }] },
          ],
        },
      ],
    }).then(async (loanDoc) => {
      if (!loanDoc) {
        return res.status(404).json("LOANS NOT FOUND");
      }

      const transactions = await Transaction.find({
        $or: [
          { $and: [{ to: userId }, { from: friendUserId }] },
          { $and: [{ from: userId }, { to: friendUserId }] },
        ],
      });
      const newArr = loanDoc.concat(transactions);

      newArr.sort(compareByDate);

      // calculate debt
      let debt = 0;

      for (loan of loanDoc) {
        if (loan.payee.toString() === userId) {
          debt -= loan.amount;
        } else {
          debt += loan.amount;
        }
      }

      for (transaction of transactions) {
        if (transaction.to.toString() === userId) {
          debt += transaction.amount;
        } else {
          debt -= transaction.amount;
        }
      }
      resolve({
        loans: newArr,
        debt,
      });
    })
    .catch((err) => {
      reject(err)
    })
  });
};

function compareByDate(a, b) {
  if (a.date < b.date) {
    return 1;
  }
  if (a.date > b.date) {
    return -1;
  }
  return 0;
}
// get arr of loans between user and friend - by nobile number
router
  .route("/friend/mobileNumber/:userId/:friendMobileNumber")
  .get(async (req, res) => {
    const userId = req.params.userId;
    const friendMobileNumber = req.params.friendMobileNumber;
    let retrievedFriend;

    // retrieve friend's id
    const retrievedUser = await userMethods.getUserByMobileNumber(
      friendMobileNumber
    );
    if (!retrievedUser) {
      try {
        retrievedFriend = (
          await userMethods.createUnregisteredUser(friendMobileNumber)
        )._id;
      } catch (err){
        
      }
    } else {
      retrievedFriend = retrievedUser._id;
    }

    try {
      const { loans, debt } = await getFriendLoans(userId, retrievedFriend);
      return res
        .status(200)
        .json({ loans, debt, friendUserId: retrievedFriend });
    } catch (err) {
      return res.status(400).json("Error: " + err);
    }
  });

// get arr of loans between user and friend
router.route("/friend/:userId/:friendUserId").get(async (req, res) => {
  const userId = req.params.userId;
  const friendUserId = req.params.friendUserId;

  try {
    const {loans, debt} = await getFriendLoans(userId, friendUserId)

    return res.status(200).json({ loans, debt });
  } catch (err) {
    return res.status(400).json("Error: " + err);
  }
});

function compareByDate(a, b) {
  if (a.date < b.date) {
    return 1;
  }
  if (a.date > b.date) {
    return -1;
  }
  return 0;
}

// new loan
router.route("/:userId/:friendUserId").post(async(req, res) => {
  console.log('CREATE LOAN =======================================')
  const userId = req.params.userId;
  let friendUserId = req.params.friendUserId;
  const amount = req.body.amount;
  let payerId = req.body.borrower;
  const mobileNumber = req.body.mobileNumber;
  console.log('friendUserId', friendUserId, mobileNumber)
  if (mobileNumber){
    const foundUser = await userMethods.getUserByMobileNumber(friendUserId);
    if (!foundUser){
      console.log('CREATING NEW UNREGISTERED USER')
      friendUserId = (await userMethods.createUnregisteredUser(friendUserId))._id
    } else {
      friendUserId = foundUser._id
    }
  }

  

  var payeeId;
  if (payerId === userId) {
    // payer is current user
    payeeId = friendUserId;
  } else {
    payeeId = userId;
    if (mobileNumber){
      payerId = friendUserId
    }
  }
  const loan = new Loan({
    amount,
    payer: payerId,
    payee: payeeId,
    date: new Date(),
  });

  loan
    .save()
    .then(() => {
      if (mobileNumber){
        return res.status(200).json({friendUserId})
      } else {
        return res.status(200).end()
      }})
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

module.exports.router = router;
