const router = require("express").Router();
const User = require("../models/user.model");
const Log = require("../models/log.model");
const SharedOrder = require("../models/sharedorder.model");
const Loan = require("../models/loan.model");
const Event = require("../models/event.model");
const UserEvent = require("../models/userevent.model");
const userMethods = require('./user')
const sharedOrderMethods = require('./sharedorder')
const logMethods = require('./log')


const updateSharedOrder = async (
  eventId,
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
        // retrieve sharer's userevent
        attendees[sharer].userEvent.sharedOrders = attendees[
          sharer
        ].userEvent.sharedOrders.concat(orderId);
      }
    }
    for (const originalSharer of originalOrder.users) {
      if (!sharers.includes(originalSharer.toString())) {
        // sharer has been removed
        try {
        attendees[originalSharer].userEvent.sharedOrders = attendees[
          originalSharer
        ].userEvent.sharedOrders.filter((order) => {
          order._id !== orderId;
        });
      } catch (err){
        console.log(err)
        console.log(attendees[originalSharer].userEvent)
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

const createEvent = (toCreate) => {
  console.log('create event start')
  return new Promise(function (resolve, reject) {
    toCreate = toCreate
      .save()
      .then((eventCreated) => {
        console.log('create event end')
        resolve(eventCreated);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const addUserEventToUser = (user, userEventId) => {
  return new Promise(function (resolve, reject) {
    let updatedUserEvents;
    user.userEvents
      ? (updatedUserEvents = user.userEvents)
      : (updatedUserEvents = []);
    updatedUserEvents.push(userEventId);
    user.userEvents = updatedUserEvents;

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

router.route("/user/:userId").get(async (req, res) => {
  try {
    const userId = req.params.userId;
    const userEvents = await UserEvent.find({ user: userId }).populate({
      path: "event",
      model: Event,
      populate: {
        path: 'sharedOrders',
        model: 'SharedOrder'
      } 
    }).populate({
      path: "sharedOrders",
      model: SharedOrder,
    });
        return res.status(200).json({userEvents})
  } catch (err) {
    return res.status(400).json(err);
  }
});

// loans and shared orders associated to event
router.route("/details/:eventId").get(async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const event = await Event.findById(eventId)
    const loans = await Loan.find({ event: eventId });
    const logs = await Log.find({event: eventId})
    const userEvents = await UserEvent.find({ event: eventId }).populate({
      path: "user",
      model: User,
    }).populate({
      path: "sharedOrders",
      model: SharedOrder,
    });
    return res.status(200).json({loans, userEvents, event, logs})
  } catch (err) {
    return res.status(400).json(err);
  }
});

const handleSharedOrders_edit = async (attendees, sharedOrders, updatedSharedOrdersArr, eventId, originalEvent) => {
  console.log('handle shared orders start')
  for (let sharedOrder of sharedOrders) {
    let amount = sharedOrder.amount;
    let sharers = sharedOrder.users;
    let splitAmount = parseFloat((parseFloat(amount) / sharers.length).toFixed(2));

    if (!sharedOrder._id) {
      
      // new shared order
      const newSharedOrder = await sharedOrderMethods.createSharedOrder(sharers, amount);
      updatedSharedOrdersArr.push(newSharedOrder)

      // update user events with new shared order
      for (let sharer of sharers) {
        attendees[sharer].userEvent.sharedOrders = attendees[
          sharer
        ].userEvent.sharedOrders.concat(newSharedOrder._id);
      }
    } else {
      
      let updatedSharedOrder = await updateSharedOrder(
        eventId,
        attendees,
        sharedOrder._id,
        sharers,
        amount
      );
      updatedSharedOrdersArr.push(updatedSharedOrder)
    }

    // update sharers' userevents with split amount
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
  for (let oldOrder of originalEvent.sharedOrders) {
    const found = updatedSharedOrdersArr.some(sharedOrder => sharedOrder._id.toString() === oldOrder._id.toString());
    if (!found){
      // shared order has been removed
      // remove order reference from event and user events
      try {
      for (let sharerId of oldOrder.users) {
          attendees[sharerId].userEvent.sharedOrders = attendees[
            sharerId
          ].userEvent.sharedOrders.filter((order) => order._id.toString() != oldOrder._id.toString());
        }
      }catch (err){
        console.log(originalEvent.sharedOrders, err)
      }
    }
  }
  console.log('handle shared orders end')
}

const cancelPreviousLoans = async (eventId) => {
  console.log('cancel previous loans start')
  let loansToCancel = await Loan.find({ event: eventId, isCancelled: false});
  for (let loan of loansToCancel) {
    loan.isCancelled = true;
    loan.save().then(() => console.log('cancel previous loans end'));
  }

}

router.route("/edit").post(async (req, res) => {
  console.log('=====================edit event start======================')
  try {
    const { billDetails, attendees, totalBill, sharedOrders, updatedBy, eventId } = req.body;

    const {
      eventName,
      formattedDate,
      addGST,
      addServiceCharge,
      discountType,
      discountAmount,
      netBill,
    } = billDetails;


    await logMethods.createLog(new Date(), updatedBy, 'edit event', eventId)
       

    let originalEvent = await Event.findById(eventId).populate({
      path: "sharedOrders",
      model: SharedOrder,
    })

    let updatedSharedOrdersArr = []

    originalEvent.eventName = eventName
    originalEvent.date = new Date(formattedDate)
    originalEvent.hasGST = addGST
    originalEvent.hasServiceCharge = addServiceCharge
    originalEvent.discountType = discountType
    originalEvent.discountAmount = discountAmount
    originalEvent.netBill = netBill
    originalEvent.totalBill = totalBill

    await handleAttendees_edit(attendees, eventId)
    await handleSharedOrders_edit(attendees, sharedOrders, updatedSharedOrdersArr, eventId, originalEvent)
    cancelPreviousLoans(eventId)
    handleLoans(attendees, eventId, formattedDate)

    // update userevents
    for (key of Object.keys(attendees)) {
      await attendees[key].userEvent.save()
    }

    // update event
    originalEvent.sharedOrders = updatedSharedOrdersArr;
    await originalEvent.save();

    const userEventToReturn = await UserEvent.findOne({ user: updatedBy, event: eventId }).populate({
      path: "event",
      model: Event,
    }).populate({
      path: "sharedOrders",
      model: SharedOrder,
    });
    console.log('edit event done')
    return res.status(200).json({
      userEvent: userEventToReturn
    });
  } catch (err) {
    console.log("error", err);
    return res.status(400).json({ error: err });
  }
});

router.route("/retrieveForEdit/:eventId").get(async (req, res) => {
  const eventId = req.params.eventId;
  const event = await Event.findById(eventId).populate({
    path: "sharedOrders",
    model: SharedOrder,
  });

  if (!event) {
    return res.status(404).json({ error: "Invalid event ID" });
  }

  const userEvents = await UserEvent.find({ event: eventId }).populate({
    path: "user",
    model: User,
  });

  if (!userEvents) {
    return res.status(404).json({ error: "Unable to retrieve user events" });
  }

  return res.status(200).json({ event, userEvents });
});

const handleAttendees_edit = async (attendees, eventId) => {
  console.log('handle attendees start')
    // key should be user's mongoose id
    for (key of Object.keys(attendees)) {
      let targetedAttendee = attendees[key];

      // retrieve user event associated to user
      let attendeeUserEvent = await UserEvent.findOne({
        event: eventId,
        user: key,
      });
      if (!attendeeUserEvent) {
        return res.status(404).json("user event cannot be found");
      }

      // modify attendees object to add in user id and add debt value
      let debt = targetedAttendee.amount - targetedAttendee.paidAmount;

      attendeeUserEvent.individualOrderAmount = targetedAttendee.amount,
      attendeeUserEvent.amountPaid = targetedAttendee.paidAmount,

      attendees[key] = {
        ...attendees[key],
        mongooseId: key,
        debt,
        userEvent: attendeeUserEvent,
      };
  
    }
    console.log('handle attendees end')
}

const handleAttendees = async (attendees, retrievedUsers, event) => {
  console.log('handle attendees start')
  // trace each attendee for their user id
  for (key of Object.keys(attendees)) {
    let retrievedUser;
    let targetedAttendee = attendees[key];
    const mobileNumber = targetedAttendee.mobileNumber;
    let user;

    user = await userMethods.getUserByMobileNumber(mobileNumber);

    if (!user) {
      retrievedUser = await userMethods.createUnregisteredUser(mobileNumber)
    } else {
      if (targetedAttendee.currentUser === true) {
        event.createdBy = user._id;
      }
      retrievedUser = user;
    }

    retrievedUsers.push(retrievedUser);

    // create new userevent
    let newUserEvent = new UserEvent({
      individualOrderAmount: targetedAttendee.amount,
      amountPaid: targetedAttendee.paidAmount,
      sharedOrders: [],
      user: retrievedUser._id,
      event: null,
    });

    // modify attendees object to add in user id and add debt value
    let debt = targetedAttendee.amount - targetedAttendee.paidAmount;

    // attach mongooseid, new user event and debt to attendee object
    attendees[key] = {
      ...attendees[key],
      mongooseId: retrievedUser._id,
      debt,
      userEvent: newUserEvent,
    };
  }

  console.log('handle attendees end')
}

const handleSharedOrders = async (sharedOrders, attendees, newEvent) => {
  console.log('handle shared orders start')
  for (sharedOrder of sharedOrders) {
    let sharerMongooseIds = [];

    let amount = sharedOrder.amount;
    let sharers = sharedOrder.users;

    let splitAmount = parseFloat((parseFloat(amount) / sharers.length).toFixed(2));

    for (sharer of sharers) {
      sharerMongooseIds.push(attendees[sharer].mongooseId);
    }

    let newSharedOrder = await sharedOrderMethods.createSharedOrder(sharerMongooseIds, amount);
    newEvent.sharedOrders.push(newSharedOrder._id);

    sharers.forEach((sharer) => {
      // add new shared order to user event
      attendees[sharer].userEvent.sharedOrders = attendees[
        sharer
      ].userEvent.sharedOrders.concat(newSharedOrder._id);
      // update debt and total expenditure
      attendees[sharer] = {
        ...attendees[sharer],
        amount: attendees[sharer].amount + splitAmount,
        debt: attendees[sharer].debt + splitAmount,
      };
    });
  }
  console.log('handle shared orders end')
}

const handleLoans = (attendees, persistedEventId, eventDate) => {
  console.log('handle loans start')
  // if debt is positive, need to pay someone
  let toPay = [];
  let toReceive = [];

  Object.keys(attendees).forEach((attendeeId) => {
    let targetedAttendee = attendees[attendeeId];

    // add event reference to user events
    targetedAttendee.userEvent.event = persistedEventId;

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
          event: persistedEventId,
          date: new Date(eventDate)
        })
      );
    }
  }
  // create loans in bulk
  Loan.insertMany(loansToCreate).then(() => console.log('handle loans end')).catch((err) => console.log(err));
}

const handleUserEvents = async (attendees) => {
  console.log('handle user events start')
  for (key of Object.keys(attendees)) {
    let createdUserEvent = await attendees[key].userEvent.save();
    let retrievedUser = await User.findById(attendees[key].mongooseId);
    await addUserEventToUser(retrievedUser, createdUserEvent._id);
  }
  console.log('handle user events end')
}

router.route("/add").post(async (req, res) => {
  console.log('==============ADD EVENT START===================')
  try {
    const { billDetails, attendees, totalBill, sharedOrders } = req.body;

    const {
      eventName,
      formattedDate,
      addGST,
      addServiceCharge,
      discountType,
      discountAmount,
      netBill,
    } = billDetails;

    let newEvent = new Event({
      eventName,
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

    await handleAttendees(attendees, retrievedUsers, newEvent)
    await handleSharedOrders(sharedOrders, attendees, newEvent);

    let createdEvent = await createEvent(newEvent);
    
    await logMethods.createLog(new Date(), createdEvent.createdBy, 'create event', createdEvent._id)
   
    handleLoans(attendees, createdEvent._id, formattedDate)

    await handleUserEvents(attendees)
    

    // retrieve creator's userevent and return success
    const userEventToReturn = await UserEvent.find({ user: createdEvent.createdBy }).populate({
      path: "event",
      model: Event,
    }).populate({
      path: "sharedOrders",
      model: SharedOrder,
    });

    return res.status(200).json({
      userEvent: userEventToReturn
    });
  } catch (err) {
    console.log("error", err);
    return res.status(400).json({ error: err });
  }
});

module.exports = router;
