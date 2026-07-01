import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

// Toast configuration types
export interface ToastConfig {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
}

// Toast message templates
export const AuthToastMessages = {
  // Login Flow
  LOGIN: {
    LOADING: "Authenticating your account...",
    SUCCESS_ACTIVE: "Welcome back! Redirecting to your dashboard.",
    SUCCESS_PENDING: "Account verified! Your profile is under review.",
    SUCCESS_BANNED: "Account access denied. Please contact support.",
    ERROR_INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
    ERROR_PENDING_APPROVAL: "Your account is pending approval. Redirecting to review page...",
    ERROR_ACCOUNT_SUSPENDED: "Your account has been suspended. Please contact support.",
    ERROR_NETWORK: "Connection failed. Please check your internet and try again.",
    ERROR_UNKNOWN: "Login failed. Please try again or contact support.",
  },

  // Registration Flow
  REGISTRATION: {
    LOADING_START: "Creating your account...",
    LOADING_VERIFY: "Verifying your email address...",
    SUCCESS_START: "Verification code sent! Check your email.",
    SUCCESS_VERIFY: "Account created successfully! Your profile is under review.",
    ERROR_START: "Failed to create account. Please try again.",
    ERROR_VERIFY: "Invalid verification code. Please try again.",
    ERROR_EMAIL_EXISTS: "An account with this email already exists.",
    ERROR_WEAK_PASSWORD: "Password must be at least 8 characters with uppercase, lowercase, and numbers.",
    ERROR_INVALID_EMAIL: "Please enter a valid email address.",
  },

  // Password Reset Flow
  PASSWORD_RESET: {
    LOADING_REQUEST: "Sending reset instructions...",
    LOADING_RESET: "Resetting your password...",
    SUCCESS_REQUEST: "Reset instructions sent! Check your email.",
    SUCCESS_RESET: "Password reset successfully! You can now sign in.",
    ERROR_REQUEST: "Failed to send reset instructions. Please try again.",
    ERROR_RESET: "Failed to reset password. Please check your OTP and try again.",
    ERROR_INVALID_OTP: "Invalid or expired OTP. Please request a new one.",
  },

  // Profile Review Flow
  PROFILE_REVIEW: {
    LOADING_CHECK: "Checking your account status...",
    SUCCESS_APPROVED: "Congratulations! Your account has been approved.",
    SUCCESS_REDIRECT: "Redirecting to your dashboard...",
    INFO_PENDING: "Your profile is under review. We'll notify you when approved.",
    INFO_CHECK_AGAIN: "Status checked. Still pending approval.",
  },

  // General Validation
  VALIDATION: {
    REQUIRED_FIELDS: "Please fill in all required fields.",
    INVALID_EMAIL: "Please enter a valid email address.",
    WEAK_PASSWORD: "Password must be at least 8 characters with uppercase, lowercase, and numbers.",
    PASSWORDS_MISMATCH: "Passwords do not match.",
    INVALID_OTP: "Please enter a valid 6-digit verification code.",
  },

  // Network & System
  SYSTEM: {
    LOADING: "Processing your request...",
    SUCCESS: "Operation completed successfully!",
    ERROR_NETWORK: "Connection failed. Please check your internet and try again.",
    ERROR_SERVER: "Server error. Please try again later.",
    ERROR_UNKNOWN: "Something went wrong. Please try again.",
  }
} as const;

// Toast service class
export class ToastService {
  private static toastQueue: ToastConfig[] = [];
  private static isProcessingQueue = false;
  private static currentToast: string | number | null = null;

  private static getIcon(type: ToastConfig['type']) {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'error':
        return XCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      case 'loading':
        return Loader2;
      default:
        return null;
    }
  }

  private static getToastFunction(type: ToastConfig['type']) {
    switch (type) {
      case 'success':
        return toast.success;
      case 'error':
        return toast.error;
      case 'warning':
        return toast.warning;
      case 'info':
        return toast.info;
      case 'loading':
        return toast.loading;
      default:
        return toast;
    }
  }

  // Process toast queue
  private static async processQueue() {
    if (this.isProcessingQueue || this.toastQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.toastQueue.length > 0) {
      const config = this.toastQueue.shift();
      if (config) {
        this.currentToast = this.showImmediate(config);
        
        // Wait for toast to complete (except for loading toasts)
        if (config.type !== 'loading') {
          await new Promise(resolve => setTimeout(resolve, config.duration || 4000));
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  // Show a toast immediately (internal method)
  private static showImmediate(config: ToastConfig) {
    const { title, description, action, duration = 4000, type = 'info' } = config;
    
    const toastFn = this.getToastFunction(type);
    const IconComponent = this.getIcon(type);

    const toastOptions: Record<string, unknown> = {
      description,
      duration: type === 'loading' ? Infinity : duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
      // Remove inline styles to let CSS handle theming
      style: undefined,
    };

    if (IconComponent) {
      toastOptions.icon = React.createElement(IconComponent, { className: "h-4 w-4" });
    }

    return toastFn(title, toastOptions);
  }

  // Show a toast with queuing system
  static show(config: ToastConfig) {
    // For loading toasts, clear everything and show immediately
    if (config.type === 'loading') {
      this.dismissAll();
      this.clearQueue();
      return this.showImmediate(config);
    }
    
    // For other toasts, add to queue
    this.toastQueue.push(config);
    
    // Process queue
    this.processQueue();
    
    return 'queued';
  }

  // Dismiss a specific toast
  static dismiss(toastId: string | number) {
    toast.dismiss(toastId);
    if (this.currentToast === toastId) {
      this.currentToast = null;
    }
  }

  // Dismiss all toasts
  static dismissAll() {
    toast.dismiss();
    this.currentToast = null;
  }

  // Clear the toast queue
  static clearQueue() {
    this.toastQueue = [];
  }

  // Dismiss current toast and clear queue
  static dismissCurrentAndClear() {
    if (this.currentToast) {
      this.dismiss(this.currentToast);
    }
    this.clearQueue();
  }

  // Show a toast immediately (bypasses queue)
  static showImmediateToast(config: ToastConfig) {
    this.dismissAll();
    this.clearQueue();
    return this.showImmediate(config);
  }

  // Auth-specific toast methods
  static auth = {
    // Login toasts
    loginLoading: () => {
      // Clear any existing toasts and queue before showing loading
      this.dismissAll();
      this.clearQueue();
      return this.showImmediate({
        title: AuthToastMessages.LOGIN.LOADING,
        type: 'loading',
        duration: Infinity,
      });
    },

    loginSuccess: (status: 'ACTIVE' | 'PENDING' | 'BANNED') => {
      const message = status === 'ACTIVE' 
        ? AuthToastMessages.LOGIN.SUCCESS_ACTIVE
        : status === 'PENDING'
        ? AuthToastMessages.LOGIN.SUCCESS_PENDING
        : AuthToastMessages.LOGIN.SUCCESS_BANNED;
      
      return this.showImmediateToast({
        title: message,
        type: 'success',
        duration: 3000,
      });
    },

    loginError: (error: string) => {
      let message: string = AuthToastMessages.LOGIN.ERROR_UNKNOWN;
      
      if (error.includes('Invalid credentials') || error.includes('Invalid email or password')) {
        message = AuthToastMessages.LOGIN.ERROR_INVALID_CREDENTIALS;
      } else if (error.includes('Account pending admin approval')) {
        message = AuthToastMessages.LOGIN.ERROR_PENDING_APPROVAL;
      } else if (error.includes('suspended') || error.includes('banned')) {
        message = AuthToastMessages.LOGIN.ERROR_ACCOUNT_SUSPENDED;
      } else if (error.includes('network') || error.includes('fetch')) {
        message = AuthToastMessages.LOGIN.ERROR_NETWORK;
      }

      return this.showImmediateToast({
        title: message,
        type: 'error',
        duration: 5000,
      });
    },

    // Registration toasts
    registrationLoading: (step: 'start' | 'verify') => {
      // Clear any existing toasts and queue before showing loading
      this.dismissAll();
      this.clearQueue();
      return this.showImmediate({
        title: step === 'start' 
          ? AuthToastMessages.REGISTRATION.LOADING_START
          : AuthToastMessages.REGISTRATION.LOADING_VERIFY,
        type: 'loading',
        duration: Infinity,
      });
    },

    registrationSuccess: (step: 'start' | 'verify') => {
      const message = step === 'start'
        ? AuthToastMessages.REGISTRATION.SUCCESS_START
        : AuthToastMessages.REGISTRATION.SUCCESS_VERIFY;
      
      return this.show({
        title: message,
        type: 'success',
        duration: 4000,
      });
    },

    registrationError: (error: string) => {
      let message: string = AuthToastMessages.REGISTRATION.ERROR_START;
      
      if (error.includes('email already exists') || error.includes('409')) {
        message = AuthToastMessages.REGISTRATION.ERROR_EMAIL_EXISTS;
      } else if (error.includes('password') || error.includes('weak')) {
        message = AuthToastMessages.REGISTRATION.ERROR_WEAK_PASSWORD;
      } else if (error.includes('email') || error.includes('invalid')) {
        message = AuthToastMessages.REGISTRATION.ERROR_INVALID_EMAIL;
      } else if (error.includes('verification') || error.includes('OTP')) {
        message = AuthToastMessages.REGISTRATION.ERROR_VERIFY;
      }

      return this.show({
        title: message,
        type: 'error',
        duration: 5000,
      });
    },

    // Password reset toasts
    passwordResetLoading: (step: 'request' | 'reset') => {
      // Clear any existing toasts and queue before showing loading
      this.dismissAll();
      this.clearQueue();
      return this.showImmediate({
        title: step === 'request'
          ? AuthToastMessages.PASSWORD_RESET.LOADING_REQUEST
          : AuthToastMessages.PASSWORD_RESET.LOADING_RESET,
        type: 'loading',
        duration: Infinity,
      });
    },

    passwordResetSuccess: (step: 'request' | 'reset') => {
      const message = step === 'request'
        ? AuthToastMessages.PASSWORD_RESET.SUCCESS_REQUEST
        : AuthToastMessages.PASSWORD_RESET.SUCCESS_RESET;
      
      return this.show({
        title: message,
        type: 'success',
        duration: 4000,
      });
    },

    passwordResetError: (error: string) => {
      let message: string = AuthToastMessages.PASSWORD_RESET.ERROR_REQUEST;
      
      if (error.includes('OTP') || error.includes('verification')) {
        message = AuthToastMessages.PASSWORD_RESET.ERROR_INVALID_OTP;
      } else if (error.includes('reset') || error.includes('password')) {
        message = AuthToastMessages.PASSWORD_RESET.ERROR_RESET;
      }

      return this.show({
        title: message,
        type: 'error',
        duration: 5000,
      });
    },

    // Profile review toasts
    profileReviewLoading: () => {
      // Clear any existing toasts and queue before showing loading
      this.dismissAll();
      this.clearQueue();
      return this.showImmediate({
        title: AuthToastMessages.PROFILE_REVIEW.LOADING_CHECK,
        type: 'loading',
        duration: Infinity,
      });
    },

    profileReviewSuccess: (approved: boolean) => {
      const message = approved
        ? AuthToastMessages.PROFILE_REVIEW.SUCCESS_APPROVED
        : AuthToastMessages.PROFILE_REVIEW.INFO_CHECK_AGAIN;
      
      return this.show({
        title: message,
        type: approved ? 'success' : 'info',
        duration: approved ? 3000 : 2000,
      });
    },

    profileReviewInfo: () => this.show({
      title: AuthToastMessages.PROFILE_REVIEW.INFO_PENDING,
      type: 'info',
      duration: 3000,
    }),

    // Validation toasts
    validationError: (field: string, message?: string) => {
      const defaultMessage = message || AuthToastMessages.VALIDATION.REQUIRED_FIELDS;
      
      return this.show({
        title: defaultMessage,
        type: 'error',
        duration: 3000,
      });
    },
  };

  // System toasts
  static system = {
    loading: (message?: string) => {
      // Clear any existing toasts and queue before showing loading
      this.dismissAll();
      this.clearQueue();
      return this.showImmediate({
        title: message || AuthToastMessages.SYSTEM.LOADING,
        type: 'loading',
        duration: Infinity,
      });
    },

    success: (message?: string) => this.show({
      title: message || AuthToastMessages.SYSTEM.SUCCESS,
      type: 'success',
      duration: 3000,
    }),

    error: (message?: string) => this.show({
      title: message || AuthToastMessages.SYSTEM.ERROR_UNKNOWN,
      type: 'error',
      duration: 5000,
    }),

    networkError: () => this.show({
      title: AuthToastMessages.SYSTEM.ERROR_NETWORK,
      type: 'error',
      duration: 5000,
      action: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    }),
  };
}

export default ToastService;
