import { FilterQuery, Types } from 'mongoose';
import { IProject, ProjectStatus, ProjectType } from '@/types/project.interface.js';
import { IUser } from '@/types/user.interface.js';
/* eslint-disable @typescript-eslint/no-explicit-any */
import Project from '@/models/project.model.js';
import User from '@/models/user.model.js';
import Task from '@/models/task.model.js';
import ApiError from '@/utils/api-error.utility.js';
import { ITask } from '@/types/task.interface.js';

export const getProjectTasks = async (
  projectId: string,
  filters: {
    status?: string;
    language?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }
) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const query: FilterQuery<ITask> = { projectId };

  if (filters.status && filters.status !== 'all') {
    query.status = filters.status;
  }

  if (filters.language && filters.language !== 'all') {
    query.language = filters.language;
  }

  if (filters.priority && filters.priority !== 'all') {
    query.priority = filters.priority;
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const tasks = await Task.find(query)
    .populate('claimedById', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalTasks = await Task.countDocuments(query);
  const totalPages = Math.ceil(totalTasks / limit);

  return {
    tasks,
    pagination: {
      currentPage: page,
      totalPages,
      totalTasks,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const getProjectUsers = async (
  projectId: string,
  filters: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }
) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // If no users, return empty
  if (!project.users || project.users.length === 0) {
    return {
      users: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalUsers: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  const query: FilterQuery<IUser> = {
    _id: { $in: project.users },
  };

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
    ];
  }

  if (filters.status && filters.status !== 'all') {
    query.status = filters.status;
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const users = await User.find(query)
    .select('name email role status tasksCompleted revenue stats') // efficient select
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalUsers = await User.countDocuments(query);
  const totalPages = Math.ceil(totalUsers / limit);

  return {
    users,
    pagination: {
      currentPage: page,
      totalPages,
      totalUsers,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const createProject = async (projectData: {
  name: string;
  description?: string;
  type: ProjectType;
  supportedLanguages?: string[];
  metadata?: Record<string, unknown>;
}) => {
  const project = await Project.create({
    name: projectData.name,
    description: projectData.description,
    type: projectData.type,
    supportedLanguages: projectData.supportedLanguages || [],
    metadata: projectData.metadata || {},
    status: ProjectStatus.ACTIVE,
  });

  return project;
};

export const getProjects = async (
  filters: { status?: string; type?: string; search?: string },
  user: IUser
) => {
  const query: FilterQuery<IProject> = {};

  if (filters.status && filters.status !== 'all') {
    query.status = filters.status as ProjectStatus;
  }

  if (filters.type && filters.type !== 'all') {
    query.type = filters.type as ProjectType;
  }

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
    ];
  }

  // Filter projects based on user role
  // SUPER_ADMIN can see all projects
  // ADMIN can only see projects they are assigned to
  if (user.role === 'ADMIN') {
    query.admins = user._id;
  }

  const projects = await Project.find(query)
    .populate('admins', 'name email role')
    .populate('users', 'name email role')
    .sort({ createdAt: -1 })
    .lean();

  return { projects };
};

export const getProjectById = async (projectId: string) => {
  const project = await Project.findById(projectId)
    .populate('admins', 'name email role')
    .populate('users', 'name email role')
    .populate('joinRequests', 'name email')
    .lean();

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return project;
};

export const updateProject = async (projectId: string, updateData: Partial<IProject>) => {
  const project = await Project.findByIdAndUpdate(
    projectId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('admins', 'name email role')
    .populate('users', 'name email role')
    .lean();

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return project;
};

export const deleteProject = async (projectId: string) => {
  const project = await Project.findByIdAndDelete(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return { message: 'Project deleted successfully' };
};

export const assignProjectToAdmin = async (projectId: string, adminId: string) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const admin = await User.findById(adminId);
  if (!admin) {
    throw new ApiError(404, 'Admin user not found');
  }

  if (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN') {
    throw new ApiError(400, 'User must be an ADMIN or SUPER_ADMIN');
  }

  // Add admin if not already assigned
  if (!project.admins?.some(id => id.toString() === adminId)) {
    project.admins = [...(project.admins || []), admin._id];
    await project.save();
  }

  return project.populate('admins', 'name email role');
};

export const removeAdminFromProject = async (projectId: string, adminId: string) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  project.admins = project.admins?.filter(id => id.toString() !== adminId) || [];
  await project.save();

  return project.populate('admins', 'name email role');
};

export const addUserToProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Add user if not already added
  if (!project.users?.some(id => id.toString() === userId)) {
    project.users = [...(project.users || []), user._id];
    await project.save();
  }

  return project.populate('users', 'name email role');
};

export const removeUserFromProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  project.users = project.users?.filter(id => id.toString() !== userId) || [];
  await project.save();

  return project.populate('users', 'name email role');
};

export const requestToJoinProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  if (project.users?.some(id => id.toString() === userId)) {
    throw new ApiError(400, 'User is already a member');
  }

  if (project.joinRequests?.some(id => id.toString() === userId)) {
    throw new ApiError(400, 'Request already pending');
  }

  project.joinRequests = [...(project.joinRequests || []), new Types.ObjectId(userId)];
  await project.save();
  return project;
};

export const approveJoinRequest = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  project.joinRequests = project.joinRequests?.filter(id => id.toString() !== userId) || [];

  if (!project.users?.some(id => id.toString() === userId)) {
    project.users = [...(project.users || []), new Types.ObjectId(userId)];
  }

  await project.save();
  return project.populate('users', 'name email role');
};

export const rejectJoinRequest = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  project.joinRequests = project.joinRequests?.filter(id => id.toString() !== userId) || [];
  await project.save();
  return project;
};

// Get projects that are not assigned for review (i.e., don't have a REVIEW type project linked to them)
export const getProjectsNotAssignedForReview = async () => {
  // Get all REVIEW type projects and extract their original project IDs from metadata
  const reviewProjects = await Project.find({ type: ProjectType.REVIEW }).select('metadata').lean();

  // Extract original project IDs from review projects' metadata
  const assignedProjectIds = reviewProjects
    .map(rp => {
      const metadata = rp.metadata as any;
      return metadata?.originalProjectId || metadata?.sourceProjectId;
    })
    .filter(id => id)
    .map(id => new Types.ObjectId(id));

  // Get all projects that are NOT REVIEW type and NOT in the assigned list
  const availableProjects = await Project.find({
    type: { $ne: ProjectType.REVIEW },
    _id: { $nin: assignedProjectIds },
    status: ProjectStatus.ACTIVE,
  })
    .select('name description type status')
    .sort({ createdAt: -1 })
    .lean();

  return { projects: availableProjects };
};
