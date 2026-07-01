// Base API Response Types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
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
  role: 'SUPER_ADMIN' | 'ADMIN' | 'FREELANCER';
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'BANNED';
  phone?: string;
  joinDate?: string;
  tasksCompleted?: number;
  tasksReviewed?: number;
  revenue?: number;
  createdAt: string;
  updatedAt: string;
  // Enhanced user statistics (from API v1.0.1)
  stats?: {
    totalTasksCompleted: number;
    currentTasksClaimed: number;
    totalRevenueEarned: number;
    tasksInProgress: number;
    averageTaskValue: number;
    totalTasksClaimed: number;
    totalRevenueGenerated: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'FREELANCER';
}

// Task Types
export interface TaskReview {
  _id: string;
  reviewerId: string;
  reviewer: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'PENDING' | 'COMPLETED';
  assignedAt: string;
  dueDate?: string;
  rating?: number;
  feedback?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTranscription {
  _id: string;
  taskId: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  reviewer: {
    _id: string;
    name: string;
    email: string;
  };
  segments: Array<{
    timestamp: {
      start: number;
      end: number;
    };
    content: string;
    remark?: string;
    quality: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  _id?: string; // API uses _id
  title: string;
  description: string;
  status: 'OPEN' | 'PENDING_APPROVAL' | 'ASSIGNED' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo?: User; // For backward compatibility
  claimedById?: string; // API field - user ID
  claimedBy?: User; // Populated user details (name, email) when task is claimed
  projectId?: string; // Optional project association
  createdBy?: User;
  reviewedBy?: TaskReview | null; // Review information with reviewer details
  dueDate?: string; // For backward compatibility
  deadline?: string; // API field
  audioUrl?: string; // API field
  submission?: string; // Submission URL
  recordingUrl?: string; // Recording URL for multi-speaker tasks
  review?: TaskReview; // Review details for submitted tasks
  transcription?: TaskTranscription; // Transcription details for reviewed tasks
  createdAt: string;
  updatedAt: string;
  price: number;
  language: string;
  tags?: string | string[];
  type?: 'single' | 'multi'; // Task type: single-speaker or multi-speaker
  roomName?: string; // LiveKit room name for multi-speaker tasks
  assignedFreelancers?: string[]; // Array of freelancer IDs for multi-speaker tasks
  // Speaker metadata for single-speaker tasks
  speakerName?: string;
  speakerAge?: number;
  speakerLocation?: string;
  // Speaker metadata for multi-speaker tasks
  speakersMetadata?: Array<{
    freelancerId: string;
    name: string;
    age: number;
    location: string;
  }>;
}

export interface CreateTaskData {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: Date;
  price: number;
  language: string;
  tags?: string | string[];
  audioFiles: File[];
  projectId?: string;
  audioUrl?: string;
  type?: 'single' | 'multi'; // Task type: single-speaker or multi-speaker
  assignedFreelancers?: string[]; // Array of freelancer IDs for multi-speaker tasks
  // Speaker metadata for single-speaker tasks
  speakerName?: string;
  speakerAge?: number;
  speakerLocation?: string;
  // Speaker metadata for multi-speaker tasks (optional - can be added later)
  speakersMetadata?: Array<{
    freelancerId: string;
    name: string;
    age: number;
    location: string;
  }>;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'OPEN' | 'PENDING_APPROVAL' | 'ASSIGNED' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo?: string;
  claimedById?: string;
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
    projectId?: string;
  };
}

// Analytics Types
export interface TaskAnalytics {
  totalTasks: {
    count: number;
    growth: number;
  };
  activeTasks: {
    count: number;
    growth: number;
  };
  completedTasks: {
    count: number;
    rate: number;
    growth: number;
  };
  overdueTasks: {
    count: number;
    rate: number;
    growth: number;
  };
  avgCompletionTime: {
    days: number;
    change: number;
  };
}

export interface TaskStatusDistribution {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tasks: number;
}

export interface TaskCompletionTrend {
  date: string;
  created: number;
  completed: number;
}

export interface TaskRevenueTrend {
  date: string;
  revenue: number;
}

export interface TaskLanguageDistribution {
  language: string;
  count: number;
}

export interface UserAnalytics {
  totalUsers: {
    count: number;
    growth: number;
  };
  revenuePerUser: {
    amount: number;
    growth: number;
  };
  taskCompletion: {
    rate: number;
    growth: number;
  };
  tasksPerUser: {
    average: number;
    change: number;
  };
}

export interface UserGrowthTrend {
  date: string;
  totalUsers: number;
  newUsers: number;
}

export interface TopPerformer {
  rank: number;
  initials: string;
  name: string;
  tasksCompleted: number;
  revenue: number;
  completionRate: number;
  trend: 'up' | 'down' | 'stable';
}

// User Analytics Dashboard (Combined) Type
export interface UserAnalyticsDashboard {
  summary: UserAnalytics;
  growthTrend: UserGrowthTrend[];
  topPerformers: TopPerformer[];
}

// User Statistics Type
export interface UserStats {
  userId: string;
  name: string;
  email: string;
  totalTasksCompleted: number;
  currentTasksClaimed: number;
  totalRevenueEarned: number;
  tasksInProgress: number;
  averageTaskValue: number;
  totalTasksClaimed: number;
  totalRevenueGenerated: number;
}

// Settings Types
export interface Setting {
  _id: string;
  key: string;
  value: any;
  createdAt: string;
  updatedAt: string;
}

// Storage Types
export interface R2StorageInfo {
  totalSizeBytes: number;
  totalSizeGB: number;
  totalSizeMB: number;
  totalFiles: number;
  averageFileSizeMB: number;
}

export interface R2FileCount {
  fileCount: number;
}

// Project Types
export type ProjectType = 'AUDIO_RECORDING' | 'TRANSCRIPTION' | 'REVIEW' | 'IMAGE_ANNOTATION' | 'VIDEO_ANNOTATION';

export interface Project {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  type: ProjectType;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'COMPLETED';
  supportedLanguages?: string[];
  metadata?: Record<string, any>;
  admins?: User[];
  users?: User[];
  joinRequests?: User[];
  createdAt: string;
  updatedAt: string;
}