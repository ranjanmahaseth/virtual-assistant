import express from "express"
import { Login, logOut, signUp } from "../controllers/auth.controllers.js"

const authRouter = express.Router()

// User registration
authRouter.post("/signup", signUp)

// User login (both endpoints for compatibility)
authRouter.post("/login", Login)
authRouter.post("/signin", Login)

// User logout
authRouter.get("/logout", logOut)

export default authRouter