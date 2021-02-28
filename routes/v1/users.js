const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const config = require('config');
const jwt = require('jsonwebtoken');

const email = config.get('EMAIL');
const password = config.get('PASSWORD');
const nodemailer = require('nodemailer');
const User = require('../../models/Users');
const Otps = require('../../models/Forgot');
const Subscribe = require('../../models/Subscribe');
const auth = require('../../middleware/auth');

const RazorPay = require("razorpay");
const R = require('../../razorpay.json');

var RazorPayInstance = new RazorPay({
    key_id : R.RAZORPAYKEY,
    key_secret : R.RAZORPAYSECRET,
});

// @route   POST api/users
// @desc    Register User
// @access  Public
router.post('/',
    [
        check('username' , 'Name is required').not().isEmpty(),
        check('email','Please include a valid email').isEmail(),
        check('password' , 'Password is required').not().isEmpty(),
        check('Phone', 'Contact No is required').not().isEmpty(),
    ],
    async (req,res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors : errors.array() });
        }
        const { username, email, password, Phone, Plan} = req.body;
        var SELECTEDPLAN;
        if(Plan === "Yearly"){
            SELECTEDPLAN = R.YEARLYPLAN;
        }else{
            SELECTEDPLAN = R.MONTHLYPLAN;
        }
        const SubscriptionStartDate = new Date().setDate((new Date().getDate()+R.FREETRIALPERIOD));
        const UNIXTIMESTAMP = Math.floor(SubscriptionStartDate/1000);
        
        try{

            let user = await User.findOne({ email });

            if(user){
                return res.status(400).json({ errors : [{ msg : "User already exists" }] });
            }
            user = new User({ username, email, password, Phone });
            
            //Creating Customer
            const CustomerRazorpayResp = await 
            RazorPayInstance.customers.create({name:username,email:email,contact:Phone});
            const RazorPayBody ={
                plan_id : SELECTEDPLAN,
                customer_id : CustomerRazorpayResp.id,
                total_count : 1200,
                start_at : UNIXTIMESTAMP
            };
            //Creating Subscription
            const SubscriptionResponse = await RazorPayInstance.subscriptions.create(RazorPayBody);
            const SubscribeBody = {

                RestaurantID : Phone,
                SubscriptionID : SubscriptionResponse.id,
                SubscriptionStatus: SubscriptionResponse.status,
                SubscriptionStartDate : SubscriptionResponse.start_at,
                SubscriptionEndDate : SubscriptionResponse.end_at,
                SubscriptionPlan : Plan,
                SubscriptionURL : SubscriptionResponse.short_url,
                SubscriptionPlanID : SELECTEDPLAN,
                RazorPayCustomerID : CustomerRazorpayResp.id,
            };
            await Subscribe.insertMany(SubscribeBody);

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password,salt);
            await user.save();            
            
            const payload = {
                user : {
                    id : user.id
                }
            };

            jwt.sign(
                payload,
                config.get('Secret'),
                { expiresIn : 24*3600 },
                (err,token)=>{
                    if(err) throw err;
                    res.json({token});
                }
                );

        }catch(err){
            console.error(err);
            res.status(500).send("Server Error");
        }
        
});

// @route   POST api/users/profile
// @desc    Update User
// @access  Private
router.post('/profile',
[
    check('RestaurantName' , 'Name is required').not().isEmpty(),
    check('Location','Location is required').not().isEmpty(),
    check('Phone' , 'Phone is required').not().isEmpty(),
    check('nTables','Number of Tables is required').not().isEmpty(),
],async (req,res)=>{

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors : errors.array() });
    }
    try {

        const response = await User.findOneAndUpdate({_id:req.user.id},{
            RestaurantName : req.body.RestaurantName,
            Location : req.body.Location,
            nTables : req.body.nTables,
            Phone : req.body.Phone
        });

        res.status(200).send(response);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   POST api/users/send/otp
// @desc    Send OTP
// @access  Public
router.post("/send/otp",async (req,res)=>{

    try{
        const Email = req.body.email;
        user = await User.findOne({email:Email});
        if(!user)
        {
            res.status(200).send("User does not Exists");
        }
        else{
            const otp = Math.floor(100000 + Math.random() * 900000);
            const Message = "Your One Time Password is "+otp;
            const Subject = "One Time Password | Serve My Table";
            
            var transporter = nodemailer.createTransport({
        
                    service: 'gmail',
                    auth: {
                      user: email,
                      pass: password
                    }
            });
            var HTML = 
                      `<!doctype html>
                      <html>
                            <head>
                            <meta charset="utf-8">
                            <style>
                                  h1{
                                        font-family : 'PTSans',sans-serif
                                  }
                                  .mFont{
                                        font-family: "Noto Sans",sans-serif;
                                  }
                                  .line-theme{
    
                                        border: 1px solid #ffd31d;
                                        width: 100%;
                                        background-color: #ffd31d;
                                  }
                                  body{
                                        padding : 10px;
                                  }
                                  
                            </style>
                            <script async src="https://cdn.ampproject.org/v0.js"></script>
                            </head>
                            <body>
                                  <h1>Serve My Table</h1>
                                  <hr class="line-theme"><br>
                                  <p class="mFont">${Message}</p>
                                  
                            </body>
                      </html>`
                      
            
            var mailOptions = {
                    from: 'servemytable@gmail.com',
                    to: Email,
                    subject: Subject,
                    html: HTML
            };
                  
            await transporter.sendMail(mailOptions);
            const obj = { email : Email, otp : otp };
            await Otps.update({email: Email}, obj, {upsert: true});
            res.status(200).send("Email Sent");
        }
    }catch(err){
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// @route   POST api/users/changepassword
// @desc    Change Password
// @access  Public
router.post("/changepassword",async (req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;
        const otp = req.body.otp;
        const response = await Otps.findOne({email : email});
        if(response.otp == otp){
            
            const salt = await bcrypt.genSalt(10);
            newPassword = await bcrypt.hash(password,salt);
            await User.findOneAndUpdate({email},{$set:{password:newPassword}});
            await Otps.findOneAndDelete({email});
            res.status(200).send("Password changed Successfully");

        }else{

            res.status(200).send("Invalid One Time Password");

        }

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.post("/addTax",auth,async (req,res)=>{
    
    const { Name, Type, Amount } = req.body;

    try {
        const body = {
            TaxName : Name,
            TaxType : Type,
            Amount : Amount
        };
        await User.updateOne({_id:req.user.id},{$push:{Taxes:body}},{upsert:true});
        res.status(200).send("ok");

    } catch (error) {
        console.error(err);
        res.status(500).send("Server Error");
    }

});

router.post("/removeTax",auth,async (req,res)=>{
    
    const { Name, Type, Amount } = req.body;

    try {
        const body = {
            TaxName : Name,
            TaxType : Type,
            Amount : Amount
        };
        await User.updateOne({_id:req.user.id},{$pull:{Taxes:body}});
        res.status(200).send("ok");

    } catch (error) {
        console.error(err);
        res.status(500).send("Server Error");
    }

});

module.exports = router;