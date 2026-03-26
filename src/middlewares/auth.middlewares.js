import { asyncHandler } from "../utils/asyncHandler"
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const  verifyJWT = asyncHandler(async (req, _,next)=>{
    // get the access token from the cookies
    // if no token is found, return an error response
    // if token is found, verify the token
    // if token is invalid, return an error response
    // if token is valid, attach the user info to the req object and call next()
    try {
        const accessToken = req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer ", "");
    
        if(!accessToken){
           throw new ApiError(401, "Unauthorized request");
        }
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        
        const user = await User.findById(decoded?._id).select("-password -refreshToken")
            
        if(!user){    
            throw new ApiError(401, "Invalid Access Token");
        }
        req.user = user;
            
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
    }
    
});

