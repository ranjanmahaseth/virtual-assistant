import express from "express"
import { askToAssistant, getCurrentUser, updateAssistant } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"
import upload from "../middlewares/multer.js"

const userRouter = express.Router()

// Get current user profile
userRouter.get("/current", isAuth, getCurrentUser)

// Update assistant configuration
userRouter.post("/update", isAuth, upload.single("assistantImage"), updateAssistant)

// Ask question to assistant
userRouter.post("/asktoassistant", isAuth, askToAssistant)

export default userRouter
