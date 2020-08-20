const {
    findBillAndUpdate,
    findBillById,
    createBill,
  } = require("../data/bill.db");
  const {
    findUserAndUpdate,
    createUnregisteredUser,
  } = require("../data/user.db");
  const { createSharedOrder } = require("../data/sharedorder.db");
  
  const moment = require("moment");
  const User = require("../models/user.model");
  const Bill = require("../models/bill.model");
  const Log = require("../models/log.model");
  const SharedOrder = require("../models/sharedorder.model");
  const Transaction = require("../models/transaction.model");
  const Loan = require("../models/loan.model");
  const UserBill = require("../models/userbill.model");
const { getUserByMobileNumber } = require("../routes/user");
  
  
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

  
  function compareByDate(a, b) {
    if (a.date < b.date) {
      return 1;
    }
    if (a.date > b.date) {
      return -1;
    }
    return 0;
  }

  const createLoanService = async (userId, friendUserId, amount, payerId, mobileNumber) => {
    if (mobileNumber){
        const foundUser = await getUserByMobileNumber(friendUserId);
        if (!foundUser){
          console.log('CREATING NEW UNREGISTERED USER')
          friendUserId = (await createUnregisteredUser(friendUserId))._id
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
            return {friendUserId}
          } else {
            return {}
          }})
     
  }
  
  
  const getLoansGroupedByFriendsService = async (userId) => {
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
    
          return {loans}
        })
  }

  const getLoansByFriendMobileNumberService = async (userId, friendMobileNumber) => {
    let retrievedFriend;
  
      // retrieve friend's id
      const retrievedUser = await getUserByMobileNumber(friendMobileNumber);
      if (!retrievedUser) {
        try {
          retrievedFriend = (
            await createUnregisteredUser(friendMobileNumber)
          )._id;
        } catch (err){
          
        }
      } else {
        retrievedFriend = retrievedUser._id;
      }
  
        const { loans, debt } = await getFriendLoans(userId, retrievedFriend);
        return {loans, debt, friendUserId: retrievedFriend}
  }
  
  const getLoansByFriendUserIdService = async (userId, friendUserId) => {
    const {loans, debt} = await getFriendLoans(userId, friendUserId)
    return { loans, debt }
  }

  
  module.exports = {
    getLoansGroupedByFriendsService,
    getLoansByFriendMobileNumberService,
    getLoansByFriendUserIdService,
    createLoanService
  };
  