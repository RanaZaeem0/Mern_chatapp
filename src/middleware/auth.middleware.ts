import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model"; // Adjust the path to your User model
import { ApiError } from "../utils/apiError"; // Adjust the path to your custom error handler
import { asyncHandler } from "../utils/asyncHandler"; // Adjust the path to your async handler
import jwt from "jsonwebtoken";

// Define the JWT payload with the _id
interface JwtPayloadWithId extends jwt.JwtPayload {
  _id: string;
}

const verifyJwt = asyncHandler(async function (req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.accesstoken || req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Unauthorized Request');
    }

    const validateToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as JwtPayloadWithId;

    if (!validateToken || !validateToken._id) {
      throw new ApiError(401, "Access token is not valid");
    }

    const user = await User.findById(validateToken._id).select('-password -refreshToken');
    if (!user) {
      throw new ApiError(440, "Cannot find the user with token id");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    throw new ApiError(444, "Authorization failed");
  }
});

export { verifyJwt };
