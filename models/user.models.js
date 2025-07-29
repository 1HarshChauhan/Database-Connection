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
    this.password=bcrypt.hash(this.password,5);
    next();
})

userSchema.methods.isPasswordCorrect=async function(password){
    return bcrypt.compare(password,this.password);
}


export const User=mongoose.model("User",userSchema);