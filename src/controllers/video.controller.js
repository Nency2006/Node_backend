import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const publishAVideo = asyncHandler(async (req, res) => {
    //steps : 
    //title, description - req.body
    //video file and thumbnail - req.file 
    // multer ma uplod
    // cloudinary upload
    // check validation
    // add duration throw cloudinary 
    // checked ispublished or not 
    // who is the owner
    // create video object - create entry in db
    //send response

    const { title, description } = req.body

    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Title or description required")
    }

    const videoLocalPath = req.files?.video[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if (!(videoLocalPath || thumbnailLocalPath)) {
        throw new ApiError(400, "video or thumbnail file are requier")
    }

    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!(video || thumbnail)) {
        throw new ApiError(400, "video or thumbnail file are requier")
    }

    const userId = req.user._id

    const createdVideo = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: video.duration,
        // isPublished,
        owner: userId
    })

    if (!createdVideo) {
        throw new ApiError(500, "Somthing went wrong while posting a video")
    }

    return res.status(200).json(
        new ApiResponse(200, createdVideo, "Video uploaded Successfully")
    )


})

export {
    publishAVideo
}