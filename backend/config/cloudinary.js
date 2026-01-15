import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
const uploadOnCloudinary = async (filePath) => {
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });

    try {
        const uploadResult = await cloudinary.uploader.upload(filePath);
        fs.unlinkSync(filePath); // Delete local file after upload
        return uploadResult; // Return full result object
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Clean up file on error
        }
        throw error; // Throw error to be handled by caller
    }
}


export default uploadOnCloudinary