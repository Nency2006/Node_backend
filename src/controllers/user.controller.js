import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res ) => {
    //steps :
    // 1. get user info from frontend
    // 2. validation - not empty
    // 3. check if user exist or not - throw email or username
    // 4. check for images, check for avtar
    // 5. upload them to cloudinary, avtar
    // 6. create user object - create entry in db 
    // 7. remove password and referesh token from field from response
    // 8. check for user creation 
    // 9. return response

    const { fullname, email, username, password } = req.body 
    console.log("email" , email);
    
    if (
        [fullname, email, username, password].some((field) => 
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existUser) {
        throw new ApiError(409, "User With email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file id requier")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file id requier")
    }

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Somthing went wrong while registring a user")
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser, "User registerd Successfully")
    )

})

export {registerUser}