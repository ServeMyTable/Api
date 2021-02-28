const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Accounts = require('../../models/Accounts');
const User = require('../../models/Users');

router.get("/",auth,async (req,res) => {

    try {
        
        const user = await User.findById(req.user.id).select('-password');
        const mdata = await Accounts.findOne({RestaurantID : user.Phone});
        if(mdata !== null) res.send(mdata.account);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post("/",auth,async (req,res) => {
    
    try {
        const Today = new Date(Date.now()).toLocaleString().split(',');
        const date = Today[0].toString();
        const Time = Today[1].toString();

        const data = {
            Date : date,
            Time : Time,
            Particulars : req.body.particulars,
            Debit : req.body.debit,
            Credit : req.body.credit,
            AmountType : req.body.amountType
        };
        const user = await User.findById(req.user.id).select('-password');
        const ndata = await Accounts.findOneAndUpdate(
            { RestaurantID : user.Phone },
            { $push : { account : data }},
            { upsert : true }
            )
        res.send(data.account);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

module.exports = router;