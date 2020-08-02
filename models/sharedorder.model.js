const mongoose = require('mongoose');

const schema = mongoose.Schema;

const sharedOrderSchema = new schema({
    users: {type: [schema.Types.ObjectId], ref: 'UserBill'},
    amount: {type: Number, min: 0},
    type: {type: String},
})

const SharedOrder = mongoose.model('SharedOrder', sharedOrderSchema);
module.exports = SharedOrder;