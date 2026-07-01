/**
 * Authentication Constants and Validation Rules
 */

// Auth Form Field Validation Rules
export const AUTH_VALIDATION_RULES = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    minLength: 6,
  },
  newPassword: {
    required: true,
    minLength: 8,
  },
  confirmPassword: {
    required: true,
    matchField: 'newPassword',
  },
  otp: {
    required: true,
    minLength: 6,
    maxLength: 6,
    pattern: /^\d{6}$/,
  }
};

// Auth Form Initial States
export const AUTH_INITIAL_STATES = {
  login: {
    email: '',
    password: ''
  },
  forgotPassword: {
    email: ''
  },
  verifyOtp: {
    otp: '',
    newPassword: '',
    confirmPassword: ''
  }
};

// Auth Flow Constants
export const AUTH_CONSTANTS = {
  // OTP Timer (3 minutes)
  OTP_RESEND_TIME: 180,
  
  // Redirect paths
  REDIRECT_AFTER_LOGIN: '/task/manage',
  REDIRECT_AFTER_LOGOUT: '/login',
  
  // Error messages
  MESSAGES: {
    LOGIN_SUCCESS: 'Login successful! Welcome back.',
    LOGIN_ERROR: 'Invalid email or password. Please try again.',
    FORGOT_PASSWORD_SUCCESS: 'OTP sent to your email. Please check your inbox.',
    FORGOT_PASSWORD_ERROR: 'Failed to send OTP. Please try again.',
    RESET_PASSWORD_SUCCESS: 'Password reset successfully. You can now login with your new password.',
    RESET_PASSWORD_ERROR: 'Failed to reset password. Please try again.',
    OTP_INVALID: 'Invalid or expired OTP. Please try again.',
    OTP_RESENT: 'OTP has been resent to your email.',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    GENERIC_ERROR: 'Something went wrong. Please try again later.'
  }
};

// Auth Form Types
export type LoginFormData = typeof AUTH_INITIAL_STATES.login;
export type ForgotPasswordFormData = typeof AUTH_INITIAL_STATES.forgotPassword;  
export type VerifyOtpFormData = typeof AUTH_INITIAL_STATES.verifyOtp;
