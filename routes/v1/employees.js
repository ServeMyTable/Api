const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Employee = require('../../models/Employees');
const User = require('../../models/Users');
const Multer = require('multer');
const {Storage} = require('@google-cloud/storage');
const uuid = require('uuid');
const path = require('path');

//@route    GET api/employee/
//@desc     Get all employees
//@access   Private
router.get("/",auth,async (req,res)=>{

    try {
        const user = await User.findOne({_id : req.user.id});
        const Emp = await Employee.findOne({RestaurantID : user.Phone});    
        res.status(200).send(Emp.Employees);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


const multer = Multer({
    storage: Multer.MemoryStorage,
});
const storage = new Storage({
    projectId : 'serve-my-table',
    keyFilename : './key.json'
});
const bucketName = 'restaurant-documents';
const bucket = storage.bucket(bucketName);

//@route    POST api/employee/
//@desc     Add employee
//@access   Private
router.post("/",[auth,multer.any()],async (req,res)=>{

    try{
        const errors = [];
        const user = await User.findOne({_id : req.user.id});
        const ImageFileName = uuid.v1()+path.extname(req.files[0].originalname);
        const AadharFileName = uuid.v1()+path.extname(req.files[1].originalname);
        const PanFileName = uuid.v1()+path.extname(req.files[2].originalname);
        
        const file = bucket.file(ImageFileName);
        const file1 = bucket.file(AadharFileName);
        const file2 = bucket.file(PanFileName);        

        const stream = file.createWriteStream({
            metadata: {
                contentType: req.files[0].mimetype,
            }
        });
        const stream1 = file1.createWriteStream({
            metadata: {
                contentType: req.files[1].mimetype,
            }
        });
        const stream2 = file2.createWriteStream({
            metadata: {
                contentType: req.files[2].mimetype,
            }
        });

        stream.on('error', (err) => { 
            req.files[0].cloudStorageError = err;
            console.log(err);
            errors.push(err);
            res.status(500).send("Server Error"); 
        });
        stream1.on('error', (err) => {  
            req.files[1].cloudStorageError = err;
            console.log(err);
            errors.push(err);
            res.status(500).send("Server Error"); 
        });
        stream2.on('error', (err) => { 
            req.files[2].cloudStorageError = err;
            console.log(err);
            errors.push(err);
            res.status(500).send("Server Error"); 
        });
        stream.on('finish', async () => { 
            req.files[0].cloudStorageObject = ImageFileName;
            try{
                const object0 = await file.makePublic();
                req.files[0].gcsUrl = `https://storage.googleapis.com/${bucketName}/${ImageFileName}`;
                return object0;
            }catch(err){
                errors.push(err);
                console.log("Error while uploading Image");
            }
        });
        stream1.on('finish',async () => { 
            req.files[1].cloudStorageObject = AadharFileName;
            try{
                const object0 = await file1.makePublic();
                req.files[1].gcsUrl = `https://storage.googleapis.com/${bucketName}/${AadharFileName}`;
                return object0;
            }catch(err){
                errors.push(err);
                console.log("Error while uploading Aadhar File");
            } 
        });
        stream2.on('finish',async () => { 
            req.files[2].cloudStorageObject = PanFileName;
            try{
                const object0 = await file2.makePublic();
                req.files[2].gcsUrl = `https://storage.googleapis.com/${bucketName}/${PanFileName}`;
                return object0;
            }catch(err){
                errors.push(err);
                console.log("Error while uploading Pan File");
            }
        });
        if(errors.length <= 0){
        const singleEmployee = {
            Name : req.body.EmployeeName,
            Address : req.body.EmployeeAddress,
            Phone : req.body.EmployeePhone,
            Salary : req.body.EmployeeSalary,
            EmpPost : req.body.EmployeePost,
            DOB : req.body.EmployeeDOB,
            AadharNo : req.body.EmployeeAadhar,
            PanNo : req.body.EmployeePan,
            ImageFileName : ImageFileName,
            AadharFileName : AadharFileName,
            PanFileName : PanFileName,
            ImageFileUrl : `https://storage.googleapis.com/${bucketName}/${ImageFileName}`,
            AadharFileUrl : `https://storage.googleapis.com/${bucketName}/${AadharFileName}`,
            PanFileUrl : `https://storage.googleapis.com/${bucketName}/${PanFileName}`
        };
        const EmployeeDetails = await Employee.findOneAndUpdate(
                {RestaurantID : user.Phone}
                ,{$push:{Employees : singleEmployee}}
                ,{upsert:true}
        );
        res.status(200).send(EmployeeDetails.Employees);
        }else{
            console.log(errors);
            res.status(500).send('Server Error');
        }

        stream.end(req.files[0].buffer);
        stream1.end(req.files[1].buffer);
        stream2.end(req.files[2].buffer);

    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post("/delete",auth,async (req,res)=>{
    try{
        const empId = req.body.EmpId;
        const user = await User.findOne({_id : req.user.id});
        const ImageName = req.body.ImageFileName;
        const PanName = req.body.PanFileName;
        const AadharName = req.body.AadharFileName;
        bucket.file(ImageName).delete();
        bucket.file(PanName).delete();
        bucket.file(AadharName).delete();
        
        const response = await Employee.findOneAndUpdate(
            {RestaurantID:user.Phone},
            {$pull:{
                Employees : {_id: empId}
            }});
            
        res.status(200).send(response.Employees);
    }catch(err){
        console.log(err);
        res.status(500).send("Server Error");
    }
});


module.exports = router;