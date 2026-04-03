import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    // get videoId from request params
    // validate the videoId
    // check if the user has already liked this video
    // if already liked, remove the like (unlike)
    // if not liked, create a new like document
    // return the appropriate response

    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });

    if (existingLike) {
        // user has already liked this video, so remove the like
        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Video unliked successfully")
        );
    }

    // user has not liked this video, so create a new like
    await Like.create({
        video: videoId,
        likedBy: req.user._id
    });

    return res.status(200).json(
        new ApiResponse(200, { isLiked: true }, "Video liked successfully")
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    // get commentId from request params
    // validate the commentId
    // check if the user has already liked this comment
    // if already liked, remove the like (unlike)
    // if not liked, create a new like document
    // return the appropriate response

    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });

    if (existingLike) {
        // user has already liked this comment, so remove the like
        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Comment unliked successfully")
        );
    }

    // user has not liked this comment, so create a new like
    await Like.create({
        comment: commentId,
        likedBy: req.user._id
    });

    return res.status(200).json(
        new ApiResponse(200, { isLiked: true }, "Comment liked successfully")
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    // get tweetId from request params
    // validate the tweetId
    // check if the user has already liked this tweet
    // if already liked, remove the like (unlike)
    // if not liked, create a new like document
    // return the appropriate response

    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    });

    if (existingLike) {
        // user has already liked this tweet, so remove the like
        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Tweet unliked successfully")
        );
    }

    // user has not liked this tweet, so create a new like
    await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    });

    return res.status(200).json(
        new ApiResponse(200, { isLiked: true }, "Tweet liked successfully")
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
    // get the current user's id from req.user
    // use aggregation pipeline to find all likes by the user for videos
    // lookup the video details for each like
    // lookup the owner details for each video
    // return the list of liked videos in response

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
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
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video: { $first: "$video" }
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos,
};
