import { StringSchemaDefinition } from "mongoose"













class ApiError<T> extends Error {


 message:string;
    statusCode:number
    data:any
    success:boolean
    errors:string[]


    constructor(statusCode,
        message = 'some thing went wrong',
        errors=[],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
         this.errors = errors
    
    if(stack){
        this.stack = stack
    }else{
        Error.captureStackTrace(this, this.constructor)
    }
    }
}

export  {ApiError}