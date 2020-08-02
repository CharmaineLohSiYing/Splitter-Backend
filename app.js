const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
var bodyParser = require("body-parser");


const app = express();
app.use(cors());
// app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const port = process.env.PORT;

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex : true, useFindAndModify: false } ).catch('Failed to connect to database');
const connection = mongoose.connection;
connection.once('open', () => {
    console.log('MongoDB database connection established successfully')
})



const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const billRouter = require('./routes/bill');
const loanRouter = require('./routes/loan');
const userBillRouter = require('./routes/userbill');
const transactionRouter = require('./routes/transaction');
const dataRouter = require('./routes/datainit');

app.use('/user', userRouter.router);
app.use('/auth', authRouter);
app.use('/bill', billRouter);
app.use('/loan', loanRouter.router);
app.use('/userbill', userBillRouter);
app.use('/data', dataRouter);
app.use('/transaction', transactionRouter);


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})


