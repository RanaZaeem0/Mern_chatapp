import { v2 as cloudinary } from "cloudinary"
import fs from 'fs'
import dotenv from "dotenv"
import { getBase64 } from "../lib/helper";
import { ApiError } from "./apiError";
import {v4 as uuid} from "uuid"

dotenv.config({
  path: './.env'
})

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});


const uploadOnCloudinary = async (fileLocalPath) => {
  try {
    if (!fileLocalPath) return console.log('filelocalpath error');

    const response = await cloudinary.uploader.upload(fileLocalPath, {
      resource_type: "auto"
    })

    const deleteFileSync = (filelocalpath:string) => {
      try {
        fs.unlinkSync(filelocalpath);
        console.log(`File deleted successfully: ${filelocalpath}`);
      } catch (err:any) {
        console.error(`Error deleting file: ${err.message}`);
      }
    };
    deleteFileSync(fileLocalPath)
    console.log('file  unlink');
    return response;



  } catch (error) {
    const deleteFileSync = (filelocalpath : string) => {
      try {
        fs.unlinkSync(filelocalpath);
        console.log(`File deleted successfully: ${filelocalpath}`);
      } catch (err:any) {
        console.error(`Error deleting file: ${err.message}`);
      }
    };
    deleteFileSync(fileLocalPath)
    console.log('file  unlink');
    return console.log(`Error during upload `,error);

  }
}
const uploadFilesToCloudinary = async (files:any) => {
  const uploadPromises = files.map(async (file) => {
    try {
      // Get base64 of file
      const base64File = await getBase64(file);
      
      // Upload to cloudinary
      const result :any= await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          base64File,
          {
            resource_type: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        );
      });

      // Delete local file after successful upload
      try {
        console.log("file",file.path);
        
        await fs.promises.unlink(file.path);
        console.log(`File deleted successfully: ${file.path}`);
      } catch (err) {
        await fs.promises.unlink(file.path);

        console.warn(`Warning: Could not delete temp file ${file.path}:`, err);
        // Continue execution even if file deletion fails
      }

      // Return formatted result
      return {
        url: result.secure_url,
        public_id:uuid()
      };
    } catch (error) {
      // Clean up file if upload fails
      await fs.promises.unlink(file.path);

      try {
        await fs.promises.unlink(file.path);
      } catch (unlinkError) {
        console.warn(`Warning: Could not delete temp file ${file.path}:`, unlinkError);
      }
      throw error; // Re-throw the original error
    }
  });

  try {
    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (err:any) {
    throw new ApiError(404, "Can't upload files", err);
  }
};

export { uploadOnCloudinary,uploadFilesToCloudinary }