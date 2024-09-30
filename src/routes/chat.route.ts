import { getMyChat, newGroupChat ,renameGroup,getChatDetails,sendAttachment,leaveGroup,removeMembers,addMembers} from "../controllers/chat.controller"
import express from "express"
import { verifyJwt } from "../middleware/auth.middleware"

const chatRoute  = express.Router()



chatRoute.get('/',(req,res)=>{
    res.json({
        msd:"Chats"
    })
})

chatRoute.post('/createNewGroup',verifyJwt,newGroupChat)
chatRoute.get('/getMyChat',verifyJwt,getMyChat)
chatRoute.put('/renameGroup',renameGroup)
chatRoute.get('/getChatDetails',getChatDetails)
chatRoute.post('/sendAttachment',sendAttachment)
chatRoute.route('/group')
.post(addMembers)
.put(leaveGroup)




export {chatRoute}