const express = require('express');
const router = express.Router();
const User = require('../../models/Users');
const auth = require('../../middleware/auth');
const config = require('config');
const email = config.get('EMAIL');
const password = config.get('PASSWORD');
const nodemailer = require('nodemailer');


router.post("/send", auth,async (req,res)=>{

    try{
        const user = await User.findOne({_id : req.user.id});
        const Name = user.username;
        const Email = user.email;
        const Message = req.body.message;
        const Subject = req.body.subject;

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
                              <h2 class="mFont">Message</h2>
                              <hr class="line-theme">
                              <p class="mFont">${Message}</p>
                              
                              <hr class="line-theme"><br>
                              <p class="mFont">
                              Name : ${Name}<br>
                              Contact Mail : ${Email}</p>	
                        </body>
                  </html>`
                  
        
        var mailOptions = {
                from: 'servemytable@gmail.com',
                to: 'servemytable@gmail.com',
                subject: Subject,
                html: HTML
        };
              
        await transporter.sendMail(mailOptions);
        res.status(200).send("Thank you for contacting us");

    }catch(err){
        console.error(err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;