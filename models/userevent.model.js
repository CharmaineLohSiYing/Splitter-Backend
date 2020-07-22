const mongoose = require('mongoose');

const schema = mongoose.Schema;

const userEventSchema = new schema({
    event: {type: schema.Types.ObjectId, ref: 'Event'},
    user: {type: schema.Types.ObjectId, ref: 'User'},
    individualOrderAmount: {type: Number},
    amountPaid: {type: Number},
    sharedOrders: {type: [schema.Types.ObjectId], ref:'SharedOrder'},
})

const UserEvent = mongoose.model('UserEvent', userEventSchema);
module.exports = UserEvent;