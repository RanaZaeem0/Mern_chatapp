import express from "express";
import { userRoute } from "./routes/user";

const app = express()

app.get('/',(req,res)=>{
res.json({
    mea:"pk"
})
})
app.use('/user',userRoute)


app.listen(3000,()=>{
    console.log("server is rounf");
    
})