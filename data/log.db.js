const Log = require("../models/log.model");

const findLogById = async (logId) => {
  try {
    return await Log.findById(logId);
  } catch (e) {
    console.log(e);
  }
};

const createLog = async (logToCreate) => {
  try {
    return await logToCreate.save();
  } catch (e) {
    throw new Error("Unable to create Log");
  }
};

const findLogAndUpdate = async (logId, toUpdate) => {
  try {
    return await Log.findByIdAndUpdate(logId, toUpdate);
  } catch (e) {
    throw new Error("Unable to create Log");
  }
};

module.exports = {
  findLogById,
  createLog,
  findLogAndUpdate,
};
