const { loginService, signupService, setOTPService, verifyOTPService } = require("../services/auth.service");
const { POST } = require("../constants/constants");

const login = async (req, res, next) => {
  if (req.method === POST) {
    try {
      const { email, password } = req.body;
      const result = await loginService(email, password);
      res.send(result);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

const signup = async (req, res, next) => {
  if (req.method === POST) {
    let userId; 
    try {
      const {firstName, lastName, email, mobileNumber, password} = req.body
      const newUser = await signupService(email, password, firstName, lastName, mobileNumber);
      userId = newUser._id; 
      console.log('NEW USER ID', userId)
      res.send(newUser);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
    setOTPService(userId)
  } else {
    res.sendStatus(405);
  }
};

const verifyOTP = async (req, res, next) => {
  if (req.method === POST) {
    try {
      const {otp, userId} = req.body;
      const user = await verifyOTPService(otp, userId);
      res.send(user);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

module.exports = {
  login,
  signup,
  verifyOTP
};
