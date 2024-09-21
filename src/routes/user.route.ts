import { loginUser, registerUser } from "controllers/user.controller"
import express from "express"
import { upload } from "middleware/multer.middleware"

const userRoute  = express.Router()


userRoute.post('/login',upload.single('avatar'),loginUser)
userRoute.post('/new',registerUser)

userRoute.get('/',(req,res)=>{
    res.json({
        msd:"dsa"
    })
})



export {userRoute}