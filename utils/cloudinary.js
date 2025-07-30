import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
    
    const setUp=()=>{cloudinary.config({
        cloud_name:process.env.CLOUD_NAME,
        api_key:process.env.CLOUDINARY_API_KEY,
        api_secret:process.env.CLOUDINARY_API_SECRET
    });
}

const uploadOnCloudinary=async (localFilePath)=>{
    setUp();
    try{
        if(!localFilePath || !fs.existsSync(localFilePath)){
            console.log("file not found in local path",localFilePath);
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"});
        console.log("file uploaded successfully",response.url);
        fs.unlinkSync(localFilePath);
        return response;
    }
    catch(error){
        console.log("error occured while uploading file in cloudinary",error);
        fs.unlinkSync(localFilePath);
    }
}

export {uploadOnCloudinary};