const express = require('express');
const connectDB = require('./config/db');
//const path = require("path");

const app = express();

//Connect to Database
connectDB();

//Initialize Middleware
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers','*');
    next();
});

app.use('/v1/users',require('./routes/v1/users'));
app.use('/v1/profile',require('./routes/v1/profile'));
app.use('/v1/auth',require('./routes/v1/auth'));
app.use('/v1/dishes',require('./routes/v1/dishes'));
app.use('/v1/table',require('./routes/v1/table'));
app.use('/v1/history',require('./routes/v1/history'));
app.use('/v1/qr',require('./routes/v1/qr'));
app.use('/v1/help',require('./routes/v1/help'));
app.use('/v1/accounts',require('./routes/v1/accounts'));
app.use('/v1/employee',require('./routes/v1/employees'));
app.use('/v1/subscribe',require('./routes/v1/subscribe'));
app.use('/v1/feedback',require('./routes/v1/feedback'));

app.listen(process.env.PORT || 5000,function(){ 
    console.log('Server is up and Running on http://localhost:5000'); 
});
