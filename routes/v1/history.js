const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/Users');
const History = require('../../models/history');

//@route    GET api/history/
//@desc     history
//@access   Private
router.get('/',auth,async (req,res)=>{
    try {
        const user = await User.findOne({_id : req.user.id});
        const response = await History.findOne({RestaurantID : user.Phone});
        res.json(response.Tables);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;