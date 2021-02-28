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
      Rate  : {
            type : Number,
            default : 0
      }
});

const SingleSchema = new Schema({
      RestaurantID:{
            type: String
      },
      tableNo : {
            type : Number,
            default : 0
      },
      OrderId : {
            type : String,
      },
      Orders : [OrderSchema],
      TotalBill : {
            type : String
      },
      SubTotal : {
            type : String
      },
      OrderPlacedTime : {
            type : String,
      },
      OrderPlacedDate : {
            type : String,
      },
      CustomerName : {
            type : String
      },
      PaymentMode : { type : String },
      PaymentStatus : {type : Boolean, default:false},
      PaymentID : {type: String , default : ""},
      notes : {type : String , default : ""}
},{
      timestamps:true
});

const tableSchema = new Schema({

      RestaurantID : {
            type :String
      },
      Tables:[SingleSchema]
});

const Table = mongoose.model('Order',tableSchema);

module.exports = Table;
