const { loginService } = require("../services/auth.service");
const {
  createBillService,
  getBillDetailsService,
  getBillsForUserService,
  editBillService,
  retrieveBillForEditService,
} = require("../services/bill.service");
const { POST, GET } = require("../constants/constants");

const createBill = async (req, res, next) => {
  if (req.method === POST) {
    try {
      const { billDetails, attendees, totalBill, sharedOrders } = req.body;

      const {
        billName,
        formattedDate,
        addGST,
        addServiceCharge,
        discountType,
        discountAmount,
        netBill,
      } = billDetails;

      await createBillService(
        billName,
        formattedDate,
        addGST,
        addServiceCharge,
        discountType,
        discountAmount,
        netBill,
        attendees,
        totalBill,
        sharedOrders
      );

      const { email, password } = req.body;
      const result = await loginService(email, password);
      res.send(result);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

const getBillDetails = async (req, res, next) => {
  if (req.method === GET) {
    try {
      const billId = req.params.billId;
      const details = await getBillDetailsService(billId);
      res.status(200).json(result);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

const getBillsForUser = async (req, res, next) => {
  if (req.method === GET) {
    try {
      const userId = req.params.userId;
      const bills = await getBillsForUserService(userId);
      res.status(200).json(bills);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};
const retrieveBillForEdit = async (req, res, next) => {
  if (req.method === GET) {
    try {
      const billId = req.params.billId;
      const result = await retrieveBillForEditService(billId);
      res.status(200).json(result);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

const editBill = async (req, res, next) => {
  if (req.method === PUT) {
    try {
      const {
        billDetails,
        attendees,
        totalBill,
        sharedOrders,
        updatedBy,
        billId,
      } = req.body;

      const {
        billName,
        formattedDate,
        addGST,
        addServiceCharge,
        discountType,
        discountAmount,
        netBill,
      } = billDetails;
      const bills = await editBillService(
        billName,
        formattedDate,
        addGST,
        addServiceCharge,
        discountType,
        discountAmount,
        netBill,
        attendees,
        totalBill,
        sharedOrders,
        updatedBy,
        billId
      );
    
      res.status(200).json(bills);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

module.exports = {
  createBill,
  getBillDetails,
  getBillsForUser,
  editBill,
  retrieveBillForEdit
};
