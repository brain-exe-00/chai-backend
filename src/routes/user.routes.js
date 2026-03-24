import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
  // middleware
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coveImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

export default router;
