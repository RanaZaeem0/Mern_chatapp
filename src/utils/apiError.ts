class ApiError extends Error {
    message: string;
    statusCode: number;
    data: any;
    success: boolean;
    errors: string[];
    
    constructor(
      statusCode: number,
      message: string = "Something went wrong",
      errors: string[] = [],
      stack: string = ""
    ) {
      super(message);
      this.statusCode = statusCode;
      this.data = null;
      this.message = message;
      this.success = false;
      this.errors = errors;
  
      if (stack) {
        this.stack = stack;
      } else {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  
    toResponse(): { statusCode: number; message: string; errors?: string[]; stack?: string } {
      const isProduction = process.env.NODE_ENV === "PRODUCTION";
  
      if (isProduction) {
        // Only expose basic error details in production
        return {
          statusCode: this.statusCode,
          message: this.message,
        };
      } else {
        // Expose full error details in development
        return {
          statusCode: this.statusCode,
          message: this.message,
          errors: this.errors,
          stack: this.stack,
        };
      }
    }
  }
  
  export { ApiError };
  