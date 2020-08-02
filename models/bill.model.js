const mongoose = require('mongoose');

const schema = mongoose.Schema;

const billSchema = new schema({
    date: {type: Date},
    createdAt: {type: Date},
    createdBy: {type:schema.Types.ObjectId,  ref: 'User' },
    billName:{type:String, trim: true,},
    hasGST:{type:Boolean},
    hasServiceCharge:{type:Boolean},
    discountType:{type:String, trim: true},
    discountAmount:{type:String, trim: true},
    netBill: {type: Number},
    totalBill: {type: Number},
    sharedOrders:{type: [schema.Types.ObjectId], ref: 'SharedOrder'},
})

const Bill = mongoose.model('Bill', billSchema);
module.exports = Bill;