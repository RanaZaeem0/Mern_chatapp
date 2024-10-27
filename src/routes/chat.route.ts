import { getMyChat, newGroupChat ,renameGroup,getChatDetails,sendAttachment,leaveGroup,removeMembers,addMembers, getMyMessage} from "../controllers/chat.controller"
import express from "express"
import { verifyJwt } from "../middleware/auth.middleware"
import { upload,sendAttachments } from "../middleware/multer.middleware"
import { ApiError } from "../utils/apiError"

const chatRoute  = express.Router()



chatRoute.get('/',(req,res)=>{
    res.json({
        msd:"Chats"
    })
})

chatRoute.post('/createNewGroup',verifyJwt,newGroupChat)
chatRoute.get('/getMyChat',verifyJwt,getMyChat)
chatRoute.put('/renameGroup',renameGroup)
chatRoute.get('/getChatDetails/:chatId',getChatDetails)
chatRoute.post('/sendAttachment',
    (req, res, next) => {
        sendAttachments(req, res, (err) => {
            if (err) {
                return  null
            }
            // If we reach here, file upload was successful
            next();
        })
    }
   
    ,verifyJwt,sendAttachment)
chatRoute.route('/group')
.post(addMembers)
.put(leaveGroup)




export {chatRoute}