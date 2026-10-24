import {
  IChangePassword,
  IJwtPayload,
  ILogin,
  IResetPassword,
} from './auth.interface';
import { prisma } from '../../lib/prisma';
import AppError from '../../error/AppError';
import httpStatus from 'http-status';
import { createToken, isPasswordMatched, verifyToken } from './user.utils';
import { Request } from 'express';
import bcrypt from 'bcrypt';
import moment from 'moment';
import path from 'path';

import fs from 'fs';
import config from '../../config';
import { generateOtp } from '../../utils/otpGenerator';
import { sendEmail } from '../../utils/mailSender';

const login = async (payload: ILogin, req: Request) => {
  payload.email = payload?.email?.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      email: payload.email,
    },
    include: {
      verification: {
        select: {
          status: true,
        },
      },
    },
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }


  if (!(await isPasswordMatched(payload.password, user.password))) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Password does not match');
  }

  if (!user?.verification?.status) {
    throw new AppError(httpStatus.FORBIDDEN, 'User account is not verified');
  }

  const jwtPayload: { userId: string; role: string } = {
    userId: user?.id?.toString() as string,
    role: user?.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as Parameters<typeof createToken>[2],
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as Parameters<typeof createToken>[2],
  );


  return {
    user,
    accessToken,
    refreshToken,
  };
};

const changePassword = async (id: string, payload: IChangePassword) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!(await isPasswordMatched(payload?.oldPassword, user.password))) {
    throw new AppError(httpStatus.FORBIDDEN, 'Old password does not match');
  }
  if (payload?.newPassword !== payload?.confirmPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'New password and confirm password do not match',
    );
  }

  const hashedPassword = await bcrypt.hash(
    payload?.newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  const result = await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
    },
  });

  return result;
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: { email },
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }


  const jwtPayload = {
    email: email,
    userId: user?.id,
  };

  const token = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    '3m',
  );

  const currentTime = new Date();
  const otp = generateOtp();
  const expiresAt = moment(currentTime).add(3, 'minute');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verification: {
        update: {
          otp: String(otp),
          expiredAt: expiresAt.toDate(),
        },
      },
    },
  });

  const otpEmailPath = path.join(
    __dirname,
    '../../../../public/view/forgot_pass_mail.html',
  );

  await sendEmail(
    user?.email,
    'Your reset password OTP is',
    fs
      .readFileSync(otpEmailPath, 'utf8')
      .replace('{{otp}}', otp)
      .replace('{{email}}', user?.email),
  );
  return { email, token };
};

// Reset password
const resetPassword = async (token: string, payload: IResetPassword) => {
  let decode;
  try {
    decode = verifyToken(token, config.jwt_access_secret as string);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err: any) {
    console.log(err);
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Session has expired. Please try again',
    );
  }
  const user = await prisma.user.findUnique({
    where: { id: decode?.userId },
    include: {
      verification: {
        select: {
          status: true,
          expiredAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // if (new Date() > (user?.verification?.expiredAt as Date)) {
  //   throw new AppError(httpStatus.FORBIDDEN, 'Session has expired');
  // }

  if (!user?.verification?.status) {
    throw new AppError(httpStatus.FORBIDDEN, 'OTP is not verified yet');
  }

  if (payload?.newPassword !== payload?.confirmPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'New password and confirm password do not match',
    );
  }

  const hashedPassword = await bcrypt.hash(
    payload?.newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  const result = await prisma.user.update({
    where: { id: decode?.userId },
    data: {
      password: hashedPassword,
      verification: {
        update: {
          otp: "0",
          status: true,
        },
      },
    },
  });

  return result;
};

const refreshToken = async (token: string) => {
  // Checking if the given token is valid
  const decoded = verifyToken(token, config.jwt_refresh_secret as string);
  const { userId } = decoded;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      verification: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }



  const jwtPayload: IJwtPayload = {
    userId: user?.id?.toString() as string,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as Parameters<typeof createToken>[2],
  );

  return {
    accessToken,
  };
};

export const authServices = {
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
};
