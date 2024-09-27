
import {userSocketIDs} from "../index"

export const getOtherMember = (members:any, userId:string) =>
    members.find((member) => member._id.toString() !== userId.toString());


export const getSocket = (users = [ {
    _id:String
}])=>{
    const sockets= users.map((user)=> userSocketIDs.get(user._id.toString()))

    return sockets
}