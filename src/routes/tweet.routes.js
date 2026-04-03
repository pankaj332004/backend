import { Router } from "express";

import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
} from "../controllers/tweet.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// apply verifyJWT middleware to all routes in this file
router.use(verifyJWT);

// route to create a new tweet
router.route("/").post(createTweet);

// route to get all tweets of a specific user
router.route("/user/:userId").get(getUserTweets);

// route to update or delete a specific tweet
router.route("/:tweetId")
    .patch(updateTweet)
    .delete(deleteTweet);

export default router;
