const { loginService, signupService, setOTPService, verifyOTPService, enterNewPasswordService, resetPasswordService, changePasswordService } = require("../services/auth.service");
const { POST, PUT } = require("../constants/constants");

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
    let userId = null; 
    try {
      const {firstName, lastName, email, mobileNumber, password} = req.body
      const newUser = await signupService(email, password, firstName, lastName, mobileNumber);
      userId = newUser._id; 
      console.log('NEW USER ID', userId)
      res.send(newUser);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
    if (userId){
      setOTPService(userId)
    }
    
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
      console.log('CATCH', e.message)
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

const requestPasswordReset = async (req, res, next) => {
  if (req.method === POST) {
    try {
      const {email} = req.body;
      const token = await generateResetPasswordTokenService(email);
      res.send(token);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

const enterNewPassword = async (req, res, next) => {
  if (req.method === POST) {
    try {
      const newPassword = req.body.password;
      const userId = req.body.userId;
      const passwordToken = req.body.resetPasswordToken;
      const token = await enterNewPasswordService(newPassword, userId, passwordToken);
      res.send(token);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

const resetPassword = async (req, res, next) => {
  if (req.method === POST) {
    try {
      const token = req.params.token;
      
      const result = await resetPasswordService(token);
      res.send(result);
    } catch (e) {
      return res.status(500).json(e.message) && next(e);
    }
  } else {
    res.sendStatus(405);
  }
};

const changePassword = async (req, res, next) => {
  if (req.method === PUT) {
    try {
      let { oldPassword, newPassword, userId } = req.body;
      const result = await changePasswordService(oldPassword,newPassword, userId);
      res.send(result);
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
  verifyOTP,
  enterNewPassword,
  resetPassword,
  requestPasswordReset,
  changePassword
};
