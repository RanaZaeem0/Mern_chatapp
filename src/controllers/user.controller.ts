
import { Request, Response } from "express";
import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";

import { uploadOnCloudinary } from "../utils/cloudinary";
import zod from "zod"
import { ApiResponse } from "../utils/apiResponse";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();

        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return {
            accessToken,
            refreshToken,
        };
    } catch (error) {
        console.log(error + "acces tokn");

        throw new ApiError(
            500,
            "Somthing went wrong during cretion of acess token and refreshtoken"
        );
    }
};

const registerUser =async (req:Request, res:Response) => {
    try {

        const UserDataCheck = zod.object({
            username: zod.string().min(2),
            email: zod.string().email(),
            password: zod.string().min(2),
        });
        console.log(req.body ,"daas");

        //   take data from frontend
        console.log(req.body);
        const { username, password, email } = req.body;
        console.log(req.body);

        const validate = UserDataCheck.safeParse({
            username: username,
            password: password,
            email: email,
        });
        if (!validate.success) {
            throw new ApiError(400, "user data is not valid");
        }

        const exictedUser = await User.findOne({
            or: [{ username }, { email }],
        });

        if (exictedUser) {
            throw new ApiError(401, "User Name or email is Alredy Exicted");
        }

        const avatarLocalPath = req?.file?.path;
        
    
        let avatar
        if(avatarLocalPath){
            avatar = await uploadOnCloudinary(avatarLocalPath);
        }
    


       
       
        // console.log(avatar, "avatar ho ma");

        const user = await User.create({
            username,
            email,
            password,
            avatar: avatar?.url || "",
        });

        const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
            user._id
        );

        if (!user) {
            throw new ApiError(401,
                "user is not creted"
            )
        }

        const createdUser = await User.findOne(user._id).select(
            "-password -refreshToken"
        );

        if (!createdUser) {
            throw new ApiError(403, "User is not created in database");
        }

        const options = {
            httpOnly: true,
            secure: true
        }
        return res
            .status(201)
            .cookie('refreshToken', refreshToken, options)
            .cookie('accessToken', accessToken, options)

            .json(
                new ApiResponse(
                    200,
                    {
                        user: createdUser,
                        accessToken,
                        refreshToken,
                    },
                    "User Created successFully "
                )
            );
    } catch (error) {
        throw new ApiError(401, error)
    }

}


const loginUser = async (req:Request, res:Response) => {

    const loginDataCheck = zod.object({
        email:zod.string().email(),
        passowrd:zod.string(),

    })

    // get email,password
    const { email, password } = req.body;
    const validateLogin = loginDataCheck.safeParse({ email, password });
    if (!validateLogin.success) {
        throw new ApiError(402, "user Input is not correct");
    }
    // check the user is exict
    const user = await User.findOne({
        $or: [{ email }],
    });

    if (!user) {
        throw new ApiError(404, "Email or userName  is incorrect");
    }

    const passwordIsValide = await user.isPasswordCorrect(password);

    if (!passwordIsValide) {
        throw new ApiError(400, "passwrid is not valide");
    }
    console.log(user._id);

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const loginUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!loginUser) {
        throw new ApiError(404, "login User is not there");
    }
    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loginUser,
                    accessToken,
                    refreshToken,
                },
                "User logined in successFully "
            )
        );
}




export  {
    loginUser,
    registerUser
}