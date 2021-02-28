const mongoose = require("mongoose");
const config = require("config");
const db = config.get("MongoDB_Url");

const connectDB = async ()=>{
    try{
        
        await mongoose.connect(db,{
            auth:{
                user:'servemytable',
                password:'**$SMT199899$**'
            },  
            useNewUrlParser : true,
            useFindAndModify : true,
            useCreateIndex : true,
            useUnifiedTopology : true,
        });
        console.log("MongoDB Connected Successfully...");
    }catch(err){
        console.log("Error connecting to Database...");
        console.error(err);
        //Exit Process with failure
        process.exit(1);
    }
}

module.exports = connectDB;