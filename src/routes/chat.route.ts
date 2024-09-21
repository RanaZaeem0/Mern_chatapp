import { getMyChat, newGroupChat } from "controllers/chat.controller"
import express from "express"

const chatRoute  = express.Router()



chatRoute.get('/',(req,res)=>{
    res.json({
        msd:"Chats"
    })
})

chatRoute.post('/createNewGroup',newGroupChat)
chatRoute.get('/',getMyChat)



export {chatRoute}