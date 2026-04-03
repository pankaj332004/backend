import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    // get videoId from request params
    // validate the videoId
    // extract page and limit from query params for pagination
    // create aggregation pipeline to get all comments for the video
    // lookup the owner details (username, fullName, avatar) for each comment
    // sort comments by newest first
    // return paginated response

    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
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
            $addFields: {
                owner: { $first: "$owner" }
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ];

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const commentAggregate = Comment.aggregate(pipeline);
    const result = await Comment.aggregatePaginate(commentAggregate, options);

    return res.status(200).json(
        new ApiResponse(200, result, "Comments fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
    // get videoId from request params
    // validate the videoId
    // get content from request body
    // validate that content is not empty
    // check if the video exists
    // create the comment in the database
    // return the created comment in response

    const { videoId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });

    const createdComment = await Comment.findById(comment._id).populate("owner", "fullName username avatar");

    return res.status(201).json(
        new ApiResponse(201, createdComment, "Comment added successfully")
    );
});

const updateComment = asyncHandler(async (req, res) => {
    // get commentId from request params
    // validate the commentId
    // get new content from request body
    // validate that new content is not empty
    // find the comment and check if the current user is the owner
    // update the comment content
    // return the updated comment in response

    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // check if the current user is the owner of the comment
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $set: { content } },
        { new: true }
    ).populate("owner", "fullName username avatar");

    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    // get commentId from request params
    // validate the commentId
    // find the comment and check if the current user is the owner
    // delete the comment from the database
    // return success response

    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // check if the current user is the owner of the comment
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
};
