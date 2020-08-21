const { loginService } = require("../services/auth.service");
const {
  createBillService,
  getBillDetailsService,
  getBillsForUserService,
  editBillService,
  retrieveBillForEditService,
} = require("../services/bill.service");
const { POST, GET } = require("../constants/constants");
const { getLoansGroupedByFriendsService, getLoansByFriendMobileNumberService, getLoansByFriendUserIdService, createLoanService } = require("../services/loan.service");

const getLoansGroupedByFriends = async (req, res, next) => {
  if (req.method === GET) {
    try {
      const { userId } = req.params;
      const result = await getLoansGroupedByFriendsService(userId);
      res.status(200).json(result);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};
const getLoansByFriendUserId = async (req, res, next) => {
  if (req.method === GET) {
    try {
      const { userId, friendUserId } = req.params;
      const result = await getLoansByFriendUserIdService(userId, friendUserId);

      res.status(200).json(result);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

const getLoansByFriendMobileNumber = async (req, res, next) => {
  if (req.method === GET) {
    try {
      const { userId, friendMobileNumber } = req.params;
      const result = await getLoansByFriendMobileNumberService(userId, friendMobileNumber);

      res.status(200).json(result);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

const createLoan = async (req, res, next) => {
  if (req.method === POST) {
    try {
        const userId = req.params.userId;
        const friendUserId = req.params.friendUserId;
        const amount = req.body.amount;
        const payerId = req.body.borrower;
        const mobileNumber = req.body.mobileNumber;
        const result = await createLoanService(userId, friendUserId, amount, payerId, mobileNumber); 
        res.status(200).json(result);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

module.exports = {
  getLoansGroupedByFriends,
  getLoansByFriendMobileNumber,
  getLoansByFriendUserId,
  createLoan
};
