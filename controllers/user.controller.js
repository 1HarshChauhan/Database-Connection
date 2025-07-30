import {ApiError,ApiResponse,tryCatch,uploadOnCloudinary} from "./../utils/index.js";
import {User} from "./../models/user.models.js";

const registerUser=tryCatch(
    async (req,res)=> {
        const {username,fullName,email,password}=req.body;
        if([username,fullName,email,password].some((val)=>val.trim()==="")){
            throw new ApiError(400,"All fields are valid");
        }
        const exist=await User.findOne({
            $or:[{username},{email}]
        });
        if(exist){
            console.log(exist);
            throw new ApiError(409,"username or email  already exist")
        }
        console.log("exist",exist);
        console.log("file data:",req.files)
        const avatarLocalPath=req.files?.avatar[0]?.path;
        let coverImageLocalPath;

        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
            coverImageLocalPath=req.files?.coverImage[0]?.path;
        }

        const avatar=await uploadOnCloudinary(avatarLocalPath);
        const coverImage=await uploadOnCloudinary(coverImageLocalPath);


        
        if(!avatar) throw new ApiError(400,"avatar image is compulsory");

        const user=await User.create({
            username:username.toLowerCase(),
            fullName,
            email,
            password,
            avatar:avatar.url,
            coverImage:coverImage?.url || "",

        })
        const createdUser = await User.findById(user._id).select("-password -refreshToken");
        if(!createdUser) throw new ApiError(500,"Server issue while register");

        return res.status(200).json(
            new ApiResponse(201,createdUser,"User registered successfully")
        )

    }
)

export {registerUser};