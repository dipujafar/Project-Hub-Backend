import catchAsync from '../../utils/catchAsync';
import { Request, Response } from 'express';
import { authServices } from './auth.service';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import config from '../../config';
import AppError from '../../error/AppError';

const authCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: config.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  maxAge,
});

// login
const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authServices.login(req.body, req);
  const { accessToken, refreshToken } = result;

  res.cookie('accessToken', accessToken, authCookieOptions(7 * 24 * 60 * 60 * 1000));
  res.cookie(
    'refreshToken',
    refreshToken,
    authCookieOptions(30 * 24 * 60 * 60 * 1000),
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Logged in successfully',
    data: result,
  });
});

// change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const result = await authServices.changePassword(req?.user?.userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password changed successfully',
    data: result,
  });
});

// forgot password
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await authServices.forgotPassword(req?.body?.email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'An OTP sent to your email!',
    data: result,
  });
});

// reset password
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await authServices.resetPassword(
    req?.headers?.token as string,
    req?.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password reset successfully',
    data: result,
  });
});

// refresh token
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Refresh token is required');
  }
  const result = await authServices.refreshToken(token);
  res.cookie(
    'accessToken',
    result.accessToken,
    authCookieOptions(7 * 24 * 60 * 60 * 1000),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Access token retrieved successfully',
    data: result,
  });
});

export const authControllers = {
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  //   registerWithGoogle,
  //   registerWithFacebook,
};
