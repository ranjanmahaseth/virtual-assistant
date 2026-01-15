import uploadOnCloudinary from "../config/cloudinary.js";
import User from "../models/user.model.js";
import moment from "moment";
import geminiResponse from "../gemini.js";

// Get current user (without password)
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return res.status(500).json({ message: "Failed to get current user" });
  }
};

// Update assistant: name + image (upload file or selected image URL)
export const updateAssistant = async (req, res) => {
  try {
    console.log("=== UPDATE ASSISTANT START ===");
    console.log("Request body:", req.body);
    console.log("User ID:", req.userId);
    console.log("File present:", !!req.file);
    
    const { assistantName, imageUrl } = req.body;
    
    if (!assistantName) {
      console.log("ERROR: No assistant name provided");
      return res.status(400).json({ message: "Assistant name is required" });
    }

    let assistantImage;
    
    // For now, skip Cloudinary and just use the imageUrl
    if (imageUrl) {
      assistantImage = imageUrl;
      console.log("Using imageUrl:", assistantImage);
    } else if (req.file) {
      // Temporary: use a placeholder for file uploads
      assistantImage = "https://via.placeholder.com/300x400/0066cc/ffffff?text=Assistant";
      console.log("File upload detected, using placeholder image");
    } else {
      console.log("ERROR: No image provided");
      return res.status(400).json({ message: "Assistant image is required" });
    }

    console.log("Updating user with:", { assistantName, assistantImage });
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { assistantName, assistantImage },
      { new: true }
    ).select("-password");

    if (!user) {
      console.log("ERROR: User not found with ID:", req.userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("SUCCESS: User updated:", { id: user._id, assistantName: user.assistantName });
    console.log("=== UPDATE ASSISTANT END ===");
    
    return res.status(200).json(user);
    
  } catch (error) {
    console.error("=== UPDATE ASSISTANT ERROR ===");
    console.error("Error details:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
      message: "Failed to update assistant", 
      error: error.message
    });
  }
};

// Ask the assistant a question
export const askToAssistant = async (req, res) => {
  try {
    console.log('=== ASK ASSISTANT START ===');
    const { command } = req.body;
    console.log('Command received:', command);

    if (!command || typeof command !== "string") {
      console.log('Invalid command');
      return res.status(400).json({ response: "Invalid command" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: "User not found" });
    }

    console.log('User found:', user.name);
    console.log('Assistant name:', user.assistantName);

    // Save command to history
    user.history.push(command);
    await user.save();

    const userName = user.name;
    const assistantName = user.assistantName || "Assistant";

    console.log('Calling Gemini API...');
    let result;
    try {
      result = await geminiResponse(command, assistantName, userName);
      console.log('Raw Gemini response:', result);
    } catch (error) {
      console.log('Gemini API failed, using fallback response');
      
      // Simple command detection fallback
      const lowerCommand = command.toLowerCase();
      
      // YouTube commands - more flexible detection
      if ((lowerCommand.includes('youtube') || lowerCommand.includes('you tube')) && 
          (lowerCommand.includes('search') || lowerCommand.includes('play') || lowerCommand.includes('open'))) {
        
        // Extract search term more accurately
        let searchTerm = command
          .replace(new RegExp(assistantName, 'gi'), '')
          .replace(/hello|hi|hey|please|open|and|on/gi, '')
          .replace(/youtube|you tube|search|play/gi, '')
          .trim();
        
        // Clean up extra spaces
        searchTerm = searchTerm.replace(/\s+/g, ' ').trim();
        
        console.log('YouTube command detected. Search term:', searchTerm);
        
        result = JSON.stringify({
          type: "youtube-search",
          userInput: searchTerm || "music",
          response: "Opening YouTube search for you"
        });
      } else if (lowerCommand.includes('google') && lowerCommand.includes('search')) {
        let searchTerm = command
          .replace(new RegExp(assistantName, 'gi'), '')
          .replace(/hello|hi|hey|please|and|on/gi, '')
          .replace(/google|search/gi, '')
          .trim();
        
        searchTerm = searchTerm.replace(/\s+/g, ' ').trim();
        
        result = JSON.stringify({
          type: "google-search",
          userInput: searchTerm || "search",
          response: "Searching on Google for you"
        });
      } else if (lowerCommand.includes('time')) {
        result = JSON.stringify({
          type: "get-time",
          userInput: command,
          response: "Here's the current time"
        });
      } else if (lowerCommand.includes('date')) {
        result = JSON.stringify({
          type: "get-date",
          userInput: command,
          response: "Here's today's date"
        });
      } else if (lowerCommand.includes('how are you')) {
        result = JSON.stringify({
          type: "general",
          userInput: command,
          response: `I'm doing great! How can I help you today?`
        });
      } else if (lowerCommand.includes('who created you') || lowerCommand.includes('who made you')) {
        result = JSON.stringify({
          type: "general",
          userInput: command,
          response: `I was created by ${userName}`
        });
      } else {
        result = JSON.stringify({
          type: "general",
          userInput: command,
          response: "I can help you search YouTube, Google, check time, and answer basic questions. What would you like to do?"
        });
      }
    }

    // Extract JSON from response if it's embedded in text
    const jsonMatch = result.match(/{[\s\S]*}/);
    console.log('JSON match found:', !!jsonMatch);
    
    if (!jsonMatch) {
      console.log('No JSON found in response');
      return res.status(400).json({ response: "Sorry, I can't understand." });
    }

    // Try parsing JSON safely
    let gemResult;
    try {
      gemResult = JSON.parse(jsonMatch[0]);
      console.log('Parsed result:', gemResult);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return res.status(400).json({ response: "Sorry, I can't understand." });
    }

    const type = gemResult?.type;
    if (!type) {
      return res.status(400).json({ response: "Invalid command type" });
    }

    // Handle different types of commands
    switch (type) {
      case "get-date":
        return res.json({
          type,
          userInput: gemResult.userInput || "",
          response: `Current date is ${moment().format("YYYY-MM-DD")}`,
        });

      case "get-time":
        return res.json({
          type,
          userInput: gemResult.userInput || "",
          response: `Current time is ${moment().format("hh:mm A")}`,
        });

      case "get-day":
        return res.json({
          type,
          userInput: gemResult.userInput || "",
          response: `Today is ${moment().format("dddd")}`,
        });

      case "get-month":
        return res.json({
          type,
          userInput: gemResult.userInput || "",
          response: `This month is ${moment().format("MMMM")}`,
        });

      case "google-search":
      case "youtube-search":
      case "youtube-play":
      case "general":
      case "calculator-open":
      case "instagram-open":
      case "facebook-open":
      case "weather-show":
        return res.json({
          type,
          userInput: gemResult.userInput || "",
          response: gemResult.response || "No response provided",
        });

      default:
        return res
          .status(400)
          .json({ response: "I didn't understand that command." });
    }
  } catch (error) {
    console.error("askToAssistant error:", error);
    return res.status(500).json({ response: "Ask assistant failed" });
  }
};