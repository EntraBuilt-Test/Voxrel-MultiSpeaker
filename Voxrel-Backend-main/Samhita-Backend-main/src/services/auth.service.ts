import { Request, Response } from 'express';
import User from '@/models/user.model.js';
import ApiResponse from '@/utils/api-response.utility.js';
import ApiError from '@/utils/api-error.utility.js';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt.utility.js';
import { emailService } from '@/utils/email.utility.js';
import { UserRole, UserStatus } from '@/types/user.interface.js';

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already exists');
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Create user with pending verification
  const _user = await User.create({
    name,
    email,
    password,
    status: UserStatus.PENDING_VERIFICATION,
  });

  // Send OTP email
  await emailService.sendOtp(email, otp);

  // Store OTP in Redis or database for verification
  // For now, we'll just log it (in production, store in Redis with expiration)
  console.log(`OTP for ${email}: ${otp}`);

  new ApiResponse(
    202,
    { message: 'OTP sent to your email. Please verify to complete registration.' },
    'Verification required'
  ).send(res);
};

export const registerAdmin = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already exists');
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Create user with pending verification and ADMIN role
  const _user = await User.create({
    name,
    email,
    password,
    role: UserRole.ADMIN,
    status: UserStatus.PENDING_VERIFICATION,
  });

  // Send OTP email
  await emailService.sendOtp(email, otp);

  // Store OTP in Redis or database for verification
  console.log(`OTP for ${email}: ${otp}`);

  new ApiResponse(
    202,
    {
      message:
        'OTP sent to your email. Please verify to complete registration. Admin account requires Superadmin approval.',
    },
    'Verification required'
  ).send(res);
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find user and include password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Check if user is active
  if (user.status !== UserStatus.ACTIVE) {
    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new ApiError(403, 'Account pending admin approval. Please wait for activation.');
    } else {
      throw new ApiError(403, 'Account not active. Please contact support.');
    }
  }

  // Check password
  const isPasswordValid = await user.isPasswordMatch(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Remove password from response
  const userResponse = {
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };

  new ApiResponse(
    200,
    {
      accessToken,
      refreshToken,
      user: userResponse,
    },
    'Login successful'
  ).send(res);
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // In a real implementation, verify OTP from Redis/database
  // For now, we'll accept any 6-digit OTP
  if (!/^\d{6}$/.test(otp)) {
    throw new ApiError(400, 'Invalid OTP format');
  }

  // Email verified successfully - status remains PENDING_VERIFICATION
  // Only admin can change user status

  // Generate tokens
  const _accessToken = generateAccessToken(user);
  const _refreshToken = generateRefreshToken(user);

  // Remove password from response
  const userResponse = {
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  new ApiResponse(
    201,
    { user: userResponse },
    'Email verified successfully. Your account is pending admin approval for activation.'
  ).send(res);
};

export const resendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Send OTP email
  await emailService.sendOtp(email, otp);

  // Store OTP in Redis or database for verification
  console.log(`OTP for ${email}: ${otp}`);

  new ApiResponse(
    200,
    { message: 'OTP sent to your email. Please verify to complete registration.' },
    'OTP resent successfully'
  ).send(res);
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  // Find user - only registered users can reset password
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'No account found with this email address. Please register first.');
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Send OTP email
  await emailService.sendOtp(email, otp);

  // Store OTP in Redis or database for verification
  console.log(`Password reset OTP for ${email}: ${otp}`);

  new ApiResponse(
    200,
    { message: 'Password reset OTP has been sent to your email.' },
    'Password reset OTP sent successfully'
  ).send(res);
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // In a real implementation, verify OTP from Redis/database
  if (!/^\d{6}$/.test(otp)) {
    throw new ApiError(400, 'Invalid OTP format');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  new ApiResponse(
    200,
    { message: 'Your password has been reset successfully.' },
    'Password reset successful'
  ).send(res);
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  // Verify refresh token
  const { verifyToken } = await import('@/utils/jwt.utility.js');
  const decoded = verifyToken(refreshToken);

  // Find user
  const user = await User.findById(decoded._id);
  if (!user) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  // Generate new tokens
  const { generateAccessToken, generateRefreshToken } = await import('@/utils/jwt.utility.js');
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  new ApiResponse(
    200,
    {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
    'Tokens refreshed successfully'
  ).send(res);
};

export const logout = async (req: Request, res: Response) => {
  // In a real implementation, you would:
  // 1. Add the token to a blacklist in Redis
  // 2. Remove the refresh token from the database
  // For now, we'll just return success

  new ApiResponse(200, { message: 'Logged out successfully.' }, 'Logged out successfully').send(
    res
  );
};

export const changePassword = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'User not authenticated');
  }

  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required');
  }

  if (currentPassword === newPassword) {
    throw new ApiError(400, 'New password must be different from current password');
  }

  // Validate new password strength
  if (newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters long');
  }

  // Get user from database - req.user._id is a string from JWT
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await user.isPasswordMatch(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  new ApiResponse(
    200,
    { message: 'Password changed successfully' },
    'Password changed successfully'
  ).send(res);
};

export const getMe = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'User not authenticated');
  }

  // Fetch complete user data from database
  const user = await User.findById(req.user._id).lean();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Remove password from response
  const userResponse = {
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };

  new ApiResponse(200, userResponse, 'Current user profile retrieved successfully').send(res);
};
