const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/Users');

router.get("/",auth,async (req,res)=>{

    try {
        const user = await User.findOne({_id : req.user.id});
        const qrcodes = []
        const num = user.nTables;
        for(var i = 0 ; i <= num ; i++){

            const RestID = user.Phone;
            const TableNo = (i).toString();
            const urid = ('id='+RestID+'%26table='+TableNo).toString();
            const data = 'https://guest.servemytable.in/check?'+urid;
            qrcodes.push('https://api.qrserver.com/v1/create-qr-code/?data='+data);
        }
        res.status(200).send(qrcodes);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

router.post("/",auth,async (req,res)=>{

    try {
        
        const num = req.body.qr;
        const user = await User.findByIdAndUpdate(req.user.id,{$set : {nTables : num}});
        const qrcodes = []
        for(var i = 0 ; i <= num ; i++){
            const RestID = user.Phone;
            const TableNo = (i).toString();
            const urid = ('id='+RestID+'%26table='+TableNo).toString();
            const data = 'https://guest.servemytable.in/check?'+urid;
            qrcodes.push('https://api.qrserver.com/v1/create-qr-code/?data='+data);
        }
        res.status(200).send(qrcodes);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

module.exports = router;