import mongoose from "mongoose";
import {DBName} from "./../src/constant.js";


const connectDB=async ()=>{
    try{
        console.log(`${process.env.DATABASECONNECT}/${DBName}`);
        const databaseInstance=await mongoose.connect(`${process.env.DatabaseConnect}/${DBName}`);
    }
    catch(error){
        console.log(`error occured ${error}`);
        process.exit(1);
    }
}

export default connectDB;