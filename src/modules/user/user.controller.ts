import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { userService } from "./user.service";
import sendResponse from "../../utils/sendResponse";
import { otpServices } from "../otp/otp.service";
import httpStatus from "http-status";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.create(req.body);
  const sendOtp = await otpServices.resendOtp({ email: result?.email });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User created successfully',
    data: { user: result, otpToken: sendOtp },
  });
});

export const userController = {
  createUser,
};