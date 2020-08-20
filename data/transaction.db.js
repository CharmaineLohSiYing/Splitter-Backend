const Transaction = require("../models/transaction.model");

const createTransaction = async (transactionToCreate) => {
  try {
    return await transactionToCreate.save();
  } catch (e) {
    throw new Error("Unable to create Transaction");
  }
};

module.exports = {
  createTransaction,
};
