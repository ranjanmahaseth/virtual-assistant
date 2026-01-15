import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {
  try {
    console.log("=== AUTH CHECK ===");
    console.log("Cookies:", req.cookies);
    
    const token = req.cookies.token;
    console.log("Token:", token ? "Present" : "Missing");
    
    if (!token) {
      console.log("ERROR: No token found");
      return res.status(401).json({ message: "Not authorized" });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decode);
    
    req.userId = decode.userId;
    console.log("User ID set:", req.userId);
    console.log("=== AUTH SUCCESS ===");
    
    next();
  } catch (error) {
    console.error("=== AUTH ERROR ===");
    console.error("JWT Error:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default isAuth;
