const Bill = require("../models/bill.model");

const findBillById = async (billId) => {
  try {
    return await Bill.findById(billId);
  } catch (e) {
    console.log(e);
  }
};

const createBill = async (billToCreate) => {
  try {
    return await billToCreate.save();
  } catch (e) {
    throw new Error("Unable to create Bill");
  }
};

const findBillAndUpdate = async (billId, toUpdate) => {
  try {
    return await Bill.findByIdAndUpdate(billId, toUpdate);
  } catch (e) {
    throw new Error("Unable to create Bill");
  }
};

module.exports = {
  findBillById,
  createBill,
  findBillAndUpdate,
};
