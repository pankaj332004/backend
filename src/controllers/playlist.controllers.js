import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createPlaylist = asyncHandler(async (req, res) => {
    // get name and description from request body
    // validate that name and description are provided
    // get thumbnail from request file
    // validate that thumbnail is provided
    // upload thumbnail to cloudinary
    // create playlist document in the database with the current user as owner
    // return the created playlist in response

    const { name, description } = req.body;

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail");
    }

    const playlist = await Playlist.create({
        name,
        description,
        thumbnail: thumbnail.url,
        owner: req.user._id
    });

    const createdPlaylist = await Playlist.findById(playlist._id);

    if (!createdPlaylist) {
        throw new ApiError(500, "Failed to create playlist");
    }

    return res.status(201).json(
        new ApiResponse(201, createdPlaylist, "Playlist created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    // get userId from request params
    // validate the userId
    // find all playlists owned by the user
    // populate each playlist with video count and first video thumbnail
    // return the list of playlists in response

    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: { $size: "$videos" },
                totalViews: { $sum: "$videos.views" }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                thumbnail: 1,
                totalVideos: 1,
                totalViews: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, playlists, "User playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    // get playlistId from request params
    // validate the playlistId
    // find the playlist by id
    // populate the videos array with video details and owner info
    // if playlist not found, throw error
    // return the playlist in response

    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
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
                owner: { $first: "$owner" },
                totalVideos: { $size: "$videos" },
                totalViews: { $sum: "$videos.views" }
            }
        }
    ]);

    if (!playlist?.length) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist[0], "Playlist fetched successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    // get playlistId and videoId from request params
    // validate both playlistId and videoId
    // find the playlist and check if the current user is the owner
    // check if the video exists
    // check if the video is already in the playlist
    // add the video to the playlist's videos array
    // return the updated playlist in response

    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist id or video id");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // check if the current user is the owner of the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // check if the video is already in the playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is already in the playlist");
    }

    playlist.videos.push(videoId);
    await playlist.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // get playlistId and videoId from request params
    // validate both playlistId and videoId
    // find the playlist and check if the current user is the owner
    // check if the video exists in the playlist
    // remove the video from the playlist's videos array
    // return the updated playlist in response

    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist id or video id");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // check if the current user is the owner of the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    // check if the video exists in the playlist
    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is not in the playlist");
    }

    playlist.videos = playlist.videos.filter(
        (vid) => vid.toString() !== videoId
    );
    await playlist.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video removed from playlist successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    // get playlistId from request params
    // validate the playlistId
    // get name and description from request body
    // validate that at least one field is provided
    // find the playlist and check if the current user is the owner
    // update the playlist with the new details
    // return the updated playlist in response

    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    if (!name && !description) {
        throw new ApiError(400, "At least one of name or description is required");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // check if the current user is the owner of the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this playlist");
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $set: updateData },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    // get playlistId from request params
    // validate the playlistId
    // find the playlist and check if the current user is the owner
    // delete the playlist from the database
    // return success response

    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // check if the current user is the owner of the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist,
};
