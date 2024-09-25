import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import Jwt  from "jsonwebtoken";
import { ApiResponse } from "../utils/apiResponse";




const loginAdmin  = asyncHandler(
async(req:Request,res:Response)=>{

    const { secretKey,adminSecretKey} = req.body
    const isMatched  = secretKey == adminSecretKey

    if(!isMatched) throw new ApiError(402,"secret key is not valed")

        const token = process.env.ACCESS_TOKEN_SECRET
    
        if(!token){
            throw new ApiError(500,"token is not availbe")
        }
        const ValidateToken = Jwt.sign(secretKey,token)


        return res.status(201)
        .cookie("accesstokenAdmin",ValidateToken,{
            httpOnly:true,
        })
        .json(
            new ApiResponse(200,"admin Token",ValidateToken)
        )


})

const adminLogout  = asyncHandler(async(req:Request,res:Response)=>{



})

 