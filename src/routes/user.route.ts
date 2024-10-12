import { loginUser, registerUser, logoutUser,getMyFriend, getMyFriendRequest,acceptFriendRequest ,sendFriendRequest,searchUser, getUserDetails, getNotification } from "../controllers/user.controller"
import express from "express"
import { verifyJwt } from "../middleware/auth.middleware"
import { upload } from "../middleware/multer.middleware"
import { getMyMessage } from "../controllers/chat.controller"

const userRoute  = express.Router()


userRoute.post('/login',loginUser)
userRoute.post('/new',upload.single('avatar'),registerUser)
userRoute.post('/logout',verifyJwt,logoutUser)
userRoute.get('/getMyFriend',verifyJwt,getMyFriend)
userRoute.get('/getMyFriendRequest',verifyJwt,getMyFriendRequest)
userRoute.put('/acceptFriendRequest',verifyJwt,acceptFriendRequest)
userRoute.put('/sendFriendRequest',verifyJwt,sendFriendRequest)
userRoute.get('/searchUser',searchUser)
userRoute.get('/me',verifyJwt,getUserDetails)
userRoute.get('/getMyNotification',verifyJwt,getNotification)
userRoute.get('/getMessage/:chatId',verifyJwt,getMyMessage)




userRoute.get('/',(req,res)=>{
    res.json({
        msd:"User Routes " 
    })
})



export {userRoute}