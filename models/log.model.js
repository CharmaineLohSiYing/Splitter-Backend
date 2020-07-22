const mongoose = require('mongoose');

const schema = mongoose.Schema;

const logSchema = new schema({
    updatedBy: {type: [schema.Types.ObjectId], ref: 'User'},
    updatedAt: {type: Date},
    details:{type:String, trim: true,},
    event: {type: schema.Types.ObjectId, ref: 'Event'}
})

const Log = mongoose.model('Log', logSchema);
module.exports = Log;