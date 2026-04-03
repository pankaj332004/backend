import { Router } from "express";

import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist,
} from "../controllers/playlist.controllers.js";

import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// apply verifyJWT middleware to all routes in this file
router.use(verifyJWT);

// route to create a new playlist (with thumbnail upload)
router.route("/").post(upload.single("thumbnail"), createPlaylist);

// route to get, update, or delete a specific playlist
router.route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

// route to add a video to a playlist
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);

// route to remove a video from a playlist
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

// route to get all playlists of a specific user
router.route("/user/:userId").get(getUserPlaylists);

export default router;
