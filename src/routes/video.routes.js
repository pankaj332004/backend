import { Router } from "express";

import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
} from "../controllers/video.controllers.js";

import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// apply verifyJWT middleware to all routes in this file
router.use(verifyJWT);

// route to get all videos with query, sort, and pagination
router.route("/").get(getAllVideos);

// route to publish a new video (upload videoFile and thumbnail)
router.route("/").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo
);

// route to get, update, or delete a single video by id
router.route("/:videoId")
    .get(getVideoById)
    .patch(upload.single("thumbnail"), updateVideo)
    .delete(deleteVideo);

// route to toggle the publish status of a video
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
