const express = require('express');
const router = express.Router();

const Table = require('../../models/Table');
const auth = require('../../middleware/auth');
const Guest = require('../../models/Guest');
const uuid = require('uuid');


//@route   GET api/table/
//@desc    GET Table Information
//@access  PRIVATE
router.get('/',auth,async (req,res)=>{
    try {

        const guest = await Guest.findById(req.guest.id);

        const RestaurantID = guest.Phone;
        const tableNo = guest.table;

        const Orders = await Table.findOne({RestaurantID:RestaurantID});
        const mOrders = Orders.Tables.filter((obj)=>{return tableNo == obj.tableNo});
        
        res.send(mOrders);

    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

//@route    POST api/table/
//@desc     Place Order on Database
//@access   PRIVATE
router.post('/',auth,async (req,res)=>{

    try{
        const Orders = [];
        const temp = req.body.Dish;
        const CustomerName = req.body.CustomerName;
        const TableNo = req.body.TableNo;
        const RestaurantID = req.body.id;
        const Bill = parseFloat(req.body.TotalBill);
        const notes = req.body.notes;
        const Today = new Date(Date.now()).toLocaleString().split(',');
        const date = Today[0].toString();
        const Time = Today[1].toString();
        var UniqueId = "S"+uuid.v4()+Math.floor(Math.random()*99999).toString();

        for(var i = 0 ; i < temp.length ; i++){
            Orders.push({
                DishName : temp[i].name,
                Quantity : temp[i].units,
                Rate : temp[i].price
            });
        }

        const data = 
        {
            RestaurantID : RestaurantID,
            tableNo : TableNo,
            OrderId : UniqueId,
            Orders : Orders,
            TotalBill : Bill,
            SubTotal : req.body.SubTotal,
            CustomerName : CustomerName,
            PaymentMode : req.body.PaymentMode,
            OrderPlacedTime : Time,
            OrderPlacedDate : date,
            notes : notes,
            PaymentStatus : true
        };

        await Table.updateOne(
            {RestaurantID:RestaurantID},
            {$push:{Tables:data}},
            {upsert:true}
        );    
        res.status(200).json(data);
    
    }catch(err){
        console.error(err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;