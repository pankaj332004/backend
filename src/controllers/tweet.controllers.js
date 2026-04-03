import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    // get content from request body
    // validate that content is not empty
    // create the tweet in the database with the current user as owner
    // return the created tweet in response

    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content is required");
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    });

    const createdTweet = await Tweet.findById(tweet._id).populate("owner", "fullName username avatar");

    if (!createdTweet) {
        throw new ApiError(500, "Failed to create tweet");
    }

    return res.status(201).json(
        new ApiResponse(201, createdTweet, "Tweet created successfully")
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
    // get userId from request params
    // validate the userId
    // find all tweets by the user using aggregation
    // lookup the owner details for each tweet
    // lookup the likes count for each tweet
    // sort tweets by newest first
    // return the list of tweets in response

    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
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
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" },
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                content: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1,
                createdAt: 1,
                updatedAt: 1
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, tweets, "User tweets fetched successfully")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
    // get tweetId from request params
    // validate the tweetId
    // get new content from request body
    // validate that new content is not empty
    // find the tweet and check if the current user is the owner
    // update the tweet content
    // return the updated tweet in response

    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content is required");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // check if the current user is the owner of the tweet
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: { content } },
        { new: true }
    ).populate("owner", "fullName username avatar");

    return res.status(200).json(
        new ApiResponse(200, updatedTweet, "Tweet updated successfully")
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
    // get tweetId from request params
    // validate the tweetId
    // find the tweet and check if the current user is the owner
    // delete the tweet from the database
    // return success response

    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // check if the current user is the owner of the tweet
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    );
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
};
