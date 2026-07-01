// Base API Response Types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// User Types
export interface User {
  id: string;
  _id?: string; // API uses _id, normalized to id
  name: string;
  email: string;
  avatar?: string;
  role: 'ADMIN' | 'FREELANCER'; // Updated to match backend API
  status: 'PENDING' | 'ACTIVE' | 'BANNED'; // Updated to match actual backend API
  phone?: string;
  joinDate?: string;
  tasksCompleted?: number;
  tasksReviewed?: number;
  revenue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'FREELANCER'; // Updated to match backend API
}

// Task Types
export interface Task {
  id?: string; // Frontend uses id
  _id?: string; // API uses _id
  title: string;
  description: string;
  status: 'OPEN' | 'PENDING_APPROVAL' | 'ASSIGNED' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo?: User; // For backward compatibility
  claimedById?: string | User | null; // API field - can be ID or populated user object
  createdBy?: User;
  dueDate?: string; // For backward compatibility
  deadline?: string; // API field
  audioUrl?: string; // API field (legacy - single audio file)
  audioUrls?: string[]; // API field (array of audio file URLs)
  transcriptUrl?: string; // URL to transcript file
  createdAt: string;
  updatedAt: string;
  price: number;
  language: string;
  tags?: string | string[]; // API returns array, frontend uses string
  progress?: number; // Task completion progress percentage
  projectId?: string; // Project ID that this task belongs to
  submission?: string; // Submitted work/output for review
  review?: Review;
  type?: 'single' | 'multi'; // Task type: single-speaker or multi-speaker
  roomName?: string; // LiveKit room name for multi-speaker tasks
  assignedFreelancers?: string[]; // Array of freelancer IDs for multi-speaker tasks
  // Recording fields for multi-speaker tasks
  recordingUrl?: string; // R2 URL of the recording (from server-side recording)
  recordingFileName?: string; // File name in R2
  recordingDuration?: number; // Duration in seconds
  recordingStatus?: 'RECORDING' | 'COMPLETED' | 'FAILED'; // Recording status
  // Speaker metadata for single-speaker tasks
  speakerName?: string;
  speakerAge?: number;
  speakerLocation?: string;
  // Speaker metadata for multi-speaker tasks
  speakersMetadata?: Array<{
    freelancerId: string;
    topic?: string;
    name: string;
    speakerId?: string;
    age: number;
    gender?: string;
    qualification?: string;
    occupation?: string;
    motherTongueCode?: string;
    nativePlace?: string;
    currentLocation?: string;
    district?: string;
    state?: string;
    dialectZone?: string;
    dialect?: string;
    recordingDeviceType?: 'PC' | 'Mobile' | '';
    recordingEnvironment?: 'Indoor' | 'Outdoor' | '';
    location?: string; // Keep for backward compatibility
  }>;

  // Additional properties for completed tasks
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  earnings?: string;
  rating?: number;
  qualityScore?: number;
  clientRating?: number;
  completedAt?: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: Date;
  price: number;
  language: string;
  tags?: string;
  audioFile: File;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'OPEN' | 'PENDING_APPROVAL' | 'ASSIGNED' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo?: string;
  dueDate?: string;
  price?: number;
  language?: string;
  tags?: string[];
}

// Store State Types
export interface BaseState {
  isLoading: boolean;
  error: string | null;
}

export interface UserStoreState extends BaseState {
  user: User | null;
  token: string | null;
}

// Pagination Types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TaskStoreState extends BaseState {
  tasks: Task[];
  currentTask: Task | null;
  pagination: PaginationInfo;
  filters: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    languages?: string[]; // Add language filtering
    search?: string; // Add search functionality
    duration?: string; // Add duration filtering
  };
  selectedLanguages: string[]; // Add language selection state
  _pendingRequests: Record<string, boolean>; // Track pending requests to prevent duplicates
}

// Analytics Types
export interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  tasksProgress: {
    month: string;
    completed: number;
    created: number;
  }[];
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowth: {
    month: string;
    users: number;
  }[];
}

// Freelancer Types
export interface FreelancerStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalEarnings: number;
  averageRating: number;
  languages: Record<string, number>;
  monthlyEarnings: Record<string, number>;
}

export interface FreelancerProfile {
  bio?: string;
  languages: string[];
  country: string;
  skills?: string[];
  experience?: string;
}

export interface Review {
  id: string;
  _id?: string;
  taskId: string;
  reviewerId: string;
  rating?: number;
  feedback?: string;
  status: 'PENDING' | 'COMPLETED';
  assignedAt: string;
  dueDate?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Language Types
export interface Language {
  label: string;
  value: string;
  nativeName: string;
  code: string;
}

export interface LanguageGroup {
  [key: string]: string[];
}

// Notification Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  title?: string;
  type: NotificationType;
  duration?: number;
}

// Project Types
export type ProjectType = 'AUDIO_RECORDING' | 'TRANSCRIPTION' | 'REVIEW' | 'FUTURE';

export interface Project {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  type: ProjectType;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  supportedLanguages?: string[];
  metadata?: Record<string, any>;
  admins?: User[];
  users?: User[];
  joinRequests?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSelection {
  projectId: string;
  projectName: string;
  projectType: ProjectType;
}