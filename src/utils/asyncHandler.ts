




const asyncHandler = (requestHandler)=>{
    return (req,res,next)=>{
         Promise.resolve(requestHandler(req,res,next))
         .catch((error)=>{
             next(error);
         })
     }
 }
 
 export {asyncHandler}
 
//  const asyncHandler1 = (fn) => async (req,res,next)=>{
//      try {
//          await fn(req,res,next)
//      } catch (error) {
//       res.status(err.code || 500).josn({
//          success:false,
//          message:err.message
//       })   
//      }
//  }