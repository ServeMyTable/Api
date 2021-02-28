const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SingleSchema = new Schema({

    Date : {
        type : String,
    },
    Time : {
        type : String,
    },
    AmountType : {
        type : Boolean,
        required : true
    },
    Particulars : {
        type : String
    },
    Debit : {
        type : String
    },
    Credit : {
        type : String
    }

},{
    timestamps:true
});

const AccountSchema = new Schema({

    RestaurantID : {
        type : String,
        required : true
    }, 
    account : [ SingleSchema ]
});


const Account = mongoose.model('account',AccountSchema);

module.exports = Account;