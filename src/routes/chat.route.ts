import { getMyChat, newGroupChat ,renameGroup,getChatDetails,sendAttachment,leaveGroup,removeMembers,addMembers} from "../controllers/chat.controller"
import express from "express"

const chatRoute  = express.Router()



chatRoute.get('/',(req,res)=>{
    res.json({
        msd:"Chats"
    })
})

chatRoute.post('/createNewGroup',newGroupChat)
chatRoute.get('/getMyChat',getMyChat)
chatRoute.put('/renameGroup',renameGroup)
chatRoute.get('/getChatDetails',getChatDetails)
chatRoute.post('/sendAttachment',sendAttachment)
chatRoute.route('/group')
.post(addMembers)
.put(leaveGroup)




export {chatRoute}