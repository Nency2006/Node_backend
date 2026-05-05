import {Router} from "express";
import { 
    registerUser,
    loginUser, 
    logOutUser, 
    refreshAccessToken, 
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDeatils,
    updateUserAvatar,
    updateUserCoverImage
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser
)

router.route("/login").post(
    loginUser
)

//secured Routes

router.route("/logout").post(verifyJWT, logOutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/update-password").put(verifyJWT, changeCurrentUserPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account").put(verifyJWT, updateAccountDeatils)

router.route("/update-avatae").put(verifyJWT, upload.single({name : "avatar"}), updateUserAvatar)

router.route("/update-coverImage").put(verifyJWT, upload.single({name : "coverImage"}) ,updateUserCoverImage)


export default router; 