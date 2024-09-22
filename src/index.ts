
import dotenv from "dotenv"
import app from "./app";
import mongoose from "mongoose";



dotenv.config({
    path:"./.env"
})

const DbUri = process.env.MONGOURI;

const connectDB = () => {
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
connectDB()
const port = process.env.PORT || 3000



app.listen(port,()=>{
    console.log("server is riunf on" + port);
    
})