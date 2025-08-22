import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response<ApiResponse<never>>,
  next: NextFunction
) => {
  console.error('Error occurred:', error);

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle specific error types
  if (error.message.includes('OpenAI API error')) {
    statusCode = 502;
    message = 'External API error';
  } else if (error.message.includes('validation')) {
    statusCode = 400;
    message = 'Validation error';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

export const notFound = (
  req: Request,
  res: Response<ApiResponse<never>>,
  next: NextFunction
) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
};