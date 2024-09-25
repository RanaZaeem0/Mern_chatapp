import { v2 as cloudinary } from "cloudinary"
import fs from 'fs'
import dotenv from "dotenv"

dotenv.config({
  path: '../../env'
})

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});


const uploadOnCloudinary = async (fileLocalPath:string) => {
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
    return console.log(`Error during upload `);

  }
}

export { uploadOnCloudinary }