import {tryCatch,ApiError} from "./../utils/index.js"
import {User} from "./../models/user.models.js"
import jwt from "jsonwebtoken";

export const verifyJWT=tryCatch(async (req,res,next)=>{
    try{
    const token=await req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    if(!token) throw new ApiError(401,"Unauthorized access");

    const decoded=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    const user=await User.findById(decoded._id);
    if(!user){
        throw new ApiError(401,"Invalid Access Token");
    }
    req.user=user;
    next();
    }
    catch(error){
        throw new ApiError(500,`something happened ${error?.message}`);
    }
})