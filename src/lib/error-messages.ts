/**
 * Utility functions for creating user-friendly error messages
 */

export interface ErrorInfo {
  title: string;
  description: string;
  cause?: string;
  solution?: string;
}

/**
 * Parse Supabase/database errors into user-friendly messages
 */
export const parseError = (error: any): ErrorInfo => {
  // If error already has a user-friendly message
  if (error.message && !error.message.includes('fetch') && !error.message.includes('undefined')) {
    return {
      title: 'Error',
      description: error.message,
    };
  }

  // Database errors
  if (error.code) {
    switch (error.code) {
      case 'PGRST116':
        return {
          title: 'Not Found',
          description: 'The requested item could not be found in the database.',
          cause: 'The item may have been deleted or does not exist.',
          solution: 'Please refresh the page and try again.',
        };
      case 'PGRST301':
      case '23503':
        return {
          title: 'Database Constraint Error',
          description: 'This operation cannot be completed due to database constraints.',
          cause: 'The item may be referenced by other records or have dependencies.',
          solution: 'Please remove all dependencies first, or contact support.',
        };
      case '42501':
        return {
          title: 'Permission Denied',
          description: 'You do not have permission to perform this action.',
          cause: 'Your account may not have the required role or status.',
          solution: 'Please contact an administrator to upgrade your permissions.',
        };
      case '23505':
        return {
          title: 'Duplicate Entry',
          description: 'This item already exists in the database.',
          cause: 'A record with the same unique identifier already exists.',
          solution: 'Please use a different value or update the existing record.',
        };
      case '42P01':
        return {
          title: 'Table Not Found',
          description: 'The database table does not exist.',
          cause: 'The database may not be properly set up or migrated.',
          solution: 'Please run the database migrations or contact support.',
        };
    }
  }

  // Network/fetch errors
  if (error.message?.includes('fetch') || error.message?.includes('network') || error.name === 'TypeError') {
    if (error.message?.includes('fetch is not a function')) {
      return {
        title: 'Network Error',
        description: 'Failed to connect to the server. The database connection may be unavailable.',
        cause: 'Network request failed or database service is down.',
        solution: 'Please check your internet connection and try again. If the problem persists, contact support.',
      };
    }
    return {
      title: 'Network Error',
      description: 'Unable to connect to the server.',
      cause: 'Network connection issue or server is unavailable.',
      solution: 'Please check your internet connection and try again.',
    };
  }

  // Supabase auth errors
  if (error.message?.includes('JWT') || error.message?.includes('token')) {
    return {
      title: 'Authentication Error',
      description: 'Your session has expired or is invalid.',
      cause: 'Authentication token is missing or expired.',
      solution: 'Please log out and log back in to refresh your session.',
    };
  }

  // RLS (Row Level Security) errors
  if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
    return {
      title: 'Access Denied',
      description: 'You do not have permission to access this resource.',
      cause: 'Row-level security policies prevent this operation.',
      solution: 'Please ensure your account is approved and has the correct permissions.',
    };
  }

  // Storage errors
  if (error.message?.includes('storage') || error.message?.includes('bucket')) {
    return {
      title: 'Storage Error',
      description: 'Failed to access file storage.',
      cause: 'Storage bucket may not exist or you may not have permission.',
      solution: 'Please ensure storage is properly configured or contact support.',
    };
  }

  // Generic error fallback
  const errorMessage = error.message || error.toString() || 'Unknown error occurred';
  
  return {
    title: 'Error',
    description: errorMessage.length > 100 
      ? `${errorMessage.substring(0, 100)}...` 
      : errorMessage,
    cause: 'An unexpected error occurred while processing your request.',
    solution: 'Please try again. If the problem persists, contact support at info@bamas.xyz',
  };
};

/**
 * Format error for toast notification
 */
export const formatErrorForToast = (error: any, defaultTitle?: string, defaultDescription?: string) => {
  const errorInfo = parseError(error);
  
  return {
    title: defaultTitle || errorInfo.title,
    description: errorInfo.solution 
      ? `${errorInfo.description}\n\nSolution: ${errorInfo.solution}`
      : errorInfo.description,
  };
};

