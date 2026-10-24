import { ProjectStatus } from '../../../generated/prisma/enums';
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { projectService } from './project.service';

const getAuthenticatedUserId = (userId: unknown): string => {
  if (typeof userId !== 'string' || userId.length === 0) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized');
  }
  return userId;
};

const create = catchAsync(async (req, res) => {
  const userId = getAuthenticatedUserId(req.user?.userId);
  const result = await projectService.create(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Project submitted successfully',
    data: result,
  });
});

const getMine = catchAsync(async (req, res) => {
  const userId = getAuthenticatedUserId(req.user?.userId);
  const result = await projectService.getMine(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Projects retrieved successfully',
    data: result,
  });
});

const getAll = catchAsync(async (req, res) => {
  const status = req.query.status as ProjectStatus | undefined;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);

  if (limit > 100) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Limit cannot exceed 100');
  }

  const result = await projectService.getAll({ status, page, limit });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Projects retrieved successfully',
    data: result.projects,
    meta: {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
      totalPage: result.meta.totalPages,
    },
  });
});

const getStats = catchAsync(async (_req, res) => {
  const result = await projectService.getStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project statistics retrieved successfully',
    data: result,
  });
});

const review = catchAsync(async (req, res) => {
  const reviewerId = getAuthenticatedUserId(req.user?.userId);
  const { id } = req.params;
  if (typeof id !== 'string') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid project ID');
  }
  const result = await projectService.review(
    id,
    req.body.status,
    reviewerId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project reviewed successfully',
    data: result,
  });
});

export const projectController = {
  create,
  getMine,
  getAll,
  getStats,
  review,
};
