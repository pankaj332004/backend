import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({limit:"16Kb"}));
app.use(express.urlencoded({extended:true, limit:"16Kb"}));
app.use(express.static('public'));
app.use(cookieParser());

// routes
import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import likeRoutes from "./routes/like.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import tweetRoutes from "./routes/tweet.routes.js";

// routes declaration
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/videos", videoRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/likes", likeRoutes);
app.use("/api/v1/playlists", playlistRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/tweets", tweetRoutes);

export { app };