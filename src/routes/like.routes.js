import { Router } from "express";

import {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos,
} from "../controllers/like.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// apply verifyJWT middleware to all routes in this file
router.use(verifyJWT);

// route to toggle like on a video
router.route("/toggle/v/:videoId").post(toggleVideoLike);

// route to toggle like on a comment
router.route("/toggle/c/:commentId").post(toggleCommentLike);

// route to toggle like on a tweet
router.route("/toggle/t/:tweetId").post(toggleTweetLike);

// route to get all liked videos of the current user
router.route("/videos").get(getLikedVideos);

export default router;
