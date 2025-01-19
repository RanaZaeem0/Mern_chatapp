import dotenv from "dotenv";
import app from "./app";
import mongoose from "mongoose";
import connectDB from "./db";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT, START_TYPING, STOP_TYPING } from "./constants/events";
import { getSocket } from "./lib/helper";
import { Message } from "./models/message.model";
import cookieParser from "cookie-parser";
import { socketAuthication } from "./middleware/auth.middleware";
import errorHandler from "./utils/errorHandler";
import { ApiError } from "./utils/apiError";
import { log } from "console";





dotenv.config({
  path: "./.env",
});

const server = createServer(app);

const userSocketIDs = new Map();

const DbUri = process.env.MONGOURI;
connectDB(DbUri!);



const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://chat-frontend-peach.vercel.app",
      "http://localhost:4173",

    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.set('io', io)



io.use((socket: any, next: () => void) => {
  cookieParser()(
    socket.request,
    socket.request.res,
    async (err) => socketAuthication(err, socket, next)
  )
})


io.on("connection", (socket) => {
  console.log("New WebSocket connection:", socket.id);
  socket.on(NEW_MESSAGE, (data) => {
    console.log("NEW_MESSAGE received:", data);
  });
});

io.on("connection", (socket: any) => {
  const user = socket?.user

  userSocketIDs.set(user._id.toString(), socket.id);


  socket.on(START_TYPING, ({members,chatId})=>{
  console.log(members,chatId,"startTyping");
  const membersSocket = getSocket(members)
  io.to(membersSocket).emit(START_TYPING, {chatId  })
  })
  socket.on(STOP_TYPING,async ({members,chatId})=>{
    console.log(members,chatId,"stopTyping");
    const membersSocket = getSocket(members)
    io.to(membersSocket).emit(STOP_TYPING, {chatId  })
    })
  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const messageForRealTime = {
      content: message,
      sender: {
        _id: user._id,
        name: user.name,
      },
      chat: new mongoose.Types.ObjectId(chatId),
      createAt: new Date().toISOString(),
    };

    console.log(NEW_MESSAGE, "da", members);

    const membersSocket = getSocket(members)

    io.to(membersSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime
    })
    io.to(membersSocket).emit(NEW_MESSAGE_ALERT, {
      chatId
    })

try {
  
      await Message.create(messageForRealTime);
} catch (error) {
  throw  new ApiError(402,"message not send")
}
  });

  console.log("user connected", socket.id);

  socket.on("disconnect", () => {
    console.log("user is disconnects");

    userSocketIDs.delete(user._id.toString());
  });
});

const port = process.env.PORT || 3000;
app.use(errorHandler)

server.listen(port, () => {
  console.log("server is riunf on" + port);
});


export {
  userSocketIDs
}