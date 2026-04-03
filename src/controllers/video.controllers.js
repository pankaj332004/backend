import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    // get all videos based on query, sort, pagination
    // extract query params from request (page, limit, query, sortBy, sortType, userId)
    // build match object based on query and userId
    // create aggregation pipeline with match, sort, and pagination
    // return paginated response

    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const pipeline = [];

    // filter by search query if provided
    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        });
    }

    // filter by userId if provided
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    // only show published videos
    pipeline.push({
        $match: {
            isPublished: true
        }
    });

    // sort by the given field and order
    pipeline.push({
        $sort: {
            [sortBy]: sortType === "asc" ? 1 : -1
        }
    });

    // lookup owner details for each video
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
                {
                    $project: {
                        fullName: 1,
                        username: 1,
                        avatar: 1
                    }
                }
            ]
        }
    });

    // flatten the owner array to a single object
    pipeline.push({
        $addFields: {
            owner: { $first: "$owner" }
        }
    });

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const videoAggregate = Video.aggregate(pipeline);
    const result = await Video.aggregatePaginate(videoAggregate, options);

    return res.status(200).json(
        new ApiResponse(200, result, "Videos fetched successfully")
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    // get title and description from request body
    // validate that title and description are provided
    // get video file and thumbnail from request files
    // validate that both files are uploaded
    // upload video file to cloudinary
    // upload thumbnail to cloudinary
    // create video document in the database
    // return the created video in response

    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
        throw new ApiError(500, "Failed to upload video file");
    }

    if (!thumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration,
        owner: req.user._id,
        isPublished: true
    });

    const createdVideo = await Video.findById(video._id);

    if (!createdVideo) {
        throw new ApiError(500, "Failed to publish video");
    }

    return res.status(201).json(
        new ApiResponse(201, createdVideo, "Video published successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    // get videoId from request params
    // validate the videoId
    // find the video by id and populate owner details
    // if video not found, throw error
    // increment the view count by 1
    // add the video to user's watch history
    // return the video in response

    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId).populate("owner", "fullName username avatar");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // increment views
    await Video.findByIdAndUpdate(videoId, {
        $inc: { views: 1 }
    });

    // add video to user's watch history
    await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { watchHistory: videoId }
    });

    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    );
});

const updateVideo = asyncHandler(async (req, res) => {
    // get videoId from request params
    // validate the videoId
    // get title, description from request body
    // get thumbnail from request file (if updating)
    // find the video and check if the current user is the owner
    // if new thumbnail is provided, upload to cloudinary
    // update the video document with new details
    // return updated video in response

    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const { title, description } = req.body;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // check if the current user is the owner of the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    // if new thumbnail is provided, upload to cloudinary
    if (req.file?.path) {
        const thumbnail = await uploadOnCloudinary(req.file.path);
        if (!thumbnail) {
            throw new ApiError(500, "Failed to upload thumbnail");
        }
        updateData.thumbnail = thumbnail.url;
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    // get videoId from request params
    // validate the videoId
    // find the video and check if the current user is the owner
    // delete the video from the database
    // return success response

    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // check if the current user is the owner of the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    // get videoId from request params
    // validate the videoId
    // find the video and check if the current user is the owner
    // toggle the isPublished field
    // return the updated video in response

    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // check if the current user is the owner of the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to toggle publish status");
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, video, "Video publish status toggled successfully")
    );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
