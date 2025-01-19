import cookieParser from "cookie-parser"
import express from "express"
import { chatRoute } from "./routes/chat.route"
import { userRoute } from "./routes/user.route"
import cors from "cors"
import corsOptions  from "./constants/config"
const app  = express()


app.use(express.json({ limit: '16kb' }))
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.use(cookieParser())


app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://chat-frontend-peach.vercel.app"

      ],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
}))

app.get('/api/v1/',(req,res)=>{
    console.log(req);
    
res.json({
    mea:"pk"
})
})

app.use('/api/v1/user',userRoute)
app.use('/api/v1/chat',chatRoute)


export default app