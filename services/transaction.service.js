const {
  findBillAndUpdate,
  findBillById,
  createBill,
} = require("../data/bill.db");
const {
  findUserAndUpdate,
  createUnregisteredUser,
} = require("../data/user.db");

const moment = require("moment");
const Transaction = require("../models/transaction.model");
const { createTransaction } = require("../data/transaction.db");

const createTransactionService = async (userId, friendUserId, amount) => {
  const txn = new Transaction({
    amount,
    to: friendUserId,
    from: userId,
    date: new Date(),
  });

  await createTransaction(txn);
  return;
};

module.exports = {
  createTransactionService,
};
