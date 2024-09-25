import mongoose from "mongoose";


const mongooseIdVailder = (id:string) => {
  if(mongoose.Types.ObjectId.isValid(id)){
    return true
  }else{
    return  false
  }
}

const emitEvent = (req,event ,user,data)=>{
  console.log("emetie "+ event);
  
}



export   {emitEvent,mongooseIdVailder}
