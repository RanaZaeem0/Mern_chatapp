import { NextFunction, Request, Response } from "express";

const asyncHandler = (requestHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((error) => {
                next(error);
            });
    };
};


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