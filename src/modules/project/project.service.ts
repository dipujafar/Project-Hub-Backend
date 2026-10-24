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
  searchTerm?: string;
  page: number;
  limit: number;
}

const createProject = async (userId: string, payload: CreatePayload) => {
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

const getMyProjects = (userId: string) =>
  prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

const getAllPorjects = async ({ status, searchTerm, page, limit }: GetAllOptions) => {
  const where: Prisma.ProjectWhereInput = {
    ...(status ? { status } : {}),
    ...(searchTerm
      ? {
          OR: [
            { projectName: { contains: searchTerm, mode: 'insensitive' } },
            { repoUrl: { contains: searchTerm, mode: 'insensitive' } },
            { liveLink: { contains: searchTerm, mode: 'insensitive' } },
            {
              user: {
                is: {
                  OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { email: { contains: searchTerm, mode: 'insensitive' } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

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

const getPrjectStats = async () => {
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
  createProject,
  getMyProjects,
  getAllPorjects,
  getPrjectStats,
  review,
};
