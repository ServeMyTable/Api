const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const User = require('../../models/Users');
const auth = require('../../middleware/auth');
const Multer = require('multer');
const {Storage} = require('@google-cloud/storage');
const uuid = require('uuid');
const path = require('path');

// @route   POST api/profile
// @desc    Update User
// @access  Private
router.post('/',
[ auth,[
    check('RestaurantName' , 'Name is required').not().isEmpty(),
    check('Location','Location is required').not().isEmpty(),
    check('Phone' , 'Phone is required').not().isEmpty(),
    check('nTables','Number of Tables is required').not().isEmpty(),
]
],async (req,res)=>{

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors : errors.array() });
    }
    try {
        const {RestaurantName,Location,nTables,Phone} = req.body;
        const response = await User.findOneAndUpdate({_id:req.user.id},{
            RestaurantName : RestaurantName[0],
            Location : Location[0],
            nTables : nTables[0],
            Phone : Phone[0]
        });

        res.status(200).send(response);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.post("/name",[ 
    auth,[check('RestaurantName' , 'Name is required').not().isEmpty()]
],async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors : errors.array() });
    }
    try {
        
        const {RestaurantName} = req.body;
        const response = await User.findOneAndUpdate({_id:req.user.id},{RestaurantName : RestaurantName});

        res.status(200).send(response);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.post("/location",[ 
    auth,[check('Location' , 'Location is required').not().isEmpty()]
],async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors : errors.array() });
    }
    try {
        const {Location} = req.body;
        const response = await User.findOneAndUpdate({_id:req.user.id},{Location : Location});

        res.status(200).send(response);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.post("/table",[ 
    auth,[check('nTables' , 'Number of Tables is required').not().isEmpty()]
],async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors : errors.array() });
    }

    try {
        const {nTables} = req.body;
        const response = await User.findOneAndUpdate({_id:req.user.id},{nTables : nTables});

        res.status(200).send(response);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});


const multer = Multer({
    storage: Multer.MemoryStorage,
    limits: {
          fileSize: 5 * 1024 * 1024,
    },
});
const storage = new Storage({
    projectId : 'serve-my-table',
    keyFilename : './key.json'
});
const bucketName = 'restaurant-documents';
const bucket = storage.bucket(bucketName);

router.post("/upload",[auth,multer.single("myFile")],async (req,res)=>{

    
    const gcsFileName = uuid.v1()+path.extname(req.file.originalname);
    const file = bucket.file(gcsFileName);

    const stream = file.createWriteStream({
        metadata: {
            contentType: req.file.mimetype,
        },
    });

    stream.on('error', (err) => {
        req.file.cloudStorageError = err;
        res.status(500).send("Server Error");
    });
    try{
    stream.on('finish', () => {
        req.file.cloudStorageObject = gcsFileName;

        return file.makePublic()
              .then(async () => {
                    try{
                    const Url = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
                    req.file.gcsUrl = Url;
                
                    const user = await User.findOne({_id : req.user.id});

                    if(user.FileName){
                          bucket.file(user.FileName).delete();
                    }

                    await User.updateOne({_id : req.user.id},{$set : {ImageUrl : Url , FileName : gcsFileName}});
                    res.status(200).send("ok");

                }catch(err){
                    res.status(500).send("Server Error");
                }
        });
    });
    }catch(err){
        res.status(500).send("Server Error");
    }

  stream.end(req.file.buffer);
 
});

module.exports = router;