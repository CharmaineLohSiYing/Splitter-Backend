const mongoose = require('mongoose');

const schema = mongoose.Schema;

const logSchema = new schema({
    updatedBy: {type: [schema.Types.ObjectId], ref: 'User'},
    updatedAt: {type: Date},
    details:{type:String, trim: true,},
    bill: {type: schema.Types.ObjectId, ref: 'Bill'}
})

const Log = mongoose.model('Log', logSchema);
module.exports = Log;