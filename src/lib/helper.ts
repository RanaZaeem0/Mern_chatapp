
import {userSocketIDs} from "../index"
import fs from "fs"
import { ApiError } from "../utils/apiError";

export const getOtherMember = (members:any, userId:string) =>
    members.find((member) => member._id.toString() !== userId.toString());


export const getSocket = (users:any)=>{
  console.log(users,"user form get socket");
  
  try {
    const sockets= users.map((user) => userSocketIDs.get(user.toString()))
    return sockets
  } catch (error) {
    throw new ApiError(404,"plz retry")
  }

}

export const getBase64 = async (file) =>{
  console.log(file,
    "files single"
  );
  const fileBuffer = await fs.promises.readFile(file.path);  
    return `data:${file.mimetype};base64,${fileBuffer.toString("base64")}`;
}

export const unLinkFileOnError = async (files:any)=>{
files.map( async (file) =>{
  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    await fs.promises.unlink(file.path);
    
  }
})
}