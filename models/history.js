const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({

      DishName : {
            type : String,
            default : ""
      },
      Quantity : {
            type : Number,
            default : 0
      },
      Rate : {
            type : Number,
            default : 0
      }
});

const SingleSchema = new Schema({

      RestaurantID : {
            type :String
      },
      tableNo : {
            type : Number,
            default : 0
      },
      Orders : [OrderSchema],
      TotalBill : {
            type : String
      },
      SubTotal : {
            type : String
      },
      CompletedDateOrder : {
            type : String,
      },
      CompletedTimeOrder : {
            type : String,
      },
      OrderPlacedTime : {
            type : String
      },
      OrderPlacedDate : {
            type : String
      },
      CustomerName : {
            type : String
      },
      PaymentMode : { type : String },
      PaymentStatus : {type : Boolean, default:false},
      PaymentID : {type: String , default : ""}
},{
        timestamps:true
});

const tableSchema = new Schema({

      RestaurantID : {
            type :String
      },
      Tables:[SingleSchema]
});

const Table = mongoose.model('history',tableSchema);

module.exports = Table;