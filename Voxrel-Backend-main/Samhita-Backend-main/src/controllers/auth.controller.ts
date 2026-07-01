import { catchAsync } from '@/utils/catch-async.utility.js';
import { Request, Response } from 'express';
import * as authService from '@/services/auth.service.js';

export const registerStartController = catchAsync(async (req: Request, res: Response) => {
  await authService.registerUser(req, res);
});

export const registerAdminController = catchAsync(async (req: Request, res: Response) => {
  await authService.registerAdmin(req, res);
});

export const registerVerifyController = catchAsync(async (req: Request, res: Response) => {
  await authService.verifyEmail(req, res);
});

export const loginController = catchAsync(async (req: Request, res: Response) => {
  await authService.loginUser(req, res);
});

export const resendOtpController = catchAsync(async (req: Request, res: Response) => {
  await authService.resendOtp(req, res);
});

export const forgotPasswordController = catchAsync(async (req: Request, res: Response) => {
  await authService.forgotPassword(req, res);
});

export const resetPasswordController = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req, res);
});

export const refreshTokenController = catchAsync(async (req: Request, res: Response) => {
  await authService.refreshToken(req, res);
});

export const logoutController = catchAsync(async (req: Request, res: Response) => {
  await authService.logout(req, res);
});

export const changePasswordController = catchAsync(async (req: Request, res: Response) => {
  await authService.changePassword(req, res);
});

export const getMeController = catchAsync(async (req: Request, res: Response) => {
  await authService.getMe(req, res);
});
