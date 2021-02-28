const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const uuid = require('uuid');
const Table = require('../../models/Table');
const User = require('../../models/Users');
const OrderHistory = require('../../models/history');

router.get('/',auth,async (req,res)=>{

    try {
        const user = await User.findOne({_id : req.user.id});
        const table = await Table.findOne({RestaurantID : user.Phone});
        res.status(200).send(table.Tables);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.post('/complete',auth, async (req,res)=>{

    const tableNo = req.body.TableNo;
    const RestaurantID = req.body.RestaurantId;
    const OrderId = req.body.OrderId;
    const Today = new Date(Date.now()).toLocaleString().split(',');
    const date = Today[0].toString();
    const Time = Today[1].toString();
    try {

        const Orders = await Table.find({RestaurantID : RestaurantID,Tables:{$elemMatch:{tableNo:tableNo,OrderId:OrderId}}});
        const Obj = {...Orders[0]._doc.Tables[0]._doc};
        const body = {...Obj,CompletedTimeOrder:Time,CompletedDateOrder:date};
        
        await OrderHistory.updateOne(
            {RestaurantID:RestaurantID},
            {$push:{Tables:body}},
            {upsert:true}
        );
        
        await Table.updateOne(
            { RestaurantID : RestaurantID },
            { $pull:{
                Tables:{
                    tableNo:tableNo,
                    OrderId:OrderId
                }
            }},
            { multi : true }
        );
        res.status(200).send("ok");
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }

});

router.post('/cancel',auth,async (req,res)=>{

    const tableNo = req.body.TableNo;
    const RestaurantID = req.body.RestaurantId;
    const OrderId = req.body.OrderId;

    try {
        const response =
        await Table.updateOne(
            { RestaurantID : RestaurantID },
            { $pull:{
                Tables:{
                    tableNo:tableNo,
                    OrderId:OrderId
                }
            }},
            { multi : true }
        );
        res.status(200).send("ok");

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.post('/placeorder',auth,async (req,res)=>{
    
    const Orders = [];
    const result = req.body.Dish;

    const Today = new Date(Date.now()).toLocaleString().split(',');
    const date = Today[0].toString();
    const Time = Today[1].toString();
    var UniqueId = "S"+uuid.v4()+Math.floor(Math.random()*99999).toString();

    for(var i = 0 ; i < result.length ; i++){
        Orders.push({
            DishName : result[i].name,
            Quantity :result[i].units,
            Rate : result[i].price
        });
    }
    try {

        const user = await User.findOne({_id:req.user.id});
        const body = {
            RestaurantID : user.Phone,
            tableNo : req.body.TableNo,
            OrderId:UniqueId,
            Orders : Orders,
            OrderPlacedTime:Time,
            OrderPlacedDate:date,
            TotalBill : req.body.TotalBill,
            SubTotal : req.body.SubTotal,
            CustomerName : req.body.CustomerName,
            PaymentMode : "Placed",
            PaymentStatus : true,
            
        };
        await Table.updateOne(
            {RestaurantID:user.Phone},
            {$push:{Tables:body}},
            {upsert:true}
        );
        res.status(200).send("ok");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

module.exports = router;