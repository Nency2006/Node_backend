import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";


const gentareAccessAndRefreshTokens = async (userId) => {
    try {
       const user =  await User.findById(userId);
       const accessToken = user.gentareAccessToken();
       
       const refreshToken = user.gentareRefreshToken();

       user.refreshToken = refreshToken;
       
       //await user.save({ validateBeforeSave: false })

       console.log("user data", user);
       

       return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Somthing went wrong while genrating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
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

    const { fullName, email, username, password } = req.body

    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existUser) {
        throw new ApiError(409, "User With email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file id requier")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file id requier")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Somthing went wrong while registring a user")
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser, "User registerd Successfully")
    )

})


const loginUser = asyncHandler(async (req, res) => {
    //steps ::
    // 1. email or pass from frontend
    // 2. validation
    // 3. check email exist or not
    // 4. password is match or not
    // 5. assign token access token or refresh token  
    // 6. send cookies
    // 7. response 

    const {email, username, password} = await req.body;
    console.log(email, username)
    
    if(!(email || username)){
        throw new ApiError(400, "Username or email required")
    }

    const user = await User.findOne({ 
        $or: [{email}, {username}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist");
    }

    //apni je methods chhe ae apna user ma che ae user ma che aetle apne User ni pn user lkhsu

    const isPasswordValid = await user.isPasswordCorrect(password)
    console.log(isPasswordValid);
    

    if(!isPasswordValid){
        throw new ApiError(401, "invalid user credantial")
    }

    const {accessToken, refreshToken} = await gentareAccessAndRefreshTokens(user._id)

    const loggedinUser = await User.findById(user._id).select(" -password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedinUser, accessToken, refreshToken
            },
            "User Loggedin successfully"
        )
    )
    
})


const logOutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new : true
        }
    )

        const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "User Loged Out"
        )
    )
})

const refreshAccessToken = asyncHandler(async (req, res)=>{
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incommingRefreshToken){
        throw new ApiError(401, "Unauthorised Request")
    }
    
    try {
        const decodedToken = jwt.verify(
            incommingRefreshToken,
            process.env.REFERESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incommingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is Expired or used")
        }
    
        const {accessToken, newRefreshToken} = await gentareAccessAndRefreshTokens(user._id)
        const options = {
            httpOnly : true,
            secure : true
        }
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, newRefreshToken},
                "Access Token Refresed Successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")
    }
})
export { 
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken
}