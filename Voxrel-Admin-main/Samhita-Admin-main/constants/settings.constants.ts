// Profile settings validation rules
export const PROFILE_VALIDATION_RULES = {
  currentPassword: {
    required: false,
    minLength: 6,
  },
  newPassword: {
    required: false,
    minLength: 6,
  },
  confirmPassword: {
    required: false,
    matchField: 'newPassword',
  },
};

// Application settings validation rules
export const APPLICATION_VALIDATION_RULES = {
  maxTasksPerUser: {
    required: true,
    min: 1,
    max: 20,
  },
  registrationMode: {
    required: true,
  },
};

// Profile settings type
export interface ProfileSettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Profile settings initial state
export const PROFILE_INITIAL_STATE: ProfileSettings = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

// Application settings type
export interface ApplicationSettings {
  maxTasksPerUser: number;
  autoAssignmentEnabled: boolean;
  registrationMode: 'open' | 'invite_only' | 'approval_required';
}

// Application settings initial state
export const APPLICATION_INITIAL_STATE: ApplicationSettings = {
  maxTasksPerUser: 5,
  autoAssignmentEnabled: true,
  registrationMode: 'invite_only',
};

// Registration mode options
export const REGISTRATION_MODE_OPTIONS = [
  { value: 'open', label: 'Open Registration' },
  { value: 'invite_only', label: 'Invite Only' },
  { value: 'approval_required', label: 'Approval Required' },
] as const;

// Settings messages
export const SETTINGS_MESSAGES = {
  PROFILE_SAVED: 'Profile settings saved successfully!',
  APPLICATION_SAVED: 'Application settings saved successfully!',
  SAVE_ERROR: 'Failed to save settings. Please try again.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  WEAK_PASSWORD: 'Password must contain at least 8 characters with uppercase, lowercase, and numbers',
};
