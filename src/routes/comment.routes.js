import { Router } from "express";

import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
} from "../controllers/comment.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// apply verifyJWT middleware to all routes in this file
router.use(verifyJWT);

// route to get all comments for a video and add a new comment
router.route("/:videoId")
    .get(getVideoComments)
    .post(addComment);

// route to update or delete a specific comment
router.route("/c/:commentId")
    .patch(updateComment)
    .delete(deleteComment);

export default router;
