const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SingleSchema = new Schema({

    
    Name : {
        type : String,
        required : true
    },
    Address : {
        type : String,
        required : true
    },
    Phone : {
        type : String,
        required : true
    },
    DOB:{ type : String },
    EmpPost : {
        type : String
    },
    Salary : {
        type : String
    },
    ImageFileName : {
        type : String
    },
    AadharNo : {type : String},
    AadharFileName : {
        type : String
    },
    PanNo:{type: String},
    PanFileName : {
        type : String
    },
    ImageFileUrl : {
        type : String
    },
    AadharFileUrl : {
        type : String
    },
    PanFileUrl : {
        type : String
    }

},{
    timestamps:true
});

const EmployeeSchema = new Schema({

    RestaurantID : {
        type : String,
        required : true
    }, 
    Employees : [ SingleSchema ]
});

const Employee = mongoose.model('employee',EmployeeSchema);

module.exports = Employee;