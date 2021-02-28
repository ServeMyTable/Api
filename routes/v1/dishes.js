const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/Users');
const { check, validationResult } = require('express-validator');

//@route    POST api/dishes/
//@desc     Add dishes
//@access   Private
router.post('/',
    [ auth , [ 
        check('DishName','Name is required').not().isEmpty(),
        check('Category','Category is required').not().isEmpty(),
        check('Price','Price is required').not().isEmpty(),
        check('Price').isNumeric() 
    ] ], async (req,res)=>{
    
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors : errors.array() });
        }
    try{
        const tags = (req.body.tags).filter((item, i, ar) => ar.indexOf(item) === i);
        const Dish = {
            DishName : req.body.DishName,
            Description : req.body.Description,
            Price : req.body.Price,
            tags : tags,
            Category : req.body.Category
        };
        const user = await User.findOneAndUpdate({_id : req.user.id},{$push:{'Dishes' : Dish,'Categories' : Dish.Category}}).select('-password');;
        return res.json(user);

    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
    
});

//@route    POST api/dishes/delete
//@desc     Add dishes
//@access   Private
router.post('/delete',auth, async (req,res)=>{

    try{
    
        const user = await User.findOne({_id : req.user.id});
        var Categories = user.Categories;
        var DeleteCategory = req.body.DeleteCategory;
        var index = Categories.indexOf(DeleteCategory);
        Categories.splice(index,1);
        
        const response = await User.update({_id: req.user.id},{
                $pull : {
                    Dishes : {DishName : req.body.DishID},
                },
                $set : {
                    Categories : Categories
                }
        });
        
        
        res.status(200).send("Dish Deleted Successfully");
      
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route    POST api/dishes/update
//@desc     update dishes
//@access   Private
router.post('/update',
    [ auth , [ 
        check('DishName','Name is required').not().isEmpty(),
        check('Category','Category is required').not().isEmpty(),
        check('Price','Price is required').not().isEmpty(),
        check('Price').isNumeric()
    ] ], async (req,res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors : errors.array() });
        }
        try{
            const tags = (req.body.tags).filter((item, i, ar) => ar.indexOf(item) === i); 
            const Dish = {
                DishName : req.body.DishName,
                Description : req.body.Description,
                Price : req.body.Price,
                tags : tags,
                Category : req.body.Category
            };

            await User.updateMany({'Dishes.DishName' : req.body.DishName},
            {$set:{
                'Dishes.$.DishName' : Dish.DishName,
                'Dishes.$.Description' : Dish.Description,
                'Dishes.$.Price':Dish.Price,
                'Dishes.$.tags':Dish.tags,
                'Dishes.$.Category':Dish.Category
            }});
            await User.updateOne({_id : req.user.id},{$push : {'Categories':Dish.Category}});
            
            res.status(200).send('Dish Updated Successfully');
                    
    }catch(err){
        console.error(err);
        return res.status(500).send('Server Error');
    }
});

//@route    POST api/dishes/available
//@desc     Dish Availability
//@access   Private
router.post('/available',[ auth ,check('Status','Status is invalid').isBoolean() ]
    , async (req,res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors : errors.array() });
        }
        try{
        var changeStatus = req.body.Status;
        if(req.body.Status == "true"){
            changeStatus = "false";
        }else{
            changeStatus = "true";
        }

        await User.updateMany({'Dishes.DishName' : req.body.DishID},
        {$set:{'Dishes.$.Available' : changeStatus}});
               
        res.status(200).json("Dish Availability changed");
            
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
    
});

module.exports = router;