import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError";


const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

UserSchema.methods.isPasswordCorrect = async function (password) {
  
  return await bcrypt.compare(password, this.password)
}
UserSchema.methods.generateAccessToken = function () {
  try {
      const expiresIn = process.env.ACCESS_TOKEN_EXPIRY ;
           const secret = process.env.ACCESS_TOKEN_SECRET
      
           if(!secret){
            throw new ApiError(500,"process.env.ACCESS_TOKEN_SECRET is not defined")
          }

           return jwt.sign(
          {
              _id: this._id,
              email: this.email,
              username: this.username,
          },
          secret,
          {
              expiresIn: expiresIn
          }
      )
  } catch (error) {
      console.log(error + "creating accestoken");

  }





}
UserSchema.methods.generateRefreshToken = function () {
   const secret = process.env.ACCESS_TOKEN_SECRET
  if(!secret){
    throw new ApiError(500,"process.env.ACCESS_TOKEN_EXPIRY is not defined")
  }
  return jwt.sign({
      _id: this._id,
  },
      secret,
      {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRY
      }
  )
}


export const User = mongoose.models.User || model("User", UserSchema);
