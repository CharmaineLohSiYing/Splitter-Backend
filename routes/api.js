const express = require("express");
const router = express.Router();
const { login, signup, verifyOTP, enterNewPassword, requestPasswordReset, resetPassword, changePassword } = require("../controllers/auth.controller");
const { getBillDetails, createBill, getBillsForUser, editBill, retrieveBillForEdit } = require("../controllers/bill.controller");
const { getLoansGroupedByFriends, getLoansByFriendMobileNumber, getLoansByFriendUserId, createLoan } = require("../controllers/loan.controller");
const { createTransaction } = require("../controllers/transaction.controller");
const { getUserById, updateUserName, updateUserEmail, updateUserMobileNumber } = require("../controllers/user.controller");


router.post("/auth/login", login);
router.post("/auth/signup", signup);
router.post("/auth/verifyotp", verifyOTP);


router.post("/auth/requestpasswordreset", requestPasswordReset);
router.post("/auth/resetpassword/:token", resetPassword);
router.post("/auth/enternewpassword", enterNewPassword);
router.put("/auth/changePassword", changePassword);

router.get("/user/:userId", getUserById);
router.put("/user/name/:userId", updateUserName);
router.put("/user/email/:userId", updateUserEmail);
router.put("/user/mobileNumber/:userId", updateUserMobileNumber);

router.post("/bill", createBill);
router.get("/bill/details/:billId", getBillDetails);
router.get("/bill/user/:userId", getBillsForUser);
router.put("/bill/", editBill);
router.get("/bill/retrieveForEdit/:billId", retrieveBillForEdit);

router.get("/loan/groupByFriends/:userId", getLoansGroupedByFriends);
router.get("/loan/friend/mobileNumber/:userId/:friendMobileNumber", getLoansByFriendMobileNumber);
router.get("/loan/friend/:userId/:friendUserId", getLoansByFriendUserId);
router.post("/loan/:userId/:friendUserId", createLoan);

router.post("/transaction/:userId/:friendUserId", createTransaction);





module.exports = router;
