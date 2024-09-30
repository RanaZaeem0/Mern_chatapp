import dotenv from "dotenv";
import app from "./app";
import mongoose from "mongoose";
import connectDB from "./db";
import { v4 as uuid } from "uuid";
import { Server } from "socket.io";
import { createServer } from "http";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "./constants/events";
import { getSocket } from "./lib/helper";
import { Message } from "./models/message.model";

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

io.use((socket,next)=>{
  
})

const user = {
  _id: "dada",
  name: "asdsa",
};
io.on("connection", (socket) => {
  userSocketIDs.set(user._id.toString(), socket.id);
  socket.on(NEW_MESSAGE,async ({ chatId, message, members }) => {
    const messageForRealTime = {
      content: message,
      sender: {
        _id: user._id,
        name: user.name,
      },
      _id: uuid(),
      chatId: chatId,
      createAt: new Date().toISOString(),
    };
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