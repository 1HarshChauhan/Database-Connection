import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary=async (localFilePath)=>{
    try{
        if(!localFilePath) return null;
        response = await cloudinary.uploader.upload(localFilePath,{resource_type:"auto",public_id:"user_image"});
        console.log("file uploaded successfully",response.url);
        return response;
    }
    catch(error){
        fs.unlink(localFilePath);
        return null;
    }
}