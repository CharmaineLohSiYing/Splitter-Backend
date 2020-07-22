const mongoose = require('mongoose');

const schema = mongoose.Schema;

const eventSchema = new schema({
    date: {type: Date},
    createdAt: {type: Date},
    createdBy: {type:schema.Types.ObjectId,  ref: 'User' },
    eventName:{type:String, trim: true,},
    hasGST:{type:Boolean},
    hasServiceCharge:{type:Boolean},
    discountType:{type:String, trim: true},
    discountAmount:{type:String, trim: true},
    netBill: {type: Number},
    totalBill: {type: Number},
    sharedOrders:{type: [schema.Types.ObjectId], ref: 'SharedOrder'},
})

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;