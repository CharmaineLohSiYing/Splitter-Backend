const mongoose = require('mongoose');

const schema = mongoose.Schema;

const userSchema = new schema({
    firstName:{type:String, trim: true,},
    lastName:{type:String,trim: true,},
    email:{type:String, trim: true, unique: true},
    emailTemp:{type:String, trim: true},
    mobileNumber:{type:Number, minLength: 8,trim: true},
    mobileNumberTemp:{type:Number, minLength: 8, trim: true},
    password:{type:String, trim:true, minLength:8},
    resetPasswordToken:{type:String},
    resetPasswordExpiration:{type: Date},
    otp:{type:String, trim:true, minLength:6, maxLength:6},
    otpExpiration:{type: Date},
    accessToken:{type:String, trim:true, minLength:6, maxLength:6},
    accessTokenExpiration:{type: Date},
    isRegistered: {type: Boolean, default: true},
})

const User = mongoose.model('User', userSchema);
module.exports = User;