import express from "express";
import { userRoute } from "./routes/user.route";
import {connectDB} from "utils/features";
import dotenv from "dotenv"
import { chatRoute } from "routes/chat.route";

dotenv.config({
    path:"./.env"
})

const app = express()

connectDB()
app.get('/',(req,res)=>{
res.json({
    mea:"pk"
})
})
app.use('/user',userRoute)
app.use('/chat',chatRoute)



app.listen(3000,()=>{
    console.log("server is rounf");
    
})