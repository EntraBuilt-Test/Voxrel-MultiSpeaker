/**
 * Shared Constants for Dropdown Options and Configurations
 * These constants are used across the application for consistency
 */

// Language options for transcription tasks
export const LANGUAGE_OPTIONS = [
  { value: 'assamese', label: 'Assamese' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'bodo', label: 'Bodo' },
  { value: 'dogri', label: 'Dogri' },
  { value: 'gujarati', label: 'Gujarati' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'kannada', label: 'Kannada' },
  { value: 'kashmiri', label: 'Kashmiri' },
  { value: 'konkani', label: 'Konkani' },
  { value: 'maithili', label: 'Maithili' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'manipuri', label: 'Manipuri' },
  { value: 'marathi', label: 'Marathi' },
  { value: 'nepali', label: 'Nepali' },
  { value: 'oriya', label: 'Oriya' },
  { value: 'punjabi', label: 'Punjabi' },
  { value: 'sanskrit', label: 'Sanskrit' },
  { value: 'santali', label: 'Santali' },
  { value: 'sindhi', label: 'Sindhi' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'urdu', label: 'Urdu' },
] as const;

// Task status options (matching API documentation)
export const TASK_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'OPEN', label: 'Open' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

// Task priority options (matching API documentation)
export const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priority' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
] as const;

// User status options (matching API values)
export const USER_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING_VERIFICATION', label: 'Pending' },
  { value: 'BANNED', label: 'Banned' },
] as const;

// User role options
export const USER_ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'FREELANCER', label: 'Freelancer' },
  { value: 'ADMIN', label: 'Admin' },
] as const;

// Price range options for filtering
export const PRICE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Prices' },
  { value: '0-8000', label: '₹0 - ₹8,000' },
  { value: '8001-24000', label: '₹8,001 - ₹24,000' },
  { value: '24001-40000', label: '₹24,001 - ₹40,000' },
  { value: '40001-80000', label: '₹40,001 - ₹80,000' },
  { value: '80001-120000', label: '₹80,001 - ₹1,20,000' },
  { value: '120001-160000', label: '₹1,20,001 - ₹1,60,000' },
  { value: '160001+', label: '₹1,60,000+' },
] as const;

// Currency symbol
export const CURRENCY_SYMBOL = '₹' as const;

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 50;
export const DEFAULT_PAGE = 1;

// Notification auto-dismiss timeout (in milliseconds)
export const NOTIFICATION_TIMEOUT = 5000;

// Form validation messages
export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must not exceed ${max} characters`,
  match: 'Passwords do not match',
  positive: 'Must be a positive number',
  min: (min: number) => `Must be at least ${min}`,
} as const;

// Export type helpers for TypeScript
export type LanguageOption = (typeof LANGUAGE_OPTIONS)[number];
export type TaskStatusOption = (typeof TASK_STATUS_OPTIONS)[number];
export type PriorityOption = (typeof PRIORITY_OPTIONS)[number];
export type UserStatusOption = (typeof USER_STATUS_OPTIONS)[number];
export type PriceRangeOption = (typeof PRICE_RANGE_OPTIONS)[number];
