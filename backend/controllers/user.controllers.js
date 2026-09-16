import uploadOnCloudinary from "../config/cloudinary.js";
import User from "../models/user.model.js";
import moment from "moment";
import geminiResponse from "../gemini.js";

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(400).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get current user" });
  }
};

export const updateAssistant = async (req, res) => {
  try {
    const { assistantName, imageUrl, assistantGender } = req.body;

    if (!assistantName) return res.status(400).json({ message: "Assistant name is required" });

    let assistantImage;
    if (imageUrl) {
      assistantImage = imageUrl;
    } else if (req.file) {
      const uploaded = await uploadOnCloudinary(req.file.path);
      assistantImage = uploaded?.secure_url;
    }

    if (!assistantImage) return res.status(400).json({ message: "Assistant image is required" });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { assistantName, assistantImage, assistantGender: assistantGender || 'female' },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update assistant" });
  }
};

const getOfflineResponse = (command, assistantName, userName) => {
  const lowerCommand = command.toLowerCase();

  const extractSearchTerm = (removeWords) => {
    return command
      .replace(new RegExp(assistantName, 'gi'), '')
      .replace(new RegExp(removeWords.join('|'), 'gi'), '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // YouTube
  if (lowerCommand.includes('youtube') || lowerCommand.includes('you tube') ||
      (lowerCommand.includes('play') && (lowerCommand.includes('song') || lowerCommand.includes('video') || lowerCommand.includes('music')))) {
    const searchTerm = extractSearchTerm(['hello', 'hi', 'hey', 'please', 'open', 'and', 'on', 'youtube', 'you tube', 'search', 'play']);
    return { type: "youtube-search", userInput: searchTerm || "music", response: "Searching on YouTube for you" };
  }

  // Google
  if (lowerCommand.includes('google') ||
      (lowerCommand.includes('search') && !lowerCommand.includes('youtube'))) {
    const searchTerm = extractSearchTerm(['hello', 'hi', 'hey', 'please', 'and', 'on', 'google', 'search']);
    return { type: "google-search", userInput: searchTerm || "search", response: "Searching on Google for you" };
  }

  // Time
  if (lowerCommand.includes('time')) {
    return { type: "get-time", userInput: command, response: "Here is the current time" };
  }

  // Date
  if (lowerCommand.includes('date')) {
    return { type: "get-date", userInput: command, response: "Here is today's date" };
  }

  // Day
  if (lowerCommand.includes('what day') || lowerCommand.includes('which day')) {
    return { type: "get-day", userInput: command, response: "Today is" };
  }

  // Calculator
  if (lowerCommand.includes('calculator')) {
    return { type: "calculator-open", userInput: command, response: "Opening calculator" };
  }

  // Instagram
  if (lowerCommand.includes('instagram')) {
    return { type: "instagram-open", userInput: command, response: "Opening Instagram" };
  }

  // Facebook
  if (lowerCommand.includes('facebook')) {
    return { type: "facebook-open", userInput: command, response: "Opening Facebook" };
  }

  // Weather
  if (lowerCommand.includes('weather')) {
    return { type: "weather-show", userInput: command, response: "Showing weather information" };
  }

  // Greetings
  if (lowerCommand.includes('hello') || lowerCommand.includes('hi') || lowerCommand.includes('hey')) {
    return { type: "general", userInput: command, response: `Hello ${userName}! How can I help you today?` };
  }

  // How are you
  if (lowerCommand.includes('how are you')) {
    return { type: "general", userInput: command, response: "I am doing great! How can I help you today?" };
  }

  // Who created / who are you
  if (lowerCommand.includes('who created you') || lowerCommand.includes('who made you') || lowerCommand.includes('who are you')) {
    return { type: "general", userInput: command, response: `I am ${assistantName}, your virtual assistant created by ${userName}.` };
  }

  // Thank you
  if (lowerCommand.includes('thank you') || lowerCommand.includes('thanks')) {
    return { type: "general", userInput: command, response: "You are welcome! Is there anything else I can help you with?" };
  }

  // Joke
  if (lowerCommand.includes('joke') || lowerCommand.includes('funny')) {
    const jokes = [
      "Why do programmers prefer dark mode? Because light attracts bugs!",
      "Why did the computer go to the doctor? Because it had a virus!",
      "What do you call a computer that sings? A Dell!",
      "Why was the math book sad? Because it had too many problems!"
    ];
    return { type: "general", userInput: command, response: jokes[Math.floor(Math.random() * jokes.length)] };
  }

  // Motivational / inspiration
  if (lowerCommand.includes('motivat') || lowerCommand.includes('inspir') || lowerCommand.includes('quote')) {
    const quotes = [
      "Believe you can and you are halfway there.",
      "The only way to do great work is to love what you do.",
      "It does not matter how slowly you go as long as you do not stop.",
      "Success is not final, failure is not fatal. It is the courage to continue that counts."
    ];
    return { type: "general", userInput: command, response: quotes[Math.floor(Math.random() * quotes.length)] };
  }

  // Science — gravity
  if (lowerCommand.includes('gravity')) {
    return { type: "general", userInput: command, response: "Gravity is a natural force that attracts objects with mass toward each other. On Earth, it pulls everything downward toward the center of the planet. It was described by Isaac Newton and later explained more deeply by Albert Einstein." };
  }

  // Science — sun
  if (lowerCommand.includes('sun')) {
    return { type: "general", userInput: command, response: "The Sun is a star at the center of our solar system. It is a giant ball of hot plasma that provides light and heat to Earth. It is about 150 million kilometers away from Earth." };
  }

  // Science — moon
  if (lowerCommand.includes('moon')) {
    return { type: "general", userInput: command, response: "The Moon is Earth's only natural satellite. It orbits Earth and reflects sunlight. It is about 384,000 kilometers away from Earth and affects ocean tides." };
  }

  // Science — water
  if (lowerCommand.includes('water')) {
    return { type: "general", userInput: command, response: "Water is a chemical compound made of two hydrogen atoms and one oxygen atom, written as H2O. It is essential for all life on Earth and covers about 71 percent of the Earth's surface." };
  }

  // Science — photosynthesis
  if (lowerCommand.includes('photosynthesis')) {
    return { type: "general", userInput: command, response: "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce food and oxygen. It happens in the chloroplasts of plant cells using a green pigment called chlorophyll." };
  }

  // Geography — India
  if (lowerCommand.includes('india')) {
    return { type: "general", userInput: command, response: "India is a country in South Asia and the world's most populous country. Its capital is New Delhi. India is known for its rich culture, history, and diversity. It gained independence from British rule on August 15, 1947." };
  }

  // Geography — capital of India
  if (lowerCommand.includes('capital of india')) {
    return { type: "general", userInput: command, response: "The capital of India is New Delhi." };
  }

  // History — Einstein
  if (lowerCommand.includes('einstein')) {
    return { type: "general", userInput: command, response: "Albert Einstein was a German-born physicist who developed the theory of relativity. He is best known for the equation E equals mc squared. He won the Nobel Prize in Physics in 1921." };
  }

  // History — Newton
  if (lowerCommand.includes('newton')) {
    return { type: "general", userInput: command, response: "Isaac Newton was an English mathematician and physicist. He discovered the laws of motion and universal gravitation. He also developed calculus and studied the nature of light." };
  }

  // Programming — JavaScript
  if (lowerCommand.includes('javascript')) {
    return { type: "general", userInput: command, response: "JavaScript is a programming language used to create interactive websites and web applications. It runs in browsers and also on servers using Node.js." };
  }

  // Programming — Python
  if (lowerCommand.includes('python')) {
    return { type: "general", userInput: command, response: "Python is a high-level programming language known for its simple syntax. It is widely used for web development, data science, and artificial intelligence." };
  }

  // Programming — HTML
  if (lowerCommand.includes('html')) {
    return { type: "general", userInput: command, response: "HTML stands for HyperText Markup Language. It is the standard language used to create and structure web pages." };
  }

  // Programming — CSS
  if (lowerCommand.includes('css')) {
    return { type: "general", userInput: command, response: "CSS stands for Cascading Style Sheets. It is used to style and design web pages, controlling colors, fonts, and layout." };
  }

  // Programming — React
  if (lowerCommand.includes('react')) {
    return { type: "general", userInput: command, response: "React is a JavaScript library for building user interfaces. It was created by Facebook and uses reusable components." };
  }

  // Programming — Node
  if (lowerCommand.includes('node')) {
    return { type: "general", userInput: command, response: "Node.js is a JavaScript runtime that allows you to run JavaScript on the server side, outside of a browser." };
  }

  // What is / define / explain — fallback to Google
  if (lowerCommand.includes('what is') || lowerCommand.includes('what are') ||
      lowerCommand.includes('define') || lowerCommand.includes('meaning of')) {
    const topic = command.replace(/what is|what are|define|meaning of/gi, '').replace(new RegExp(assistantName, 'gi'), '').trim();
    return { type: "google-search", userInput: topic, response: `Let me search for ${topic} on Google` };
  }

  // How — fallback to Google
  if (lowerCommand.includes('how')) {
    const topic = command.replace(/how does|how do|how to|how/gi, '').replace(new RegExp(assistantName, 'gi'), '').trim();
    return { type: "google-search", userInput: topic, response: `Searching Google for ${topic}` };
  }

  // Who is — fallback to Google
  if (lowerCommand.includes('who is') || lowerCommand.includes('who was')) {
    const topic = command.replace(/who is|who was/gi, '').replace(new RegExp(assistantName, 'gi'), '').trim();
    return { type: "google-search", userInput: topic, response: `Searching Google for ${topic}` };
  }

  // Why / where / when / which / explain / difference — fallback to Google
  if (lowerCommand.includes('why') || lowerCommand.includes('where') ||
      lowerCommand.includes('when') || lowerCommand.includes('which') ||
      lowerCommand.includes('explain') || lowerCommand.includes('difference between')) {
    return { type: "google-search", userInput: command, response: `Searching Google for your question` };
  }

  // Default — search Google
  return { type: "google-search", userInput: command, response: `Let me search that for you on Google` };
};

export const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;
    if (!command || typeof command !== "string") {
      return res.status(400).json({ response: "Invalid command" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    user.history.push(command);
    await user.save();

    const userName = user.name;
    const assistantName = user.assistantName || "Assistant";

    let gemResult;

  try {
      const result = await geminiResponse(command, assistantName, userName);
      const cleaned = result.replace(/```json|```/gi, '').trim();
      const jsonMatch = cleaned.match(/{[\s\S]*}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      gemResult = JSON.parse(jsonMatch[0]);
      if (!gemResult.type || !gemResult.response) throw new Error("Invalid JSON structure");
    } catch (error) {
      gemResult = getOfflineResponse(command, assistantName, userName);
    }

    const type = gemResult?.type;
    if (!type) return res.status(400).json({ response: "Invalid command type" });

    switch (type) {
      case "get-date":
        return res.json({ type, userInput: gemResult.userInput || "", response: `Today's date is ${moment().format("MMMM Do YYYY")}` });

      case "get-time":
        return res.json({ type, userInput: gemResult.userInput || "", response: `Current time is ${moment().format("hh:mm A")}` });

      case "get-day":
        return res.json({ type, userInput: gemResult.userInput || "", response: `Today is ${moment().format("dddd")}` });

      case "get-month":
        return res.json({ type, userInput: gemResult.userInput || "", response: `This month is ${moment().format("MMMM")}` });

      default:
        return res.json({
          type,
          userInput: gemResult.userInput || "",
          response: gemResult.response || "Done",
        });
    }
  } catch (error) {
    return res.status(500).json({ response: "Ask assistant failed" });
  }
};
