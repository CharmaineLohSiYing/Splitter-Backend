const SharedOrder = require("../models/sharedorder.model");

const findSharedOrderById = async (sharedOrderId) => {
  try {
    return await SharedOrder.findById(sharedOrderId);
  } catch (e) {
    console.log(e);
  }
};

const createSharedOrder = async (sharedOrderToCreate) => {
  try {
    return await sharedOrderToCreate.save();
  } catch (e) {
    throw new Error("Unable to create SharedOrder");
  }
};

const findSharedOrderAndUpdate = async (sharedOrderId, toUpdate) => {
  try {
    return await SharedOrder.findByIdAndUpdate(sharedOrderId, toUpdate);
  } catch (e) {
    throw new Error("Unable to create SharedOrder");
  }
};

module.exports = {
  findSharedOrderById,
  createSharedOrder,
  findSharedOrderAndUpdate,
};
