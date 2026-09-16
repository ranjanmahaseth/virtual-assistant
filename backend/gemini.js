import axios from "axios"

const geminiResponse = async (command, assistantName, userName) => {
  if (!command || typeof command !== 'string') throw new Error('Invalid command');

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) throw new Error('Gemini API key not configured');

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`;

  const prompt = `You are a helpful virtual assistant named ${assistantName} created by ${userName}.
Analyze the user input and respond ONLY with a valid JSON object (no markdown, no extra text):
{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month" | "calculator-open" | "instagram-open" | "facebook-open" | "weather-show",
  "userInput": "<extracted search term for search types, otherwise the original input>",
  "response": "<your answer>"
}

Rules:
- Use "general" for ANY factual, informational, or conversational question. For "general" type, write a COMPLETE and HELPFUL answer in the response field. Do NOT say 'search Google' for general questions — answer them directly.
- Use "google-search" ONLY when user explicitly says 'search on google' or 'google this'.
- Use "youtube-search" or "youtube-play" when user wants to watch/play something on YouTube.
- Use "calculator-open" for calculator, "instagram-open" for Instagram, "facebook-open" for Facebook.
- Use "weather-show" for weather queries.
- Use "get-time", "get-date", "get-day", "get-month" for time/date queries.
- The response must be plain text suitable for text-to-speech (no bullet points, no markdown, no special characters).

User input: ${command}`;

  try {
    const result = await axios.post(apiUrl, {
      contents: [{ parts: [{ text: prompt }] }]
    });
    return result.data.candidates[0].content.parts[0].text;
  } catch (error) {
    throw new Error('AI service unavailable');
  }
}

export default geminiResponse;
