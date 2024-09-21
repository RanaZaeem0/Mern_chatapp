import multer from "multer";
import path from 'path'
import { v4 as uuidv4 } from "uuid";



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        // Generate a unique filename with UUID
        const uniqueSuffix = uuidv4();
        const fileExtension = path.extname(file.originalname);
        const originalName = path.basename(file.originalname, fileExtension);
        const newFilename = `${originalName}-${uniqueSuffix}${fileExtension}`;
        cb(null, newFilename);
      }
}
)

export const upload = multer({storage})