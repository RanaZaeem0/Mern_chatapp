import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


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

      return jwt.sign(
          {
              _id: this._id,
              email: this.email,
              username: this.username,
          },
          process.env.ACCESS_TOKEN_SECRET,
          {
              expiresIn: expiresIn
          }
      )
  } catch (error) {
      console.log(error + "creating accestoken");

  }





}
UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign({
      _id: this._id,
  },
      process.env.ACCESS_TOKEN_SECRET,
      {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRY
      }
  )
}


export const User = mongoose.models.User || model("User", UserSchema);
