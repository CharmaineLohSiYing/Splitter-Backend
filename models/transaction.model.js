const mongoose = require('mongoose');

const schema = mongoose.Schema;

const transactionSchema = new schema({
    amount: {type:Number},
    date: {type: Date},
    from:{type: schema.Types.ObjectId, ref: 'User'},
    to:{type: schema.Types.ObjectId, ref: 'User'},
})

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;