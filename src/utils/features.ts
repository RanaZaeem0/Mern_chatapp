import mongoose from "mongoose";
import { getSocket } from "../lib/helper";


const mongooseIdVailder = (id:string) => {
  if(mongoose.Types.ObjectId.isValid(id)){
    return true
  }else{
    return  false
  }
}

const emitEvent = (req,event ,users,data)=>{
  const io = req.app.get('io')
  
  const userSocket = getSocket(users)
  io.to(userSocket).emit(event,data)
  
}



export   {emitEvent,mongooseIdVailder}
