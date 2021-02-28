const express = require('express');
const router = express.Router();
const config = require('config');
const jwt = require('jsonwebtoken');
const User = require('../../models/Users');
const Guest = require('../../models/Guest');
const bcrypt = require('bcrypt');

// @route   POST api/restaurant
// @desc    Restaurant
// @access  Public
router.post('/', async (req,res)=>{
        
    try{
        
        const user = await User.findOne({Phone : req.body.id});
        if(!user){
            return res.status(200).send({status : 500, message : "Invalid Credentials"});
        }
        if(req.body.table > user.nTables){
            return res.status(200).send({status : 500, message : "Enter valid Table No."});
        }else{
            const username = (req.body.table).toString().concat((req.body.id).toString());
            const password = (req.body.id).toString().concat((req.body.table).toString());
            
            const guest = await Guest.findOne({username:username});
            const body = {
                TableNo : req.body.table,
                CustomerName : req.body.CustomerName,
                name : user.RestaurantName,
                location : user.Location,
                dishes : user.Dishes,
                Phone : user.Phone,
                ImageUrl : user.ImageUrl,
                Categories : user.Categories
            };
            if(guest){
                
                //login
                const payload = {
                    guest : {
                        id : guest.id
                    }
                };
                jwt.sign(
                    payload,
                    config.get('Secret'),
                    { expiresIn : 2*3600 },
                    (err,token)=>{
                        if(err) throw err;
                        res.status(200).json({token,user: body});
                });

            }else{
                //Register and Login
                const newGuest = new Guest({
                    username,
                    password,
                    Phone : user.Phone,
                    table : req.body.table
                });
                const salt = await bcrypt.genSalt(10);
                newGuest.password = await bcrypt.hash(password,salt);
                await newGuest.save();
                const payload = {
                    guest : {
                        id : newGuest.id
                    }
                };
                jwt.sign(
                    payload,
                    config.get('Secret'),
                    { expiresIn : 2*3600 },
                    (err,token)=>{
                        if(err) throw err;
                        res.status(200).json({token,user:body});
                    });
    
            }
        }
        
    }catch(err){
        console.error(err.message);
        return res.status(500).send("Server Error");
    }
    
});



module.exports = router;