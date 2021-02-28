const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/Users');
const Feedback = require('../../models/Feedback');

router.get('/',auth,async (req,res) => {
    
    try{

        const user = await User.findById(req.user.id).select('-password');
        const Feedbacks = await Feedback.find({RestaurantID:user.Phone});
        res.status(200).send(Feedbacks);

    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;