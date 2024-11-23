import { Request, Response } from "express";
import { Chat } from "../models/chat.model";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { emitEvent } from "../utils/features";
import { ALERT, NEW_MESSAGE, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/events";
import { ApiResponse } from "../utils/apiResponse";
import { User } from "../models/user.model";
import { Message } from "../models/message.model";
import mongoose from "mongoose";
import { getOtherMember, unLinkFileOnError } from "../lib/helper";
import zod, { ZodFirstPartyTypeKind } from "zod";
import {
  uploadFilesToCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary";

const newGroupChat = asyncHandler(async (req: Request, res: Response) => {
  const newGroupValide = zod.object({
    name: zod.string().min(3),
    members: zod.array(zod.string()),
  });

  const { name, members } = req.body;

  const valideData = newGroupValide.safeParse({ name, members });

  if (!valideData.success) {
    throw new ApiError(402, "newGroup data is not valide");
  }

  if (members.length < 2) {
    return new ApiError(433, "member lenght ");
  }

  const user = req.user;

  if (!user) {
    throw new ApiError(402, "user not found");
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
  console.log(user._id, "Asdsad", user._id.toString());

  const transformedChats = chats.map(({ _id, name, members, groupChat }) => {
    const otherMember = getOtherMember(members, user._id);
    return {
      _id,
      groupChat,
      avatar: groupChat
        ? members.slice(0, 3).map(({ avatar }) => avatar.url)
        : [otherMember.avatar.url],
      name: groupChat ? name : otherMember.name,
      members: members.reduce((prev, curr) => {
        if (curr._id.toString() !== user._id.toString()) {
          prev.push(curr._id);
        }
        return prev;
      }, []),
    };
  });

  return res.json(new ApiResponse(201, transformedChats, "chat get success "));
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
  const addMembersValide = zod.object({
    chatId: zod.string().min(4),
    members: zod.array(zod.string()),
  });

  const { user } = req;
  const { chatId, members } = req.body;

  const valideAddMembers = addMembersValide.safeParse({
    chatId,
    members,
  });
  if (!valideAddMembers.success) {
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

  if (!chatId) {
    throw new ApiError(402, "cant get Chatid");
  }

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
  if (!chatId) {
    throw new ApiError(403, "cant not get ChatID");
  }
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

  const files: any = req.files;
  
  const [chat, me] = await Promise.all([
    Chat.findById(chatId),
    User.findById(req.user, "name"),
  ]);
  if(!user){
    unLinkFileOnError(files)
    throw new ApiError(404,"can't get user")
  }
  if(!chatId){
    unLinkFileOnError(files)
    throw new ApiError(404,"can't get chatID")

  }
  if (!files || (Array.isArray(files) && files.length === 0)) {
    unLinkFileOnError(files)
    throw new ApiError(400, "No files provided");

  }

  if (Array.isArray(files) && files.length > 5) {
    unLinkFileOnError(files)
    throw new ApiError(400, "Cannot send more than 5 files");

  }

  const attachments = await uploadFilesToCloudinary(files);

  if(!attachments){
   throw new ApiError(404,"Plz reSend")
  }
 

  if(!chat){
    unLinkFileOnError(files)
    throw new ApiError(404,"chatId not Exicted")
  }
  if(!me){
    unLinkFileOnError(files)
    throw new ApiError(404,"User not Exicted")
  }
  const messageDB =    {
      content: "",
      attachments,
      sender: user,
      chat: chatId,
    }

  const messageForRealTime = {
    ...messageDB,
    sender: {
      _id: me._id,
      name: me.name,
    },
  };

  
  const message = await Message.create([messageDB]);
  if (!message) {
    throw new ApiError(404, "can't send message in Db");
  }  
 emitEvent(req,NEW_MESSAGE,chat.members,{chatId,message:messageForRealTime})

  return res.json(new ApiResponse(201, message, "Attchment get success"));


});

const getChatDetails = asyncHandler(async (req: Request, res: Response) => {
  if (req.query.populate === "ture") {
    const chatId = req.params.chatId;
    console.log(chatId, "cahtdid");

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
  } else {
    const chatId = req.params.chatId;
    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw new ApiError(404, "chat not found");
    }
    return res.json(new ApiResponse(201, chat, "chat found"));
  }
});

const renameGroup = asyncHandler(async (req: Request, res: Response) => {
  const chatId = req.params.id;
  const { name } = req.body;
  if (!name) {
    throw new ApiError(403, "cant get name");
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, "chat not found");
  }

  if (chat.groupChat === false) {
    throw new ApiError(400, "this is not a group chat");
  }

  if (chat.creator.toString() !== req.user.toString()) {
    throw new ApiError(401, "you are not the creator of this chat");
  }

  chat.name = name;

  await chat.save();

  emitEvent(req, REFETCH_CHATS, chat.members, `group name changed to ${name}`);

  return res.json(new ApiResponse(201, chat, "group name changed"));
});

const deleteChat = asyncHandler(async (req: Request, res: Response) => {
  const chatId = req.params.id;
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "chat not found");
  }

  const members = chat.members;

  if (chat.groupChat && chat.creator.toString() !== req.user.toString()) {
    throw new ApiError(401, "you are not the creator of this chat");
  }

  const messageWithAttachment = await Message.find({
    chat: chatId,
    attachments: { $exists: true, $ne: [] },
  });

  const public_ids: string[] = [];

  messageWithAttachment.forEach(({ attachments }) => {
    attachments.forEach(({ public_id }) => {
      public_ids.push(public_id);
    });
  });
});

const getMyMessage = asyncHandler(async (req: Request, res: Response) => {
  const chatId = req.params.chatId;
  const page: number = Number(req.query.page) || 1;

  const resultPerPage = 20;
  const skip = (page - 1) * resultPerPage;

  const chat = await Chat.findById(chatId);

  if (chat?.members.includes(req.user.toString())) {
    throw new ApiError(420, "you are not allow to get this msgs");
  }

  const messagesdsa = await Message.find({ chat: chatId });

  const [messages, totalMessagesCount] = await Promise.all([
    Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(resultPerPage)
      .populate("sender", "name")
      .lean(),
    Message.countDocuments({ chat: chatId }),
  ]);

  const totalPages = Math.ceil(totalMessagesCount / resultPerPage) || 0;

  const messagesData = { messages: messages.reverse(), totalPages };

  return res.json(new ApiResponse(201, messagesData, "message get succss "));
});

export {
  newGroupChat,
  getMyChat,
  getMyGroup,
  deleteChat,
  renameGroup,
  getChatDetails,
  sendAttachment,
  leaveGroup,
  removeMembers,
  addMembers,
  getMyMessage,
};
