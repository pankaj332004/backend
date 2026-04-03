import { Router } from "express";

import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
} from "../controllers/subscription.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// apply verifyJWT middleware to all routes in this file
router.use(verifyJWT);

// route to toggle subscription to a channel and get subscribers of a channel
router.route("/c/:channelId")
    .post(toggleSubscription)
    .get(getUserChannelSubscribers);

// route to get all channels a user has subscribed to
router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router;
