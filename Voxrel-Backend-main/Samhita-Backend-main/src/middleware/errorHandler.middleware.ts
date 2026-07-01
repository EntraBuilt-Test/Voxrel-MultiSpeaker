import { NextFunction, Request, Response } from 'express';
import ApiError from '@/utils/api-error.utility.js';

interface MongooseError extends Error {
  statusCode?: number;
  status?: string;
  code?: number;
  errmsg?: string;
  errors?: { [key: string]: { message: string; minimum?: number } };
}

const handleCastErrorDB = (_err: MongooseError) => {
  const message = 'Invalid data format provided. Please check your input.';
  return new ApiError(400, message);
};

const handleDuplicateFieldsDB = (err: MongooseError) => {
  // Check if it's an email duplicate error
  if (err.errmsg && err.errmsg.includes('email')) {
    return new ApiError(
      400,
      'This email address is already registered. Please use a different email.'
    );
  }

  // Generic duplicate error message
  const message = 'This information is already in use. Please provide different details.';
  return new ApiError(400, message);
};

const handleValidationErrorDB = (err: MongooseError) => {
  const errors = Object.values(err.errors || {}).map(el => {
    // Make validation messages more user-friendly
    const message = el.message;

    // Replace technical field names with user-friendly names
    return message
      .replace(/`([^`]+)`/g, '$1') // Remove backticks
      .replace(/Path `/g, '') // Remove "Path" prefix
      .replace(/` is required/, ' is required')
      .replace(/` must be/, ' must be')
      .replace(/ValidationError: /, '');
  });

  // Return only the first error to avoid overwhelming the user
  const message = errors[0] || 'Please check your input and try again.';
  return new ApiError(400, message);
};

const handleJWTError = () => new ApiError(401, 'Invalid token. Please log in again!');
const handleJWTExpiredError = () =>
  new ApiError(401, 'Your token has expired! Please log in again.');

const sendErrorDev = (err: ApiError, res: Response) => {
  // Log full error details to console for debugging (not sent to client)
  console.error('🚨 ERROR DETAILS:');
  console.error('Message:', err.message);
  console.error('Status Code:', err.statusCode);
  console.error('Stack:', err.stack);
  console.error('Full Error:', err);

  // Send clean response to client (same format as production)
  res.status(err.statusCode).json({
    success: false,
    statusCode: err.statusCode,
    message: err.message,
  });
};

const sendErrorProd = (err: ApiError, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
    });
    // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error for debugging
    console.error('💥 PRODUCTION ERROR:', err);
    console.error('Stack:', err.stack);

    // 2) Send user-friendly generic message
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'We encountered an unexpected error. Please try again later.',
    });
  }
};

const handleDatabaseErrors = (
  errorObj: { name?: string; code?: number | string },
  err: unknown
): ApiError | null => {
  if (errorObj.name === 'CastError') return handleCastErrorDB(err as MongooseError);
  if (errorObj.code === 11000) return handleDuplicateFieldsDB(err as MongooseError);
  if (errorObj.name === 'ValidationError') return handleValidationErrorDB(err as MongooseError);
  if (errorObj.name === 'MongooseError') {
    return new ApiError(400, 'Invalid request data. Please check your input.');
  }
  return null;
};

const handleJWTErrors = (errorObj: { name?: string }): ApiError | null => {
  if (errorObj.name === 'JsonWebTokenError') return handleJWTError();
  if (errorObj.name === 'TokenExpiredError') return handleJWTExpiredError();
  return null;
};

const handleNetworkErrors = (errorObj: { code?: number | string }): ApiError | null => {
  if (errorObj.code === 'ENOTFOUND' || errorObj.code === 'ECONNREFUSED') {
    return new ApiError(503, 'Service temporarily unavailable. Please try again later.');
  }
  return null;
};

const handleFileUploadErrors = (errorObj: {
  code?: number | string;
  message?: string;
}): ApiError | null => {
  if (errorObj.code === 'LIMIT_FILE_COUNT') {
    const maxFiles = process.env.MAX_FILES_PER_REQUEST || '150';
    return new ApiError(400, `Too many files. Maximum ${maxFiles} files allowed per request.`);
  }
  if (errorObj.code === 'LIMIT_FILE_SIZE') {
    return new ApiError(400, 'File size too large. Maximum 200MB per file.');
  }
  if (errorObj.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ApiError(
      400,
      'Unexpected file field. Please use field names: audio, audios, files, or audioFiles.'
    );
  }
  if (errorObj.code === 'MULTERERROR' || errorObj.message?.includes('Multer')) {
    return new ApiError(400, 'File upload error. Please check your file and try again.');
  }
  return null;
};

const handleSpecificErrors = (err: unknown): ApiError | null => {
  const errorObj = err as { name?: string; code?: number | string; message?: string };

  // Try database errors first
  const dbError = handleDatabaseErrors(errorObj, err);
  if (dbError) return dbError;

  // Try JWT errors
  const jwtError = handleJWTErrors(errorObj);
  if (jwtError) return jwtError;

  // Try network errors
  const networkError = handleNetworkErrors(errorObj);
  if (networkError) return networkError;

  // Try file upload errors
  const fileError = handleFileUploadErrors(errorObj);
  if (fileError) return fileError;

  return null;
};

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Convert to ApiError if it's not already
  let error: ApiError;

  // Handle new AppError instances
  if (err instanceof Error && 'statusCode' in err) {
    error = new ApiError((err as { statusCode: number }).statusCode, err.message);
  } else if (err instanceof ApiError) {
    error = err;
  } else {
    // Create ApiError from generic error
    const errorObj = err as { statusCode?: number; message?: string };
    error = new ApiError(errorObj.statusCode || 500, errorObj.message || 'Internal Server Error');
  }

  // Handle specific error types
  const specificError = handleSpecificErrors(err);
  if (specificError) {
    error = specificError;
  }

  // Log error
  try {
    console.error('Request error:', {
      error: error.message,
      statusCode: error.statusCode,
      url: req.url,
      method: req.method,
      userId: (req as { user?: { _id: string } }).user?._id,
    });
  } catch {
    // Fallback to console if logging fails
    console.error('Error:', error);
  }

  // Send response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};
