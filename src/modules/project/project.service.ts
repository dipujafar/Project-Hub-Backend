import { Prisma } from '../../../generated/prisma/client';
import { ProjectStatus } from '../../../generated/prisma/enums';
import AppError from '../../error/AppError';
import { prisma } from '../../lib/prisma';
import httpStatus from 'http-status';

interface CreatePayload {
  projectName: string;
  repoUrl: string;
  liveLink: string;
  description: string;
}

interface GetAllOptions {
  status?: ProjectStatus;
  page: number;
  limit: number;
}

const create = async (userId: string, payload: CreatePayload) => {
  try {
    return await prisma.project.create({
      data: { ...payload, userId },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        'This repository has already been submitted',
      );
    }
    throw error;
  }
};

const getMine = (userId: string) =>
  prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

const getAll = async ({ status, page, limit }: GetAllOptions) => {
  const where: Prisma.ProjectWhereInput = status ? { status } : {};

  const [projects, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

const getStats = async () => {
  const groups = await prisma.project.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const count = (status: ProjectStatus) =>
    groups.find(group => group.status === status)?._count._all ?? 0;

  const pending = count(ProjectStatus.PENDING);
  const approved = count(ProjectStatus.APPROVED);
  const rejected = count(ProjectStatus.REJECTED);

  return {
    total: pending + approved + rejected,
    pending,
    approved,
    rejected,
  };
};

const review = async (
  id: string,
  status: 'APPROVED' | 'REJECTED',
  reviewerId: string,
) => {
  const { count } = await prisma.project.updateMany({
    where: { id, status: ProjectStatus.PENDING },
    data: { status, reviewedAt: new Date(), reviewedById: reviewerId },
  });

  if (count === 0) {
    const exists = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });
    throw exists
      ? new AppError(httpStatus.CONFLICT, 'This project has already been reviewed')
      : new AppError(httpStatus.NOT_FOUND, 'Project not found');
  }

  return prisma.project.findUniqueOrThrow({ where: { id } });
};

export const projectService = {
  create,
  getMine,
  getAll,
  getStats,
  review,
};
