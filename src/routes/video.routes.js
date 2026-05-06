import { Router } from "express";
import { publishAVideo } from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/publish-video")
    .post(
        verifyJWT,
        upload.fields([
            {
                name : "video",
                maxCount : 1
            },
            {
                name : "thumbnail",
                maxCount : 1
            }
        ]),
        publishAVideo)

export default router;

