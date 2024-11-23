import dotenv from "dotenv";
import app from "./app";
import mongoose from "mongoose";
import connectDB from "./db";
import { v4 as uuid } from "uuid";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "./constants/events";
import { getSocket } from "./lib/helper";
import { Message } from "./models/message.model";
import cookieParser from "cookie-parser";
import { socketAuthication } from "./middleware/auth.middleware";





dotenv.config({
  path: "./.env",
});

const server = createServer(app);
  const userSocketIDs  = new Map();




 const io = new Server(server,{
  cors:{
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }
});

app.set('io',io)



io.use((socket:any,next: () => void) => {
  cookieParser()(
    socket.request,
    socket.request.res,
    async (err)=> socketAuthication(err, socket, next)
  )
})




io.on("connection", (socket:any) => {
  const user = socket?.user

  userSocketIDs.set(user._id.toString(), socket.id);
  
  socket.on(NEW_MESSAGE,async ({ chatId,  members,message }) => {
    const messageForRealTime = {
      content: message,
      sender: {
        _id: user._id,
        name: user.name,
      },
      chat: new mongoose.Types.ObjectId(chatId),
      createAt: new Date().toISOString(),
    };

    console.log(NEW_MESSAGE,"da",members);
    
    const membersSocket = getSocket(members)

    io.to(membersSocket).emit(NEW_MESSAGE,{
      chatId,
      message:messageForRealTime
    })
    io.to(membersSocket).emit(NEW_MESSAGE_ALERT,{
      chatId
    })

    await Message.create(messageForRealTime);
  });

  console.log("user connected", socket.id);

  socket.on("disconnect", (socket) => {
    console.log("user is disconnects");

    userSocketIDs.delete(user._id.toString());
  });
});
const DbUri = process.env.MONGOURI;

connectDB(DbUri!);
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log("server is riunf on" + port);
});


export {
  userSocketIDs
}