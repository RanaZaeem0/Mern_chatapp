import { Request, Response } from "express";
import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";

import { uploadOnCloudinary } from "../utils/cloudinary";
import zod from "zod";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Request as DBRequest } from "../models/request.model";
import { emitEvent, mongooseIdVailder } from "../utils/features";
import { NEW_REQUEST,REFETCH_CHATS } from "../constants/events";
import { Chat } from "../models/chat.model";
import { getOtherMember } from "../lib/helper";
import mongoose from "mongoose";

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

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  
    const UserDataCheck = zod.object({
      username: zod.string().min(2),
      name: zod.string(),
      bio:zod.string(),
      password: zod.string().min(2),
    });

    //   take data from frontend
    const { username, password, name,bio } = req.body;
  
    const validate = UserDataCheck.safeParse({
      username: username,
      password: password,
      name: name,
      bio:bio
    });
      
    if (!validate.success) {
      throw new ApiError(400, "user data is not valid");
    }
    
 
    const exictedUser = await User.findOne({
  username:username
    });
    
    if (exictedUser) {
      throw new ApiError(401, "User Name or name is Alredy Exicted");
    }
    

    const fileLocalPath = req?.file?.path



    let avatar 

    if(fileLocalPath){
      const uploadAvatar= await uploadOnCloudinary(fileLocalPath);
      avatar = {
        public_id: uploadAvatar?.public_id || "",
        url: uploadAvatar?.url || "",
      }
    }else{
      avatar = {
        public_id: "",
        url:"",
      }
    }



  


    const user = await User.create({
      username,
      name,
      bio,
      password,
      avatar: avatar
    });

    console.log(user, "user ho ma");
    

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
      user._id
    );

    if (!user) {
      throw new ApiError(401, "user is not creted");
    }

    const createdUser = await User.findOne(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(403, "User is not created in database");
    }

    const cookieOptions = {
      maxAge: 15 * 24 * 60 * 60 * 1000,
      sameSite: "none" as "none",
      httpOnly: true,
      secure: true,
    };
    return res
      .status(201)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .cookie("accessToken", accessToken, cookieOptions)

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

});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const loginDataCheck = zod.object({
    username: zod.string(),
    password: zod.string(),
  });

  // get name,password
  const { username, password } = req.body;
  const validateLogin = loginDataCheck.safeParse({ username, password });
  
  if (!validateLogin.success) {
    throw new ApiError(402, "user Input is not correct");
  }
  // check the user is exict
  const user = await User.findOne({
    username: username,
  }).select('+password')

  if (!user) {
    throw new ApiError(404,'username or password is inCorrect',[]);
  }

  const passwordIsValide = await user.isPasswordCorrect(password);

  if (!passwordIsValide) {
    throw new ApiError(400, "passwrid is not valide");
  }
  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loginUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loginUser) {
    throw new ApiError(404, "login User is not there");
  }
  const cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: "none" as "none",
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
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
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: "none" as "none",
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .clearCookie("refreshToken", cookieOptions)
    .clearCookie("accessToken", cookieOptions)
    .json(new ApiResponse(200, {}, "user logout sucees"));
});

const searchUser = asyncHandler(async (req: Request, res: Response) => {
  const name = req.query.name;

  if (!name) {
    throw new ApiError(400, "name is required");
  }
   
  const user = await User.find({
    username: { $regex: `^${name}`, $options: "i" },
  });

  

  if (!user ||user.length === 0 ) {
    throw new ApiError(404, "user not found");
  }

  return res.json(new ApiResponse(200, user, "user found"));
});

const sendFriendRequest = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const { userId } = req.body;

  if (!userId) {
    throw new ApiError(400, "userId is required");
  }
  if (!mongooseIdVailder(userId)) {
    throw new ApiError(400, "userId is not valide");
  }
    if (!user) {
    throw new ApiError(410, "user not found");
  }

  const sendRequest = await DBRequest.findOne({
    $or: [
      { sender: user._id, receiver: userId },
      { sender: userId, receiver: user._id },
    ],
  });

  if (sendRequest) {
    throw new ApiError(401, "request already sent",[""],"");
  }

  const createdRequest = await DBRequest.create({
    sender: user._id,
    receiver: userId,
  });

  if (!createdRequest) {
    throw new ApiError(402, "request not created");
  }

  emitEvent(req, NEW_REQUEST, [userId], "Request send to user");

  return res.json(new ApiResponse(201, createdRequest, "request created"));
});

const acceptFriendRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    const { requestId, accept } = req.body;

    if (!requestId) {
      throw new ApiError(400, "requestId is required");
    }
    if (!user) {
      throw new ApiError(410, "user not found");
    }

    const request = await DBRequest.findById(requestId)
      .populate("sender", "name")
      .populate("receiver", "name");

    if (!request) {
      throw new ApiError(401, "request not found");
    }
  
    
    if (request.receiver._id.toString() != user._id.toString()) {
      throw new ApiError(401, "you are not the receiver of this request");
    }
  
    if (!accept) {
        await request.deleteOne();
        return res.json(
          new ApiResponse(201, request, "request deleted")
        )
      }

      const members = [request.sender, request.receiver._id];


      const accepted = await DBRequest.findByIdAndUpdate(
        requestId,
        {
          status: "accepted",
        },
        {
          new: true,
        }
      );
      if(!accepted){
        throw new ApiResponse(402,"request not accepted")
      }
      await Promise.all([
        Chat.create({
          members,
          name: `${request.sender.name}-${request.receiver.name}`,
        }),
        request.deleteOne(),
      ]);

      emitEvent(req,REFETCH_CHATS,members,"request accepted");

      return res.json(
        new ApiResponse(201, accepted, "request accepted")
      )
   


  }
);


const getMyFriendRequest = asyncHandler(async(req:Request,res:Response)=>{
  const user = req.user


  if(!user){
    throw new ApiError(401,"user not found")
  }


  const getRequest  = await  DBRequest.find({
    $or:[
      {receiver:user._id,status:"pending"}
    ]
  })
 
  if(!getRequest){
    throw new ApiError(401,"request not found")}


    const allRequest  = getRequest.map(({_id,sender})=>{
        return {
            _id,
            sender:{
                _id:sender._id,
                name:sender.name,
                avatar:sender.avatar
            }
        }
    })
 

  return res.json(new ApiResponse(200,allRequest,"user found"))
})


const getMyFriend = asyncHandler(async(req:Request,res:Response)=>{

    const chatId = req.query.chatId
   
    const user = req.user

    if(!chatId){
        throw new ApiError(400,"chatId is required")
    }
    if(!user){
        throw new ApiError(401,"user not found")
    }

    const myFriends = await Chat.find({
        groupChat:false,
        members:user._id
    }).populate('members','-password name avatar')

    const friends = myFriends.map((members)=>{
   
        const otherMember  = getOtherMember(members,user._id)
   
        return {
            _id:otherMember._id,
            name:otherMember.name,
            avatar:otherMember.avatar.url
        }

    })
    

    if(chatId){
        const chat =  await Chat.findById(chatId)


        const availableFriends = friends.filter((friend)=>{
            return !chat.members.includes(friend._id.toString())
        })


        return res.json(
            new ApiResponse(200,availableFriends,"user found")
        )
    }else{
        return res.json(
            new ApiResponse(200,friends,"user found")
        )
    }
   




})


const getUserDetails = asyncHandler(async(req:Request,res:Response)=>{
    const user = req.user
    if(!user){
        throw new ApiError(401,"user not found")}
      
     const getUser = await User.findById(user._id)
     
     if(!getUser){
      throw new ApiError(401,"user not found")}

      return res.json(new ApiResponse(200,getUser,"user found"))

      
      })

      const getNotification = asyncHandler(async(req:Request,res:Response)=>{
        const user = req.user
        if(!user){
            throw new ApiError(401,"user not found")}
          
         const getRequest = await DBRequest.find({receiver:user._id}).populate("sender","name avatar")
         
         if(!getRequest){
          throw new ApiError(401,"user not found")}
        
          const allRequests = getRequest.map(({ _id, sender }) => ({
            _id,
            sender: {
              _id: sender._id,
              name: sender.name,
              avatar: sender.avatar.url,
            },
          }));

          return res.json(new ApiResponse(200,allRequests,"user found"))
        
        
        })

export { loginUser,getUserDetails,getNotification,registerUser, logoutUser,getMyFriend, getMyFriendRequest,acceptFriendRequest ,sendFriendRequest,searchUser};
