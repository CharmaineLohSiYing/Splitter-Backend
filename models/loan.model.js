const mongoose = require('mongoose');

const schema = mongoose.Schema;

const loanSchema = new schema({
    bill: {type: schema.Types.ObjectId, ref: 'Bill'},
    payer: {type: schema.Types.ObjectId, ref: 'User'},
    payee: {type: schema.Types.ObjectId, ref: 'User'},
    amount: {type: Number, required: true},
    isCancelled: {type: Boolean, default: false},
    date: {type: Date}
})

const Loan = mongoose.model('Loan', loanSchema);
module.exports = Loan;