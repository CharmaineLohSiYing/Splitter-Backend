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
const { createTransactionService } = require("../services/transaction.service");

const createTransaction = async (req, res, next) => {
  if (req.method === POST) {
    try {
        const userId = req.params.userId;
        const friendUserId = req.params.friendUserId;
        const amount = req.body.amount;

        const result = await createTransactionService(userId, friendUserId, amount); 
        res.status(200).json(result);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

module.exports = {
    createTransaction
};
