const { PUT, GET } = require("../constants/constants");
const { getUserByIdService, updateUserNameService, updateUserEmailService, updateUserMobileNumberService } = require("../services/user.service");

const getUserById = async (req, res, next) => {
  if (req.method === GET) {
    try {
      const userId = req.params.userId;
      const result = await getUserByIdService(userId);
      res.status(200).json(result);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

const updateUserName = async (req, res, next) => {
  if (req.method === PUT) {
    try {
      const userId = req.params.userId;
      const {firstName, lastName} = req.body;
      const result = await updateUserNameService(userId, firstName, lastName);
      res.status(200).json(result);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

const updateUserEmail = async (req, res, next) => {
  if (req.method === PUT) {
    try {
      const userId = req.params.userId;
      const {email} = req.body;
      const result = await updateUserEmailService(userId, email);
      res.status(200).json(result);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

const updateUserMobileNumber = async (req, res, next) => {
  if (req.method === PUT) {
    try {
      const userId = req.params.userId;
      const {mobileNumber} = req.body;
      const result = await updateUserMobileNumberService(userId, mobileNumber);
      res.status(200).json(result);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};


module.exports = {
    getUserById,
    updateUserEmail,
    updateUserName,
    updateUserMobileNumber
};
