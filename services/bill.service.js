const {
  findBillAndUpdate,
  findBillById,
  createBill,
} = require("../data/bill.db");
const { createUnregisteredUser } = require("../data/user.db");
const { createSharedOrder } = require("../data/sharedorder.db");

const { createLog } = require("../data/log.db");

const moment = require("moment");
const User = require("../models/user.model");
const Bill = require("../models/bill.model");
const Log = require("../models/log.model");
const SharedOrder = require("../models/sharedorder.model");
const Loan = require("../models/loan.model");
const UserBill = require("../models/userbill.model");
const { getUserByMobileNumber } = require("../routes/user");

const updateSharedOrder = async (
  billId,
  attendees,
  orderId,
  sharers,
  amount
) => {
  return new Promise(async function (resolve, reject) {
    let originalOrder = await SharedOrder.findById(orderId);

    for (const sharer of sharers) {
      if (!originalOrder.users.includes(sharer)) {
        // new sharer
        // retrieve sharer's userbill
        attendees[sharer].userBill.sharedOrders = attendees[
          sharer
        ].userBill.sharedOrders.concat(orderId);
      }
    }
    for (const originalSharer of originalOrder.users) {
      if (!sharers.includes(originalSharer.toString())) {
        // sharer has been removed
        try {
          attendees[originalSharer].userBill.sharedOrders = attendees[
            originalSharer
          ].userBill.sharedOrders.filter((order) => {
            order._id !== orderId;
          });
        } catch (err) {
          console.log(err);
          console.log(attendees[originalSharer].userBill);
          throw err;
        }
      }
    }

    // if amount has been changed
    if (originalOrder.amount != amount) {
      originalOrder.amount = amount;
    }

    originalOrder.users = sharers;

    originalOrder
      .save()
      .then((updatedSharedOrder) => {
        resolve(updatedSharedOrder);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const addUserBillToUser = (user, userBillId) => {
  return new Promise(function (resolve, reject) {
    let updatedUserBills;
    user.userBills
      ? (updatedUserBills = user.userBills)
      : (updatedUserBills = []);
    updatedUserBills.push(userBillId);
    user.userBills = updatedUserBills;

    user = user
      .save()
      .then((updatedUser) => {
        resolve(updatedUser);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const handleSharedOrders_edit = async (
  attendees,
  sharedOrders,
  updatedSharedOrdersArr,
  billId,
  originalBill
) => {
  console.log("handle shared orders start");
  for (let sharedOrder of sharedOrders) {
    let amount = sharedOrder.amount;
    let sharers = sharedOrder.users;
    let splitAmount = parseFloat(
      (parseFloat(amount) / sharers.length).toFixed(2)
    );

    if (!sharedOrder._id) {
      // new shared order
      const newSharedOrder = await createSharedOrder(
        new SharedOrder({ users: sharers, amount })
      );
      updatedSharedOrdersArr.push(newSharedOrder);

      // update user bills with new shared order
      for (let sharer of sharers) {
        attendees[sharer].userBill.sharedOrders = attendees[
          sharer
        ].userBill.sharedOrders.concat(newSharedOrder._id);
      }
    } else {
      let updatedSharedOrder = await updateSharedOrder(
        billId,
        attendees,
        sharedOrder._id,
        sharers,
        amount
      );
      updatedSharedOrdersArr.push(updatedSharedOrder);
    }

    // update sharers' userbills with split amount
    // sharers is an array of userIds
    sharers.forEach((sharer) => {
      let targetedAttendee = attendees[sharer];
      attendees[sharer] = {
        ...attendees[sharer],
        amount: targetedAttendee.amount + splitAmount,
        debt: targetedAttendee.debt + splitAmount,
      };
    });
  }
  for (let oldOrder of originalBill.sharedOrders) {
    const found = updatedSharedOrdersArr.some(
      (sharedOrder) => sharedOrder._id.toString() === oldOrder._id.toString()
    );
    if (!found) {
      // shared order has been removed
      // remove order reference from bill and user bills
      try {
        for (let sharerId of oldOrder.users) {
          attendees[sharerId].userBill.sharedOrders = attendees[
            sharerId
          ].userBill.sharedOrders.filter(
            (order) => order._id.toString() != oldOrder._id.toString()
          );
        }
      } catch (err) {
        console.log(originalBill.sharedOrders, err);
      }
    }
  }
  console.log("handle shared orders end");
};


const handleGSTAndServiceCharge = (amount, hasGST, hasServiceCharge) => {
  let multiplier = 1;
  if (hasGST){
    multiplier += 0.07;
  }

  if (hasServiceCharge){
    multiplier += 0.1
  }

  return amount * multiplier;
}

const cancelPreviousLoans = async (billId) => {
  console.log("cancel previous loans start");
  let loansToCancel = await Loan.find({ bill: billId, isCancelled: false });
  for (let loan of loansToCancel) {
    loan.isCancelled = true;
    loan.save().then(() => console.log("cancel previous loans end"));
  }
};

const handleAttendees_edit = async (attendees, billId) => {
  console.log("handle attendees start");
  // key should be user's mongoose id
  for (key of Object.keys(attendees)) {
    let targetedAttendee = attendees[key];

    // retrieve user bill associated to user
    let attendeeUserBill = await UserBill.findOne({
      bill: billId,
      user: key,
    });
    if (!attendeeUserBill) {
      return res.status(404).json("user bill cannot be found");
    }

    // account for gst / service charge
    targetedAttendee.amount = handleGSTAndServiceCharge(targetedAttendee.amount, bill.hasGST, bil.hasServiceCharge);

    // modify attendees object to add in user id and add debt value
    let debt = targetedAttendee.amount - targetedAttendee.paidAmount;

    (attendeeUserBill.individualOrderAmount = targetedAttendee.amount),
      (attendeeUserBill.amountPaid = targetedAttendee.paidAmount),
      (attendees[key] = {
        ...attendees[key],
        mongooseId: key,
        debt,
        userBill: attendeeUserBill,
      });
  }
  console.log("handle attendees end");
};

const handleAttendees = async (attendees, retrievedUsers, bill) => {
  console.log("handle attendees start");
  // trace each attendee for their user id
  for (key of Object.keys(attendees)) {
    let retrievedUser;
    let targetedAttendee = attendees[key];
    const mobileNumber = targetedAttendee.mobileNumber;
    let user;

    user = await getUserByMobileNumber(mobileNumber);

    if (!user) {
      retrievedUser = await createUnregisteredUser(mobileNumber);
    } else {
      if (targetedAttendee.currentUser === true) {
        bill.createdBy = user._id;
      }
      retrievedUser = user;
    }

    retrievedUsers.push(retrievedUser);

    // account for gst / service charge
    targetedAttendee.amount = handleGSTAndServiceCharge(targetedAttendee.amount, bill.hasGST, bill.hasServiceCharge);

    // create new userbill
    let newUserBill = new UserBill({
      individualOrderAmount: targetedAttendee.amount,
      amountPaid: targetedAttendee.paidAmount,
      sharedOrders: [],
      user: retrievedUser._id,
      bill: null,
    });

    // modify attendees object to add in user id and add debt value
    let debt = targetedAttendee.amount - targetedAttendee.paidAmount;

    // attach mongooseid, new user bill and debt to attendee object
    attendees[key] = {
      ...attendees[key],
      mongooseId: retrievedUser._id,
      debt,
      userBill: newUserBill,
    };
  }

  console.log("handle attendees end");
};

const handleSharedOrders = async (sharedOrders, attendees, newBill) => {
  console.log("handle shared orders start");
  for (sharedOrder of sharedOrders) {
    let sharerMongooseIds = [];

    sharedOrder.amount = handleGSTAndServiceCharge(sharedOrder.amount, newBill.hasGST, newBill.hasServiceCharge);

    let amount = sharedOrder.amount;
    let sharers = sharedOrder.users;

    let splitAmount = parseFloat(
      (parseFloat(amount) / sharers.length).toFixed(2)
    );

    for (sharer of sharers) {
      sharerMongooseIds.push(attendees[sharer].mongooseId);
    }

    let newSharedOrder = await createSharedOrder(
      new SharedOrder({ users: sharerMongooseIds, amount })
    );
    newBill.sharedOrders.push(newSharedOrder._id);

    sharers.forEach((sharer) => {
      // add new shared order to user bill
      attendees[sharer].userBill.sharedOrders = attendees[
        sharer
      ].userBill.sharedOrders.concat(newSharedOrder._id);
      // update debt and total expenditure
      attendees[sharer] = {
        ...attendees[sharer],
        amount: attendees[sharer].amount + splitAmount,
        debt: attendees[sharer].debt + splitAmount,
      };
    });
  }
  console.log("handle shared orders end");
};

const handleLoans = (attendees, persistedBillId, billDate) => {
  console.log("handle loans start");
  // if debt is positive, need to pay someone
  let toPay = [];
  let toReceive = [];

  Object.keys(attendees).forEach((attendeeId) => {
    let targetedAttendee = attendees[attendeeId];

    // add bill reference to user bills
    targetedAttendee.userBill.bill = persistedBillId;

    // split attendees into those into payers and payees
    if (targetedAttendee.debt < 0) {
      toReceive.push(targetedAttendee);
    } else if (targetedAttendee.debt > 0) {
      toPay.push(targetedAttendee);
    }
  });

  let payerIndex = 0;
  let loanAmount = 0;
  let loansToCreate = [];
  for (receiver of toReceive) {
    let remainingToReceive = Math.abs(receiver.debt);

    while (remainingToReceive > 0 && payerIndex < toPay.length) {
      let targetPayer = toPay[payerIndex];
      let difference = targetPayer.debt - remainingToReceive;

      if (difference <= 0) {
        // console.log('payer has cleared his debt. receiver needs to collect from next payer')
        remainingToReceive = Math.abs(difference);
        loanAmount = targetPayer.debt;
        targetPayer.debt = 0;
        payerIndex++;
      } else if (difference > 0) {
        // console.log('receiver does not need to collect from next payer. payer needs to pay next receiver')
        targetPayer.debt = difference;
        loanAmount = remainingToReceive;
        remainingToReceive = 0;
      } else {
        // console.log('move on to next receiver and payer')
        loanAmount = remainingToReceive;
        targetPayer.debt = 0;
        remainingToReceive = 0;
        payerIndex++;
      }

      loansToCreate.push(
        new Loan({
          payer: targetPayer.mongooseId,
          payee: receiver.mongooseId,
          amount: loanAmount,
          bill: persistedBillId,
          date: new Date(billDate),
        })
      );
    }
  }
  // create loans in bulk
  Loan.insertMany(loansToCreate)
    .then(() => console.log("handle loans end"))
    .catch((err) => console.log(err));
};

const handleUserBills = async (attendees) => {
  console.log("handle user bills start");
  for (key of Object.keys(attendees)) {
    let createdUserBill = await attendees[key].userBill.save();
    let retrievedUser = await User.findById(attendees[key].mongooseId);
    await addUserBillToUser(retrievedUser, createdUserBill._id);
  }
  console.log("handle user bills end");
};

const createBillService = async (
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
) => {
  let newBill = new Bill({
    billName: billName ? billName : "Bill",
    date: new Date(formattedDate),
    createdAt: new Date(),
    hasGST: addGST,
    hasServiceCharge: addServiceCharge,
    discountType,
    discountAmount,
    netBill,
    totalBill,
    sharedOrders: [],
  });

  let retrievedUsers = [];

  await handleAttendees(attendees, retrievedUsers, newBill);
  await handleSharedOrders(sharedOrders, attendees, newBill);

  let createdBill = await createBill(newBill);

  await createLog(
    new Log({
      updatedAt: new Date(),
      updatedBy: createdBill.createdBy,
      details: "created bill",
      bill: createdBill._id,
    })
  );

  handleLoans(attendees, createdBill._id, formattedDate);

  await handleUserBills(attendees);

  // retrieve creator's userbill and return success
  const userBillToReturn = await UserBill.find({
    user: createdBill.createdBy,
  })
    .populate({
      path: "bill",
      model: Bill,
    })
    .populate({
      path: "sharedOrders",
      model: SharedOrder,
    });

  return {
    userBill: userBillToReturn,
  };
};

const getBillDetailsService = async (billId) => {
  const bill = await Bill.findById(billId);
  const loans = await Loan.find({ bill: billId });
  const logs = await Log.find({ bill: billId });
  const userBills = await UserBill.find({ bill: billId })
    .populate({
      path: "user",
      model: User,
    })
    .populate({
      path: "sharedOrders",
      model: SharedOrder,
    });

  return { loans, userBills, bill, logs };
};

const getBillsForUserService = async (userId) => {
  const userBills = await UserBill.find({ user: userId })
    .populate({
      path: "bill",
      model: Bill,
      populate: {
        path: "sharedOrders",
        model: "SharedOrder",
      },
    })
    .populate({
      path: "sharedOrders",
      model: SharedOrder,
    });
  return { userBills };
};

const editBillService = async (
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
) => {
  await createLog(new Date(), updatedBy, "edited bill", billId);
  let originalBill = await Bill.findById(billId).populate({
    path: "sharedOrders",
    model: SharedOrder,
  });

  let updatedSharedOrdersArr = [];

  originalBill.billName = billName;
  originalBill.date = new Date(formattedDate);
  originalBill.hasGST = addGST;
  originalBill.hasServiceCharge = addServiceCharge;
  originalBill.discountType = discountType;
  originalBill.discountAmount = discountAmount;
  originalBill.netBill = netBill;
  originalBill.totalBill = totalBill;

  await handleAttendees_edit(attendees, billId);
  await handleSharedOrders_edit(
    attendees,
    sharedOrders,
    updatedSharedOrdersArr,
    billId,
    originalBill
  );
  cancelPreviousLoans(billId);
  handleLoans(attendees, billId, formattedDate);

  // update userbills
  for (key of Object.keys(attendees)) {
    await attendees[key].userBill.save();
  }

  // update bill
  originalBill.sharedOrders = updatedSharedOrdersArr;
  await originalBill.save();

  const userBillToReturn = await UserBill.findOne({
    user: updatedBy,
    bill: billId,
  })
    .populate({
      path: "bill",
      model: Bill,
    })
    .populate({
      path: "sharedOrders",
      model: SharedOrder,
    });
  console.log("edit bill done");
  return {
    userBill: userBillToReturn,
  };
};

const retrieveBillForEditService = async (billId) => {
  const bill = await Bill.findById(billId).populate({
    path: "sharedOrders",
    model: SharedOrder,
  });

  if (!bill) {
    return res.status(404).json({ error: "Invalid bill ID" });
  }

  const userBills = await UserBill.find({ bill: billId }).populate({
    path: "user",
    model: User,
  });

  if (!userBills) {
    return res.status(404).json({ error: "Unable to retrieve user bills" });
  }
  return { bill, userBills };
};

module.exports = {
  createBillService,
  getBillDetailsService,
  getBillsForUserService,
  editBillService,
  retrieveBillForEditService,
};
