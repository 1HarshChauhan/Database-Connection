import {ApiError,ApiResponse,tryCatch,uploadOnCloudinary,options} from "./../utils/index.js";
import {User} from "./../models/user.models.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken=async (id)=>{
    try{
        const user=await User.findById(id);
        const accessToken=await user.accessToken();
        const refreshToken=await user.refreshingToken();
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken};
    }
    catch(error){
        throw new ApiError(400,`got error whie generating tokens ${error}`)
    }
}

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
const loginUser=tryCatch(
    async (req,res) => {
        const {username,email,password}=req.body;
        if(!username && !email){
            throw new ApiError(400,"Either provide username or email");
        }
        const user=await User.findOne({
            $or:[{username},{email}]
        })
        if(!user){
            throw new ApiError(400,"enter valid username");
        }
        const isPasswordValid=await user.isPasswordCorrect(password);
        if(!isPasswordValid){
            throw new ApiError(400,"Invalid Password");
        }

        const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);

        const loggedInUser=await User.findById(user._id).select("-password -refreshToken");


        return res.
        status(200).
        cookie("accessToken",accessToken,options).
        cookie("refreshToken",refreshToken,options).
        json(new ApiResponse(200,
            {
                user:loggedInUser,
                accessToken,
                refreshToken
            },
            "user logged in successfuly"))

    }
)

const logoutUser=tryCatch(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },{
            new:true
        }
    )

    return res.
    status(200).
    clearCookie("accessToken",options).
    clearCookie("refreshToken",options).
    json(
        new ApiResponse(200,{},"User logged out successfully")
    )
});

const refreshAccessToken=tryCatch(async(req,res)=>{
   try {
     const incomingRefreshToken= req.cookies?.refreshToken || req.body.refreshToken;
     if(!incomingRefreshToken) throw new ApiError(401,"couldnt get the refresh token");
     const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
     const user=await User.findById(decodedToken._id);
     if(user?.refreshToken!=incomingRefreshToken) throw new ApiError(401,"Wrong refresh token");
    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);

    return res.
    status(200).
    cookie("accessToken",accessToken,options).
    cookie("refreshToken",refreshToken,options).
    json(
        new ApiResponse(200,
            {accessToken,refreshToken},
            "token refreshed succesfully")
    )

   } catch (error) {
        throw new ApiError(401,error?.message||"something wrong while refreshing access token");
   }
})


const changePassword=tryCatch(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;
    const user=req.user;
    if(!oldPassword || !newPassword) throw new ApiError(401,"please provide old and newPassword");
    if(!user) throw new ApiError(500,"something issue with connection, cant locate the user");
    const actualUser=await User.findById(user._id);
    if(actualUser?.email!=user.email) throw new ApiError(401,"email name not matched");
    if(await actualUser.isPasswordCorrect(oldPassword)) throw new ApiError(401,"wrong password");
    user.password=newPassword;
    await user.save({validateBeforeSave:false});
    const {accessToken,refreshToken}=generateAccessAndRefreshToken();
    return res.
    status(200).
    cookie("accessToken",accessToken,options).
    cookie("refreshToken",refreshToken,options).
    json(
        new ApiResponse(200,{},"password changed successfully")
    )
})

const getCurrentUser=tryCatch(async(req,res)=>{
    const user=req.user;
    if(!user) throw new ApiError(400,"no user logged in");
    return res.
    status(200).
    json(
        new ApiResponse(200,user,"user data displayed succesfully")
    )
});

const updateAvatar=tryCatch(async (req,res)=>{
    const avatarLocalPath=req.file?.path;
    if(!avatarLocalPath) throw new ApiError(400,"file not recieved");
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    if(!avatar) throw new ApiError(401,"file couldnt get uploaded");
    const user=User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar:avatar.url
        }
    },
        {new:true}
    ).select("-password -refreshToken");
    return res.
    status(200).
    json(
        new ApiResponse(201,user,"avatar updated succesfully")
    )

})

const getUserChannelProfile=tryCatch(async (req,res)=>{
    try {
        const {username}=req.params;
        if(!username.trim()) throw new ApiError(401,"the channel you are looking for is not available");
        const channel=User.aggregate([
            {
                $match:{
                    username:username?.toLowerCase()
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foriegnField:"channel",
                    as: "Subscribe"
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foriegnField:"subscriber",
                    as:"SubscribedTo"
                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size:"$Subscribe"
                    },
                    ChannelSubscriptionCount:{
                        $size:"$SubscribedTo"
                    },
                    isSubscribed:{
                        $cond:{
                            if:{$in:[req.user?._id,"$Subscribe.subscriber"]},
                            then:true,
                            else:false
                        },
                    }
                }
            },
                {
                    $project:{
                            username:1,
                            email:1,
                            subscribersCount:1,
                            ChannelSubscriptionCount:1,
                            isSubscribed:1,
                            avatar:1,
                            coverImage:1,
                            createdAt:1,
                            fullName:1
    
                    }
                }
        ]);
    if(!channel.length) throw new ApiError(401,"channel have no data retireved from server")
    } catch (error) {
        throw new ApiError(401,`this error occured ${error}`)
    }
    return res.
    status(200).
    json(
        new ApiResponse(200,channel[0],"channel info send succesfully")
    )
})

const getWatchHistory=tryCatch(async (req,res)=>{
    const user=User.aggregate([
        {$match:{
            _id: new mongoose.Schema.Types.ObjectId(user._id)
        }},
        {$lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                            $project:{
                                fullName:1,
                                username:1,
                                avatar:1
                            }
                        }
                        ]
                    }
                },
                {
                    $addField:{
                        owner:{
                            $first:"$owner"
                        }
                    }
                }
            ]
            
        }}
    ])
    return res.
    status(200).
    json(
        new ApiResponse(200,user[0].WatchHistory,"watch history fetched succesfully")
    )
});
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    updateAvatar,
    getWatchHistory,
    getUserChannelProfile
};