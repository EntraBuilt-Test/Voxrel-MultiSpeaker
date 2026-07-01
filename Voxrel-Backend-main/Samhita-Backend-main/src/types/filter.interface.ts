export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
  assignedTo?: string;
  language?: string;
  createdAfter?: string;
  createdBefore?: string;
  dueDateAfter?: string;
  dueDateBefore?: string;
  assignedAfter?: string;
  assignedBefore?: string;
  sortBy?: string;
  sortOrder?: string;
  minBudget?: string;
  maxBudget?: string;
  completedAfter?: string;
  projectId?: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  createdAfter?: string;
  createdBefore?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface SortObject {
  [key: string]: 1 | -1;
}
