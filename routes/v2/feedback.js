const express = require('express');
const router = express.Router();
const Feedback = require('../../models/Feedback');

router.post("/",async (req,res)=>{
    try{

        const stars = req.body.stars;
        const feedback = req.body.feedback;
        const RestaurantID = req.body.RestaurantID;
        const Name = req.body.CustomerName;

        const body = {
            RestaurantID:RestaurantID,
            Name : Name,
            stars : stars,
            feedback : feedback,
        }

        await Feedback.insertMany([body]);
        res.status(200).send("ok");

    }catch(err){
        console.log(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router; 