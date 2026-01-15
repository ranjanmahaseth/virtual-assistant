import genToken from "../config/token.js"
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"

export const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const existEmail = await User.findOne({ email })
    if (existEmail) {
      return res.status(400).json({ message: "Email already exists!" })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters!" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name, password: hashedPassword, email
    })

    const token = await genToken(user._id)

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production"
    })

    return res.status(201).json({ ...user.toObject(), password: undefined })

  } catch (error) {
    console.error("SignUp error:", error)
    return res.status(500).json({ message: "Registration failed" })
  }
}

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }
    
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = await genToken(user._id)

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production"
    })

    return res.status(200).json({ ...user.toObject(), password: undefined })

  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({ message: "Login failed" })
  }
}

export const logOut = async (req, res) => {
  try {
    res.clearCookie("token")
    return res.status(200).json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    return res.status(500).json({ message: "Logout failed" })
  }
}
