const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/Users');
const Guest = require('../../models/Guest');

router.get("/",auth,async (req,res)=>{
    try {
        const guest = await Guest.findById(req.guest.id).select('-password');
        const user = await User.findOne({Phone:guest.Phone});
        const body = {
            TableNo : guest.table,
            name : user.RestaurantName,
            location : user.Location,
            dishes : user.Dishes,
            Phone : user.Phone,
            ImageUrl : user.ImageUrl,
            Categories : user.Categories,
            Taxes : user.Taxes
        }
        res.status(200).json(body);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;