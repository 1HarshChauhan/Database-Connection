import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema=mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            lowercase:true,
            trim:true
        },
        password:{
            type:String,
            required:true
        },
        fullName:{
            type:String,
            required:true,
            trim:true
        },
        avatar:{
            type:String,
            required:true
        },
        coverImage:{
            type:String
        },
        watchHistory:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video"
            }
        ]
    },
    {timestamps:true}
);

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
   this.password= await bcrypt.hash(this.password,15);
    next();
})

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.accessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            userName:this.userName,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.refreshToken=function(){
    return jwt.sign(
        {
            _id:this.id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User=mongoose.model("User",userSchema);