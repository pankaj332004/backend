import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    // get channelId from request params
    // validate the channelId
    // check if user is trying to subscribe to their own channel
    // check if the user has already subscribed to this channel
    // if already subscribed, remove the subscription (unsubscribe)
    // if not subscribed, create a new subscription document
    // return the appropriate response

    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    // prevent user from subscribing to their own channel
    if (channelId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    if (existingSubscription) {
        // user is already subscribed, so unsubscribe
        await Subscription.findByIdAndDelete(existingSubscription._id);

        return res.status(200).json(
            new ApiResponse(200, { isSubscribed: false }, "Unsubscribed successfully")
        );
    }

    // user is not subscribed, so subscribe
    await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    });

    return res.status(200).json(
        new ApiResponse(200, { isSubscribed: true }, "Subscribed successfully")
    );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    // get channelId from request params
    // validate the channelId
    // use aggregation pipeline to find all subscribers of this channel
    // lookup subscriber details (fullName, username, avatar)
    // return the list of subscribers in response

    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
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
                subscriber: { $first: "$subscriber" }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    // get subscriberId from request params
    // validate the subscriberId
    // use aggregation pipeline to find all channels the user has subscribed to
    // lookup channel details (fullName, username, avatar)
    // return the list of subscribed channels in response

    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
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
                channel: { $first: "$channel" }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};
