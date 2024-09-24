import { Request, Response } from "express";
import { Chat } from "../models/chat.model";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { emitEvent } from "../utils/features";
import { ALERT, REFETCH_CHATS } from "../constants/events";
import { ApiResponse } from "../utils/apiResponse";
import { User } from "../models/user.model";
import { chatRoute } from "../routes/chat.route";
import { Message } from "../models/message.model";
import mongoose from "mongoose";

const newGroupChat = asyncHandler(async (req: Request, res: Response) => {
  const { name, members } = req.body;

  if (members.length < 2) {
    return new ApiError(433, "member lenght ");
  }

  const user =  req.user

  if(!user){
    throw new ApiError(402,"user not found")
  }
  const date = new Date();
  const allMembers = [...members, user._id];
  const createGroup = await Chat.create({
    name,
    groupChat: true,
    members: allMembers,
  });

  emitEvent(req, ALERT, allMembers, "dasd");
  emitEvent(req, ALERT, members, "dasd");

  res.json(new ApiResponse(201, createGroup, "new Group create "));
});


const getMyChat = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;

  if (!user) {
    new ApiError(401, "user not found");
  }
  const chats = await Chat.find({ members: { $in: [user] } }).populate(
    "members",
    "name avatar"
  );

  res.json(new ApiResponse(201, chats, "new Group create "));
});

const getMyGroup = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;

  if (!user) {
    throw new ApiError(401, "user not found");
  }

  const chats = await Chat.aggregate([
    // Stage 1: Match the conditions (members including user, groupChat=true, creator=user)
    {
      $match: {
        members: { $in: [user] },
        groupChat: true,
        creator: user,
      },
    },
    // Stage 2: Lookup members and project only 'name' and 'avatar'
    {
      $lookup: {
        from: "users", // 'users' is the name of the members collection (replace it if different)
        localField: "members",
        foreignField: "_id",
        as: "members",
      },
    },
    // Stage 3: Project specific fields from members (name and avatar)
    {
      $project: {
        members: {
          $map: {
            input: "$members",
            as: "member",
            in: { name: "$$member.name", avatar: "$$member.avatar" },
          },
        },
        groupChat: 1,
        creator: 1,
        // Include any other fields you need to return from Chat
      },
    },
  ]);

  res.json(new ApiResponse(201, chats, "Get my Group successs"));
});

const addMembers = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;
  const { chatId, members } = req.body;
  if (!chatId || !members) {
    throw new ApiError(400, "chatId and members are required");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "chat not found");
  }
  if (!chat.groupChat) {
    throw new ApiError(400, "this is not a group chat");
  }

  if (chat.creator.toString() !== user._id.toString()) {
    throw new ApiError(401, "you are not the creator of this chat");
  }

  const allNewMembersPromise = members.map((i) => User.findById(i, "name"));

  const allNewMembers = await Promise.all(allNewMembersPromise);

  const uniqueMembers = allNewMembers
    .filter((member) => !chat.members.includes(member._id.toString()))
    .map((member) => member._id);

  const addMembers = await Chat.updateMany(
    { _id: chatId },
    { $push: { members: uniqueMembers } }
  );

  if (!addMembers) {
    throw new ApiError(400, "failed to add members");
  }

  emitEvent(req, ALERT, addMembers, `${uniqueMembers} added to the group`);

  emitEvent(
    req,
    REFETCH_CHATS,
    addMembers,
    `${uniqueMembers} added to the group`
  );

  return res.json(new ApiResponse(201, addMembers, "add members successs"));
});

const removeMembers = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const { chatId } = req.body;

  const [chat, userThatWillbeRemove] = await Promise.all([
    Chat.findById(chatId),
    User.findById(user._id, "name"),
  ]);

  if (!chat) {
    throw new ApiError(404, "chat not found");
  }

  if (!chat.groupChat) {
    throw new ApiError(400, "this is not a group chat");
  }

  if (!chat.members.includes(user._id.toString())) {
    throw new ApiError(401, "you are not a member of this chat");
  }

  if (chat.creator.toString() !== user._id.toString()) {
    throw new ApiError(401, "you are not the creator of this chat");
  }

  const removeMembers = await Chat.updateMany(
    { _id: chatId },
    { $pull: { members: user._id } }
  );

  if (!removeMembers) {
    throw new ApiError(400, "failed to remove members");
  }

  emitEvent(
    req,
    ALERT,
    removeMembers,
    `${userThatWillbeRemove.name} removed from the group`
  );

  emitEvent(
    req,
    REFETCH_CHATS,
    removeMembers,
    `${userThatWillbeRemove.name} removed from the group`
  );

  return res.json(
    new ApiResponse(201, removeMembers, "remove members successs")
  );
});

const leaveGroup = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, "chat not found");
  }

  if (chat.groupChat === false) {
    throw new ApiError(400, "this is not a group chat");
  }

  const remainingMembers = chat.members.filter(
    (member) => member.toString() !== req.user.toString()
  );

  if (remainingMembers.length < 3) {
    throw new ApiError(
      400,
      "You cannot leave a group with less than 3 members"
    );
  }

  if (chat.creator.toString() === req.user.toString()) {
    const randomElement = Math.floor(Math.random() * remainingMembers.length);
    const newCreator = remainingMembers[randomElement];
    chat.creator = newCreator;
  }

  chat.members = remainingMembers;

  const LeaveUser = await Promise.all([
    User.findById(user._id, "name"),
    chat.save(),
  ]);

  emitEvent(req, ALERT, user.members, `${LeaveUser} left the group`);

  return res.json(new ApiResponse(201, LeaveUser, "leave group successs"));
});

const sendAttachment = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const { chatId } = req.body;
  const files = req.files;

  if (!files || (Array.isArray(files) && files.length === 0)) {
    throw new ApiError(400, "No files provided");
  }

  if (Array.isArray(files) && files.length > 5) {
    throw new ApiError(400, "Cannot send more than 5 files");
  }
});

const getChatDetails = asyncHandler(async (req: Request, res: Response) => {
  if (req.query.populate === "ture") {
 
    const chatId = req.params.id;
 
    const chat = await Chat.aggregate([
      // Match the chat by ID
      {
        $match: {
          _id: new mongoose.Types.ObjectId(chatId),
        },
      },
      // Perform lookup to populate members field
      {
        $lookup: {
          from: "users", // Name of the 'User' collection
          localField: "members",
          foreignField: "_id",
          as: "members",
        },
      },
      // Project only the required fields for members (name and avatar)
      {
        $project: {
          name: 1,
          groupChat: 1,
          creator: 1,
          members: {
            _id: 1,
            name: 1,
            avatar: 1,
          },
        },
      },
    ]);

    if (!chat) {
      throw new ApiError(404, "chat not found");
    }

    return res.json(new ApiResponse(201, chat, "chat found"));
  }else{
    const chat = await Chat.findById(req.params.id)

    if(!chat){
      throw new ApiError(404,"chat not found")
    }
 return res.json(
   new ApiResponse(201,chat,"chat found")
 )


  }
});


const renameGroup = asyncHandler(async (req: Request, res: Response) => {
  const chatId  = req.params.id;
  const {  name } = req.body;


  const chat  = await Chat.findById(chatId);

  if(!chat){
    throw new ApiError(404,"chat not found")
  }

  if(chat.groupChat === false){
    throw new ApiError(400,"this is not a group chat")}

   
    if(chat.creator.toString() !== req.user.toString()){
      throw new ApiError(401,"you are not the creator of this chat")
    }

    

    chat.name = name  

    await chat.save()

    emitEvent(req,REFETCH_CHATS,chat.members,`group name changed to ${name}`)

    return res.json(new ApiResponse(201,chat,"group name changed"))
    




})


const deleteChat = asyncHandler(async (req: Request, res: Response) => {
  const chatId = req.params.id;
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "chat not found");}

    const members = chat.members

  if(chat.groupChat  && chat.creator.toString() !== req.user.toString()){
    throw new ApiError(401,"you are not the creator of this chat")
  }

const messageWithAttachment = await Message.find({
  chat: chatId,
  attachments: { $exists: true, $ne:[]},
})

const public_ids:string[] = []

messageWithAttachment.forEach(({attachments})=>{
  attachments.forEach(({public_id})=>{
    public_ids.push(public_id)
  })
})



})





export { newGroupChat, getMyChat, getMyGroup,deleteChat,renameGroup,getChatDetails,sendAttachment,leaveGroup,removeMembers,addMembers };
