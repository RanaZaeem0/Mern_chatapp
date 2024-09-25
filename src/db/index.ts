import mongoose from "mongoose";
import env from "dotenv"



const connectDB = (DbUri:string) => {
    console.log(DbUri);
    
  mongoose
    .connect(DbUri!, {
      dbName: "chatsapp",
    })
    .then((e) => {
      console.log(e.connection.host,"connected");
    })
    .catch((error) => {
      throw error;
    });
};


export default connectDB;