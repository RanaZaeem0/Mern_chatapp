import mongoose from "mongoose";

const DbUri = process.env.MONGOURI;

const connectDB = () => {
  mongoose
    .connect(DbUri!, {
      dbName: "chatapp",
    })
    .then((e) => {
      console.log(e.connection.host);
    })
    .catch((error) => {
      throw error;
    });
};



const emitEvent = (req,event ,user,data)=>{
  console.log("emetie "+ event);
  
}



export   {connectDB, emitEvent}
