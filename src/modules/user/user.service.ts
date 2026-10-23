import { User } from "../../../generated/prisma/client";
import AppError from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import HashPassword from "../../shared/hashPassword";
import httpStatus from "http-status";

const create = async (payload: User) => {
  try {
    const isExist = await prisma.user.findFirst({
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

    payload['password'] = await HashPassword(payload?.password);

    if (isExist) {

      if (!isExist.verification?.status) {
        return await prisma.user.update({
          where: { id: isExist.id },
          data: payload,
        });
      }

      throw new AppError(
        httpStatus.CONFLICT,
        'User already exists and is verified',
      );
    }
    const result = await prisma.user.create({ data: payload });

    return result;
  } catch (error: any) {
    throw new AppError(httpStatus?.BAD_GATEWAY, error?.message);
  }
};

export const userService = {
  create
};
