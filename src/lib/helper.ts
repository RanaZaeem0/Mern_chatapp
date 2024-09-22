export const getOtherMember = (members:any, userId:string) =>
    members.find((member) => member._id.toString() !== userId.toString());