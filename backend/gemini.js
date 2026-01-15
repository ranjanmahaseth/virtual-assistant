import axios from "axios"

const geminiResponse = async (command, assistantName, userName) => {
  // Input validation
  if (!command || typeof command !== 'string') {
    throw new Error('Invalid command parameter');
  }
  if (!assistantName || typeof assistantName !== 'string') {
    assistantName = 'Assistant';
  }
  if (!userName || typeof userName !== 'string') {
    userName = 'User';
  }

  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    console.log('Using API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');
    
    if (!API_KEY) {
      throw new Error('Gemini API key not configured');
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    const prompt = `You are a virtual assistant named ${assistantName} created by ${userName}. 
You are not Google. You will now behave like a voice-enabled assistant.

Your task is to understand the user's natural language input and respond with a JSON object like this:

{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month"|"calculator-open" | "instagram-open" |"facebook-open" |"weather-show"
  ,
  "userInput": "<search term only for google-search/youtube-search/youtube-play, otherwise original input>"

  "response": "<a short spoken response to read out loud to the user>"
}

Instructions:
- "type": determine the intent of the user.
- "userInput": For search commands (google-search/youtube-search/youtube-play), extract ONLY the search term. For other commands, use original input minus assistant name.
- "response": A short voice-friendly reply, e.g., "Sure, playing it now", "Here's what I found", "Today is Tuesday", etc.

Examples:
- Input: "Hey Alexa, search for cats on YouTube" → userInput: "cats", type: "youtube-search"
- Input: "Alexa, play Bollywood songs" → userInput: "Bollywood songs", type: "youtube-play"
- Input: "Search for weather on Google" → userInput: "weather", type: "google-search"

Type meanings:
- "general": if it's a factual or informational question
- "google-search": if user wants to search something on Google
- "youtube-search": if user wants to search something on YouTube or says "open youtube and search"
- "youtube-play": if user wants to directly play a video or song
- "calculator-open": if user wants to open a calculator
- "instagram-open": if user wants to open instagram
- "facebook-open": if user wants to open facebook
- "weather-show": if user wants to know weather
- "get-time": if user asks for current time
- "get-date": if user asks for today's date
- "get-day": if user asks what day it is
- "get-month": if user asks for the current month

Important:
- Use ${userName} agar koi puche tume kisne banaya 
- Only respond with the JSON object, nothing else.

now your userInput- ${command}
`;

    const result = await axios.post(apiUrl, {
      "contents": [{
        "parts": [{"text": prompt}]
      }]
    });
    
    return result.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API error:', error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    throw new Error('AI service unavailable');
  }
}

export default geminiResponse
