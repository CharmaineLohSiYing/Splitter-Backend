const express = require("express");
const router = express.Router();
const { login, signup, verifyOTP } = require("../controllers/auth.controller");
const { getBillDetails, createBill, getBillsForUser, editBill, retrieveBillForEdit } = require("../controllers/bill.controller");
const { getLoansGroupedByFriends, getLoansByFriendMobileNumber, getLoansByFriendUserId, createLoan } = require("../controllers/loan.controller");
const { createTransaction } = require("../controllers/transaction.controller");


router.post("/auth/login", login);
router.post("/auth/signup", signup);
router.post("/auth/verifyotp", verifyOTP);


router.post("/bill/add", createBill);
router.get("/bill/details/:billId", getBillDetails);
router.get("/bill/user/:userId", getBillsForUser);
router.put("/bill/", editBill);
router.get("/bill/retrieveForEdit/:billId", retrieveBillForEdit);

router.get("/loan/groupByFriends/:userId", getLoansGroupedByFriends);
router.get("/loan/friend/mobileNumber/:userId/:friendMobileNumber", getLoansByFriendMobileNumber);
router.get("/loan/friend/:userId/:friendUserId", getLoansByFriendUserId);
router.post("/loan/:userId/:friendUserId", createLoan);

router.get("/transaction/:userId/:friendUserId", createTransaction);





module.exports = router;
