import dotenv from "dotenv";
import connectDB from './../db/index.js';
import {app} from './app.js';

dotenv.config({
    path:'./.env'
})

connectDB()
.then(
    ()=>{
        app.on("error",(error)=>{
            console.log("error",error);
            throw error;
        })
        app.listen(process.env.PORT || 8000,(req,res)=>{
            console.log(`server is running on port ${process.env.PORT}`);
        })
    }
)
.catch(
    (error)=>{
        console.log("error occured",error);
    }
)

