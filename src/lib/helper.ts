
import {userSocketIDs} from "../index"
import fs from "fs/promises"

export const getOtherMember = (members:any, userId:string) =>
    members.find((member) => member._id.toString() !== userId.toString());


export const getSocket = (users)=>{
    const sockets= users.map((user) => userSocketIDs.get(user.toString()))

    return sockets
}

export const getBase64 = async (file) =>{
  console.log(file,
    "files single"
  );
  const fileBuffer = await fs.readFile(file.path);  
    return `data:${file.mimetype};base64,${fileBuffer.toString("base64")}`;
}