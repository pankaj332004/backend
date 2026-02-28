import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async (req,res)=>{
    // get user detail from frontend
    // validation of user details
    // check if user already exists  : username or email
    // check for images , check for avatar
    // upload images on the cloudinary , avatar
    // create user object - create entry in the db
    // remove password and refresh token field from response
    // check for user creation 
    // return  response to frontend


    const {username , email , fullName , password} = req.body
    
    console.log("email : ",email);
    
    if([fullName , email , username , password].some(field => field?.trim() === "")){
        throw new ApiError("All fields are required", 400);
    }

    User.findOne({
        $or : [{username} , {email}]
    })

    if(existedUser){
        throw new ApiError("User already exists with the provided username or email", 409);
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const converImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError("Avatar file is required", 400);
    }

    const avatar =  await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(converImageLocalPath);

    if(!avatar){
        throw new ApiError("Failed to upload avatar image", 500);
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "" ,
        email,
        username : username.toLowerCase(),
        password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    
    if(!createdUser){
        throw new ApiError("Failed to create user", 500);
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

export { registerUser };