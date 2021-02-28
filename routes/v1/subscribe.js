const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Subscribe = require('../../models/Subscribe');
const User = require('../../models/Users');
const RazorPay = require("razorpay");
const request = require("request");
const crypto = require('crypto');
const R = require('../../razorpay.json');

var RazorPayInstance = new RazorPay({
    key_id : R.RAZORPAYKEY,
    key_secret : R.RAZORPAYSECRET,
});


router.get('/',auth,async (req,res)=>{
    
    try {

        const user = await User.findById(req.user.id).select('-password');
        const subscriptionDetails = await Subscribe.findOne({RestaurantID : user.Phone});
        const subscription = await RazorPayInstance.subscriptions.fetch(subscriptionDetails.SubscriptionID);
        if(subscriptionDetails.SubscriptionStatus !== subscription.status)
        {
            const mResponse = await Subscribe.findOneAndUpdate(
                {RestaurantID : user.Phone},
                {$set:{
                    SubscriptionStatus:subscription.status
                }}
            );
            res.status(200).send(mResponse);
        }
        else
        {
            res.status(200).send(subscriptionDetails);
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
});

router.post("/payment",auth,async (req,res)=>{

    const {PlanType} = req.body;
    var Amount;
    
    if(PlanType === "Monthly"){ Amount = R.MONTHLYPLANPRICE }
    else { Amount = R.YEARLYPLANPRICE }

    const options = {
        amount: Amount,
        currency: "INR",
        receipt: "receipt-"+(new Date().getTime()),
        payment_capture:1,
    };

    try{
        //Creating Order
        const order = await RazorPayInstance.orders.create(options);
        
        //Update Subscription
        

        res.status(200).send({
            id: order.id,
			currency: order.currency,
			amount: order.amount
        })
    }catch(err){
        console.log(err);
        res.status(500).send("Server Error")
    }
    
});

router.post("/verification",async (req,res)=>{

     try {

        const shasum = crypto.createHmac('sha256', R.SECRETWEBHOOK);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');

        if (digest === req.headers['X-Razorpay-Signature']) {
            const email = req.body.payload.payment.entity.email;
            const amount = req.body.payload.payment.entity.amount;
            let Plan,PlanID;
            const user = await User.findOne({email:email});
            if(amount === YEARLYPLANPRICE){
                Plan = "Yearly";
                PlanID = R.YEARLYPLAN;
            }else{
                Plan = "Monthly";
                PlanID = R.MONTHLYPLAN;
            }

            //Update Subscription
            mBody = req.body;
            const startAt = Math.floor(new Date().getTime()/1000);
            const subscribe = await Subscribe.findOne({RestaurantID : user.Phone});
            const options = {
                url: 'https://api.razorpay.com/v1/subscriptions/'+subscribe.SubscriptionID,
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    plan_id: PlanID,
                    schedule_change_at : "now",
                    start_at : startAt
                }),
                auth: {
                    'user': R.RAZORPAYKEY,
                    'pass': R.RAZORPAYSECRET
                }
            };
            const mResponse = await request(options);
            //Update Subscribe Database
            const b = {
                SubscriptionPlanID : PlanID,
                SubscriptionStatus : mResponse.body.status,
                SubscriptionStartDate : mResponse.body.start_at,
                SubscriptionEndDate : mResponse.body.end_at,
                SubscriptionPlan : Plan,
                SubscriptionURL : mResponse.body.short_url
            };
            await Subscribe.findOneAndUpdate(
                {RestaurantID : user.Phone},
                {$set : b, $push : {SubscriptionHistory : mBody}}
            )
        }
    } catch (error) {
        console.log(error);
    }

	res.json({ status: 'ok' })
});

router.post("/update",async (req,res)=>{

    const {payment_id,order_id} = req.body;
    try{
        const res1 = await RazorPayInstance.payments.fetch(payment_id);
        const res2 = await RazorPayInstance.orders.fetch(order_id);
        
        if(res1.status === "captured")
        {
            const email = res1.email;
            const amount = res2.amount;
            const user = await User.findOne({email:email});
            const RestaurantID = user.Phone;
            const subscribe = await Subscribe.findOne({RestaurantID : user.Phone});
            if(subscribe.SubscriptionStatus === "cancelled" || subscribe.SubscriptionStatus === "expired")
            {
                let Plan,PlanID;
                if(amount === R.YEARLYPLANPRICE)
                {
                    Plan = "Yearly";
                    PlanID = R.YEARLYPLAN;

                }else{
                    Plan = "Monthly";
                    PlanID = R.MONTHLYPLAN;
                }
                const body = {Payment:{...res1},Order:{...res2}};
                const options = {
                    url: 'https://api.razorpay.com/v1/subscriptions/'+subscribe.SubscriptionID,
                    method: 'PATCH',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        plan_id: PlanID,
                        schedule_change_at : "now",
                    }),
                    auth: {
                        'user': R.RAZORPAYKEY,
                        'pass': R.RAZORPAYSECRET
                    }
                };
                const mResponse = await request(options);
                console.log(mResponse);
                console.log(mResponse.data);
                console.log(mResponse.body);
                const b = {
                    SubscriptionPlanID : PlanID,
                    SubscriptionStatus : mResponse.body.status,
                    SubscriptionStartDate : mResponse.body.start_at,
                    SubscriptionEndDate : mResponse.body.end_at,
                    SubscriptionPlan : Plan,
                    SubscriptionURL : mResponse.body.short_url
                };
                await Subscribe.findOneAndUpdate(
                    {RestaurantID : RestaurantID},
                    {$set : b, $push : {SubscriptionHistory : body}}
                )
            }
        }
        res.status(200).send("ok");
        
    }catch(err){
        console.log(err);
    }
    

});

module.exports = router;