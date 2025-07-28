import mongoose from "mongoose";
import {DBName} from "./../src/constant.js";


const connectDB=async ()=>{
    try{
        const databaseInstance=await mongoose.connect(`${process.env.DatabaseConnect}/${DBName}`);
        console.log(databaseInstance);
        console.log("database connected");
        console.log(databaseInstance.connection.host);
    }
    catch(error){
        console.log(`error occured ${error}`);
        process.exit(1);
    }
}

export default connectDB;