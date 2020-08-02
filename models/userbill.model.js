const mongoose = require('mongoose');

const schema = mongoose.Schema;

const userBillSchema = new schema({
    bill: {type: schema.Types.ObjectId, ref: 'Bill'},
    user: {type: schema.Types.ObjectId, ref: 'User'},
    individualOrderAmount: {type: Number},
    amountPaid: {type: Number},
    sharedOrders: {type: [schema.Types.ObjectId], ref:'SharedOrder'},
})

const UserBill = mongoose.model('UserBill', userBillSchema);
module.exports = UserBill;