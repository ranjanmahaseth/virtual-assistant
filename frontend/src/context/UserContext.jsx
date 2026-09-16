import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";

export const userDataContext = createContext();

export const useUserData = () => useContext(userDataContext);

function UserContext({ children }) {
  const serverUrl = "http://localhost:5000";
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedGender, setSelectedGender] = useState('female');

  const handleCurrentUser = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/user/current`, {
        withCredentials: true,
      });
      setUserData(result.data);
    } catch (error) {
      setUserData(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const getGeminiResponse = async (command) => {
    try {
      if (!command || typeof command !== "string") {
        return { type: "general", userInput: command, response: "Invalid command" };
      }
      const result = await axios.post(
        `${serverUrl}/api/user/asktoassistant`,
        { command },
        { withCredentials: true }
      );
      return result.data;
    } catch (error) {
      return { type: "general", userInput: command, response: "Sorry, I could not process your request. Please try again." };
    }
  };

  useEffect(() => {
    handleCurrentUser();
  }, []);

  const value = {
    serverUrl,
    userData,
    setUserData,
    backendImage,
    setBackendImage,
    frontendImage,
    setFrontendImage,
    selectedImage,
    setSelectedImage,
    selectedGender,
    setSelectedGender,
    getGeminiResponse,
    loadingUser,
    refreshUserData: handleCurrentUser,
  };

  return (
    <userDataContext.Provider value={value}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContext;
